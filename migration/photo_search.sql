-- ZIPA — pretraga po POJEDINAČNOJ fotografiji
--
-- Do sada se pretraživala samo galerija: ako neko ukuca „Nikšić", dobijao je
-- celu galeriju od dve stotine fotografija, pa je morao sam da traži onu pravu.
-- Fotografije žive u jsonb nizu `gallery.photos`, nad kojim se ne može napraviti
-- upotrebljiv indeks — svaki upit bi razmotavao 202.411 zapisa.
--
-- Zato se pravi ravna tabela `photo_index`: jedan red po fotografiji, sa svojim
-- tekstom za pretragu i indeksima. Tabelu održava okidač na `gallery`, pa se
-- nikada ne popunjava ručno i ne može da se raziđe sa stanjem galerija.

-- ── Tabela ────────────────────────────────────────────────────────────────
drop table if exists photo_index cascade;

create table photo_index (
    "galleryId"     text    not null,
    idx             int     not null,          -- pozicija u nizu gallery.photos
    image           text,                      -- putanja do fajla (ključ na R2)
    name            text,
    description     text,
    author          text,
    location        text,
    date            bigint,
    keywords        jsonb   default '[]'::jsonb,

    -- prepisano sa galerije, da prikaz rezultata ne mora nazad u `gallery`
    "galleryName"   text,
    "galleryAlias"  text,
    "categoryId"    text[],
    "categoryName"  text,
    "userAlias"     text,
    "userName"      text,
    price           numeric,
    "isActive"      boolean default true,

    search_document text,

    -- Vektor za pretragu stoji u svojoj koloni, a ne kao izraz u indeksu.
    -- Kad je indeks na izrazu, upit mora da ga ponovi slovo u slovo da bi bio
    -- upotrebljen — inače Postgres tiho pređe na čitanje cele tabele.
    tsv tsvector generated always as
        (to_tsvector('simple', coalesce(search_document,''))) stored,

    primary key ("galleryId", idx)
);

-- ── Građenje redova za jednu galeriju ─────────────────────────────────────
-- Ključne reči fotografije nadopunjuju se ključnim rečima galerije: fotograf
-- retko kuca isto dvaput, a pretraga treba da nađe fotografiju i po onome što
-- je upisano za ceo događaj.
create or replace function photo_index_rows(g gallery)
returns table (
    "galleryId"    text,
    idx            int,
    image          text,
    name           text,
    description    text,
    author         text,
    location       text,
    date           bigint,
    keywords       jsonb,
    "galleryName"  text,
    "galleryAlias" text,
    "categoryId"   text[],
    "categoryName" text,
    "userAlias"    text,
    "userName"     text,
    price          numeric,
    "isActive"     boolean,
    search_document text
) language sql stable as $$
  select
      g."_id",
      (ph.ordinality - 1)::int,
      ph.value->>'image',
      ph.value->>'name',
      ph.value->>'description',
      ph.value->>'author',
      ph.value->>'location',
      nullif(ph.value->>'date','')::bigint,
      case when jsonb_typeof(ph.value->'keywords') = 'array'
           then ph.value->'keywords' else '[]'::jsonb end,

      g.name->>'ba',
      g.alias->>'ba',
      g.category,
      g."categoryName"->>'ba',
      g."userAlias",
      g."user",
      g.price,
      coalesce(g."isActive", true),

      unaccent(lower(concat_ws(' ',
          ph.value->>'name',
          ph.value->>'description',
          ph.value->>'author',
          ph.value->>'location',
          (select string_agg(v,' ') from jsonb_array_elements_text(
              case when jsonb_typeof(ph.value->'keywords') = 'array'
                   then ph.value->'keywords' else '[]'::jsonb end) v),
          -- kontekst galerije
          g.name->>'ba', g.name->>'en',
          g.location, g."user", g."categoryName"->>'ba',
          (select string_agg(v,' ') from jsonb_array_elements_text(
              coalesce(g.keywords->'ba','[]'::jsonb)) v),
          (select string_agg(v,' ') from jsonb_array_elements_text(
              coalesce(g.keywords->'en','[]'::jsonb)) v)
      )))
  from jsonb_array_elements(coalesce(g.photos,'[]'::jsonb)) with ordinality ph(value, ordinality);
$$;

-- Kolone se navode poimence: `tsv` se računa sam i u njega se ne sme upisivati.
create or replace function photo_index_insert(g gallery)
returns void language sql as $$
  insert into photo_index (
      "galleryId", idx, image, name, description, author, location, date, keywords,
      "galleryName", "galleryAlias", "categoryId", "categoryName",
      "userAlias", "userName", price, "isActive", search_document
  )
  select * from photo_index_rows(g);
$$;

-- ── Okidač ────────────────────────────────────────────────────────────────
create or replace function photo_index_sync()
returns trigger language plpgsql as $$
begin
    if (tg_op = 'DELETE') then
        delete from photo_index where "galleryId" = old."_id";
        return old;
    end if;

    delete from photo_index where "galleryId" = new."_id";
    perform photo_index_insert(new);
    return new;
end $$;

drop trigger if exists gallery_photo_index_ai on gallery;
create trigger gallery_photo_index_ai
after insert on gallery
for each row execute function photo_index_sync();

drop trigger if exists gallery_photo_index_au on gallery;
create trigger gallery_photo_index_au
after update on gallery
for each row
-- Samo kad se promeni nešto što se vidi u pretrazi. Bez ovog uslova bi svaka
-- poseta galeriji (koja upisuje brojač) ponovo gradila sve njene redove.
when (
    old.photos             is distinct from new.photos
    or old.name            is distinct from new.name
    or old.alias           is distinct from new.alias
    or old.keywords        is distinct from new.keywords
    or old.location        is distinct from new.location
    or old."user"          is distinct from new."user"
    or old."userAlias"     is distinct from new."userAlias"
    or old.category        is distinct from new.category
    or old."categoryName"  is distinct from new."categoryName"
    or old.price           is distinct from new.price
    or old."isActive"      is distinct from new."isActive"
)
execute function photo_index_sync();

drop trigger if exists gallery_photo_index_ad on gallery;
create trigger gallery_photo_index_ad
after delete on gallery
for each row execute function photo_index_sync();

-- ── Prvo punjenje ─────────────────────────────────────────────────────────
insert into photo_index (
    "galleryId", idx, image, name, description, author, location, date, keywords,
    "galleryName", "galleryAlias", "categoryId", "categoryName",
    "userAlias", "userName", price, "isActive", search_document
)
select r.* from gallery g, photo_index_rows(g) r;

-- ── Indeksi (posle punjenja — brže je) ────────────────────────────────────
create index if not exists photo_index_fts_idx
    on photo_index using gin (tsv);

create index if not exists photo_index_trgm_idx
    on photo_index using gin (search_document gin_trgm_ops);

create index if not exists photo_index_date_idx
    on photo_index (date desc nulls last);

create index if not exists photo_index_keywords_idx
    on photo_index using gin (keywords);

create index if not exists photo_index_gallery_idx
    on photo_index ("galleryId");

create index if not exists photo_index_category_idx
    on photo_index using gin ("categoryId");

analyze photo_index;
