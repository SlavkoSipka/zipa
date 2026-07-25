#!/usr/bin/env python3
"""
Migracija ZIPA MongoDB dump (BSON) -> Supabase Postgres.

Upotreba:
    export DATABASE_URL='postgresql://postgres.<ref>:<password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
    python migrate.py [--dump-dir ../zipa_db_2026] [--only gallery,users] [--dry-run]

Pravila:
  - _id (ObjectId) se čuva kao hex string -> sve reference (uid, galleryId, category[]) rade bez izmena.
  - {ba, en} polja i nizovi objekata idu u jsonb.
  - Unix timestampi (float/int) -> bigint (zaokruženo). NaN -> NULL.
  - Typo polja iz starih zapisa se preskaču: 'permissons', 'emailVerfied' (kod koristi samo
    'permissions'/'emailVerified' koje svi dokumenti već imaju), 'form' u userResolutions.
"""
import argparse
import math
import os
import sys

import bson
import psycopg
from psycopg.types.json import Jsonb

DUMP_DIR_DEFAULT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "zipa_db_2026")

# tabela -> (kolone, set kolona koje su jsonb, set kolona koje su text[], set bigint/int kolona)
TABLES = {
    "users": dict(
        cols=["_id", "email", "pk", "emailVerified", "permissions", "name", "accountEnabled",
              "userRole", "profilePhoto", "userAlias", "lastLoginTimestamp", "address",
              "businessPhoneNumber", "city", "country", "phoneNumber", "webSite",
              "emailVerificationCode", "emailVerificationTimestamp", "registerTimestamp",
              "skype", "facebook", "instagram", "twitter", "biography",
              "resetPasswordVerificationCode", "_mysqlId"],
        arrays={"permissions"},
        ints={"lastLoginTimestamp", "emailVerificationTimestamp", "registerTimestamp", "_mysqlId"},
    ),
    "categories": dict(
        cols=["_id", "name", "alias", "isVisible", "photosCount", "isRecommended", "isSpecial",
              "isVisibleOnHome", "isVisibleOnNav", "position", "_mysqlId"],
        json={"name", "alias"},
        ints={"photosCount", "position", "_mysqlId"},
    ),
    "gallery": dict(
        cols=["_id", "name", "description", "keywords", "category", "location", "isActive",
              "userAlias", "user", "uid", "price", "alias", "orientationPortrait",
              "orientationHorizontal", "published", "date", "forcedDate", "requiredDate",
              "categoryName", "photos", "userDisabled", "_mysqlId"],
        json={"name", "description", "keywords", "alias", "categoryName", "photos"},
        arrays={"category"},
        ints={"published", "date", "forcedDate", "requiredDate", "_mysqlId"},
    ),
    "cart": dict(
        cols=["_id", "uid", "galleryId", "photoId", "resolution", "photo", "timestamp"],
        json={"photo"},
        ints={"photoId", "resolution", "timestamp"},
    ),
    "downloads": dict(
        cols=["_id", "uid", "transactionId", "galleryId", "photoId", "resolution", "photo", "timestamp"],
        json={"photo"},
        ints={"photoId", "resolution", "timestamp"},
    ),
    "transactions": dict(
        cols=["_id", "timestamp", "transaction"],
        json={"transaction"},
        ints={"timestamp"},
    ),
    "subscribers": dict(
        cols=["_id", "email", "timestamp"],
        ints={"timestamp"},
    ),
    "userResolutions": dict(
        cols=["_id", "uid", "resolution3000px", "resolution1500px", "resolution800px",
              "resolution300px", "categories", "photographers", "from", "to"],
        arrays={"categories", "photographers"},
        ints={"resolution3000px", "resolution1500px", "resolution800px", "resolution300px", "from", "to"},
    ),
    "banners": dict(
        cols=["_id", "name", "images", "published", "position", "footer", "leftSide",
              "rightSide", "detail", "sponsor", "ad", "hidden"],
        json={"images"},
        ints={"published", "position"},
    ),
    "bannerClicks": dict(
        cols=["_id", "url", "timestamp"],
        ints={"timestamp"},
    ),
    "slides": dict(
        cols=["_id", "title", "content", "image", "position", "published"],
        json={"title", "content"},
        ints={"position", "published"},
    ),
    "announcements": dict(
        cols=["_id", "content", "text", "from", "to", "published"],
        json={"content"},
        ints={"from", "to", "published"},
    ),
    "newsletters": dict(
        cols=["_id", "title", "content", "image", "status", "published", "galleries"],
        json={"title"},
        arrays={"galleries"},
        ints={"published"},
    ),
    "faq": dict(
        cols=["_id", "name", "content", "position", "published", "category", "alias"],
        json={"name", "content", "alias"},
        ints={"position", "published"},
    ),
    "faqCategories": dict(
        cols=["_id", "name", "alias", "position", "published"],
        json={"name", "alias"},
        ints={"position", "published"},
    ),
    "pages": dict(
        cols=["_id", "name", "alias", "content", "published"],
        json={"name", "alias", "content"},
        ints={"published"},
    ),
    "settings": dict(
        cols=["_id", "watermark", "logo", "footerLogo", "phoneNumber", "location", "facebook",
              "instagram", "twitter", "pinterest", "tumblr", "linkedin", "logoText", "email",
              "infoblock", "enableInfoBlocks", "showSlider", "showBanner"],
        json={"infoblock"},
    ),
    "gallerySettings": dict(
        cols=["_id", "uid", "galleryId", "status"],
    ),
}

BATCH = 500


def clean(value):
    """Rekurzivno očisti BSON vrednosti za JSON: ObjectId -> str, NaN -> None."""
    if isinstance(value, bson.ObjectId):
        return str(value)
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return value
    if isinstance(value, dict):
        return {k: clean(v) for k, v in value.items()}
    if isinstance(value, list):
        return [clean(v) for v in value]
    if isinstance(value, bytes):
        return value.decode("utf-8", "replace")
    return value


def to_int(value):
    if value is None:
        return None
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return round(value)
    if isinstance(value, (int,)):
        return value
    try:
        return round(float(value))
    except (TypeError, ValueError):
        return None


def convert_row(doc, spec):
    cols = spec["cols"]
    json_cols = spec.get("json", set())
    array_cols = spec.get("arrays", set())
    int_cols = spec.get("ints", set())
    row = []
    for col in cols:
        val = doc.get(col)
        val = clean(val)
        if col in int_cols:
            val = to_int(val)
        elif col in json_cols:
            val = Jsonb(val) if val is not None else None
        elif col in array_cols:
            if val is None:
                val = None
            elif isinstance(val, list):
                val = [str(x) for x in val if x is not None]
            else:
                val = [str(val)]
        row.append(val)
    return tuple(row)


def migrate_table(conn, dump_dir, table, spec, dry_run=False):
    path = os.path.join(dump_dir, f"{table}.bson")
    if not os.path.exists(path):
        print(f"  ! {table}: nema {path}, preskačem")
        return
    if os.path.getsize(path) == 0:
        print(f"  - {table}: prazan dump, preskačem")
        return

    cols = spec["cols"]
    col_sql = ", ".join(f'"{c}"' for c in cols)
    placeholders = ", ".join(["%s"] * len(cols))
    insert_sql = (
        f'insert into "{table}" ({col_sql}) values ({placeholders}) '
        f'on conflict ("_id") do nothing'
    )

    total = 0
    batch = []
    with open(path, "rb") as f, conn.cursor() as cur:
        for doc in bson.decode_file_iter(f):
            batch.append(convert_row(doc, spec))
            if len(batch) >= BATCH:
                if not dry_run:
                    cur.executemany(insert_sql, batch)
                total += len(batch)
                batch = []
                print(f"  {table}: {total}...", end="\r")
        if batch:
            if not dry_run:
                cur.executemany(insert_sql, batch)
            total += len(batch)
    conn.commit()
    print(f"  ✓ {table}: {total} redova" + (" (dry-run)" if dry_run else ""))


def verify(conn):
    print("\nProvera broja redova:")
    with conn.cursor() as cur:
        for table in TABLES:
            cur.execute(f'select count(*) from "{table}"')
            print(f"  {table}: {cur.fetchone()[0]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dump-dir", default=DUMP_DIR_DEFAULT)
    ap.add_argument("--only", help="lista tabela odvojena zarezom")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--verify", action="store_true", help="samo prebroj redove u bazi")
    args = ap.parse_args()

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        sys.exit("Postavi DATABASE_URL (Supabase -> Project Settings -> Database -> Connection string)")

    tables = TABLES
    if args.only:
        wanted = {t.strip() for t in args.only.split(",")}
        unknown = wanted - set(TABLES)
        if unknown:
            sys.exit(f"Nepoznate tabele: {unknown}")
        tables = {k: v for k, v in TABLES.items() if k in wanted}

    with psycopg.connect(db_url) as conn:
        if args.verify:
            verify(conn)
            return
        print(f"Migriram iz {os.path.abspath(args.dump_dir)}\n")
        for table, spec in tables.items():
            migrate_table(conn, args.dump_dir, table, spec, dry_run=args.dry_run)
        verify(conn)


if __name__ == "__main__":
    main()
