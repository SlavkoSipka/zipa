# ZIPA — migracija MongoDB → Supabase

Stara baza je **MongoDB dump** (`zipa_db_2026/*.bson`), a Supabase je Postgres.
Šema preslikava kolekcije 1:1 — **ista imena tabela i kolona** (camelCase) i **isti `_id` stringovi**,
tako da svi postojeći pozivi i reference (`uid`, `galleryId`, `category[]`...) rade bez remapiranja.

## Šta je u dump-u

| Kolekcija | Redova | Napomena |
|---|---|---|
| gallery | 9.965 | **202.411 fotografija** u `photos` nizovima (jsonb) |
| users | 122 | bcrypt hash u `pk` koloni |
| categories | 45 | dvojezično {ba, en} |
| bannerClicks | 1.009 | statistika klikova |
| faq / faqCategories | 59 / 11 | |
| subscribers | 62 | newsletter mejlovi |
| cart / downloads | 12 / 10 | |
| pages / banners / slides / settings / ostalo | malo | |
| transactions | 0 | prazan (kolone napravljene po kodu) |

## Koraci

1. Napravi Supabase projekat na [supabase.com](https://supabase.com) (region EU).
2. U **SQL Editor** nalepi i pokreni `schema.sql`.
3. Pokreni migraciju podataka:
   ```bash
   python3 -m venv venv && ./venv/bin/pip install pymongo "psycopg[binary]"
   export DATABASE_URL='postgresql://postgres.<ref>:<PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres'
   ./venv/bin/python migrate.py
   ```
   Skript je idempotentan (`on conflict do nothing`) — sme da se pokrene više puta.
   Na kraju ispiše broj redova po tabeli za proveru.

## Slike — Cloudflare R2

Fotografije su prebačene na Cloudflare R2 (bucket `zipa-photos`), istom strukturom
kakva je bila na starom serveru, pa putanje iz baze (`<fotograf>/<fajl>.jpg`) rade bez izmena:

```
originals/<fotograf>/<fajl>.jpg   68.804 fajla,  67 GB   PRIVATNO (prodaje se)
350x/<fotograf>/<fajl>.jpg       214.020 fajlova, 16 GB   thumbnail + watermark
700x/<fotograf>/<fajl>.jpg       213.999 fajlova, 40 GB   pregled + watermark
```

**Bucket je namerno privatan.** Pregledi se streamuju kroz API (`/photos/350x/...`,
`/photos/700x/...`), a originali samo kroz `/gallery/download/...` nakon provere prava —
tako se puna rezolucija ne može povući direktnim URL-om.

### ⚠️ Originali postoje samo za 2024–2026

Stari sajt je imao funkciju „obriši originale" po datumu, pa su originali starijih
galerija obrisani sa servera davno — nisu izgubljeni u migraciji:

| period | fotografija u aktivnim galerijama | ima original |
|---|---|---|
| 2024–2026 | 60.329 | ✅ 100% |
| 2015–2023 | 139.147 | 🔴 0% |

Pregledi (350x/700x) postoje za **sve** fotografije, tako da sajt vizuelno radi u
potpunosti. Detalj galerije vraća `originalIsOnServer` po fotografiji, a pokušaj
preuzimanja bez originala vraća uredno „Original fotografije nije dostupan" (404).
Treba proveriti sa klijentom da li postoji stariji bekap originala.

## Pokretanje sajta (povezan na Supabase)

API (`zipa24062026/api`) je povezan na Supabase preko novog `db.js` — Mongo-kompatibilan
sloj nad Postgresom, moduli (users/admin/products/site) NISU menjani osim sitnica
(bcrypt→bcryptjs, mongodb ObjectID→objectid.js). Stari Mongo db.js je sačuvan kao `db.mongo.js.bak`.

```bash
# API (port 10015)
cd zipa24062026/api && npm install && node app.js

# Sajt (port 10016; webpack assets na 3001)
cd zipa24062026/site && npm install && rm -rf node_modules/fsevents
NODE_OPTIONS=--openssl-legacy-provider npx razzle start
```

- Slike se serviraju iz R2 preko `storage.js` (S3 API). Obrada slika ide preko
  `sharp`-a umesto starog `easyimage`/ImageMagick-a — nema sistemskih zavisnosti.
- Kolekcije koje nisu bile u dump-u (logs, photoVisits, seo...) automatski se
  kreiraju u Supabase kao `(_id, doc jsonb)` tabele pri prvom upisu.
- Upload nove fotografije radi u memoriji: original + 350x/700x sa watermarkom
  (50% širine, centriran — isto kao ranije) idu pravo u R2.

### ⚠️ Pre postavljanja na server (Netlify/produkcija)

Kredencijali su trenutno upisani u kod radi lakšeg lokalnog rada. **Pre bilo kakvog
javnog deploya** prebaciti ih u env varijable i izbaciti iz koda:

| gde | šta |
|---|---|
| `api/constants.js` | `dbAuth.pgConnectionString` → `DATABASE_URL` |
| `api/storage.js` | R2 ključevi → `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET` |
| `api/users/constants.js` | `jwtSecretKey` → env |
| `api/sendMail.js` | SMTP lozinka → env |
| `site/src/constants.js` | `API_ENDPOINT` → URL produkcijskog API-ja |

Takođe: Netlify hostuje samo frontend — Express API mora zasebno (Render, Railway,
Fly.io ili VPS), pa `API_ENDPOINT` na sajtu pokazuje tamo.

## Napomene o podacima

- Typo polja iz starih zapisa se ne prenose: `permissons`, `emailVerfied`, `form` (kod koristi samo ispravne verzije koje svi dokumenti imaju).
- Unix timestampi → `bigint` (sekunde, kao i do sad). `NaN` datumi → `NULL`.
- RLS je uključen na svim tabelama: javni sadržaj (galerije, kategorije, FAQ...) ima "public read" polisu, sve ostalo ide preko `service_role` ključa iz backenda.
- Lozinke: bcrypt hashevi se prenose u `users.pk`, postojeći login kod nastavlja da radi. Ako kasnije pređemo na Supabase Auth, GoTrue podržava import bcrypt hasheva.
