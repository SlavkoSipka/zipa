-- ZIPA — priprema baze za BRZU i PAMETNU pretragu (Postgres/Supabase)
-- Radi na postojećoj strukturi, ne dira _id-jeve ni imena kolona.
-- Daje: full-text pretragu, toleranciju na slovne greške (fuzzy), autocomplete,
--       i podlogu za kasniju "pretragu po slici" (pgvector).

-- ── Ekstenzije ────────────────────────────────────────────────────────────
create extension if not exists unaccent;   -- č/ć/š/ž/đ + normalizacija
create extension if not exists pg_trgm;     -- fuzzy / typo tolerancija / autocomplete
create extension if not exists vector;      -- pgvector — za kasniju pretragu po slici (AI embeddings)

-- ── 1) GALLERY: jedinstveni tekst za pretragu ─────────────────────────────
-- Skupljamo sve što je bitno (naziv, opis, kljucne reci ba+en, lokacija,
-- fotograf, kategorija) u jednu normalizovanu (bez akcenata, mala slova) kolonu.
alter table gallery add column if not exists search_document text;

create or replace function gallery_build_search_document(g gallery)
returns text language sql stable as $$
  select unaccent(lower(concat_ws(' ',
    g.name->>'ba', g.name->>'en',
    g.description->>'ba', g.description->>'en',
    g.location, g."user", g."userAlias",
    g."categoryName"->>'ba', g."categoryName"->>'en',
    (select string_agg(v,' ') from jsonb_array_elements_text(coalesce(g.keywords->'ba','[]'::jsonb)) v),
    (select string_agg(v,' ') from jsonb_array_elements_text(coalesce(g.keywords->'en','[]'::jsonb)) v)
  )));
$$;

create or replace function gallery_search_trg()
returns trigger language plpgsql as $$
begin
  new.search_document := gallery_build_search_document(new);
  return new;
end $$;

drop trigger if exists gallery_search_biu on gallery;
create trigger gallery_search_biu
  before insert or update on gallery
  for each row execute function gallery_search_trg();

-- Popuni postojećih 9.965 redova
update gallery set search_document = gallery_build_search_document(gallery);

-- ── 2) Indeksi ────────────────────────────────────────────────────────────
-- Full-text (rangiranje po relevantnosti). 'simple' jer Postgres nema srpski
-- rečnik; unaccent + trigram to lepo pokrivaju.
create index if not exists gallery_fts_idx
  on gallery using gin (to_tsvector('simple', coalesce(search_document,'')));

-- Fuzzy / autocomplete / substring (ILIKE '%...%' i similarity())
create index if not exists gallery_trgm_idx
  on gallery using gin (search_document gin_trgm_ops);

-- ── 3) Podloga za pretragu PO SLICI (kasnije, kad budemo imali fajlove) ────
-- Svaka fotografija dobija "embedding" (vektor iz AI modela, npr. CLIP 512-dim).
-- Onda: "nadji slike slične ovoj" ili "protest noću sa zastavama" radi
-- preko vektorske sličnosti — što u Mongu nije bilo moguće.
-- Aktiviramo tek kad krenu embeddingi (treba pristup fajlovima):
-- alter table gallery add column if not exists embedding vector(512);
-- create index on gallery using hnsw (embedding vector_cosine_ops);

-- Napomena: pretraga radi na nivou galerije (galerija = "priča"/događaj,
-- baš kako dokument traži "story-centric"). Za pretragu po pojedinačnoj
-- fotografiji + embedding po slici, kasnije izdvajamo photos u zasebnu
-- tabelu "photo" (202k redova) — struktura ostaje kompatibilna.
