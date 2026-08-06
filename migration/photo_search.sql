-- ZIPA — pretraga po POJEDINAČNOJ fotografiji (štedljiva verzija)
--
-- Do sada se pretraživala samo galerija: na „Nikšić" se dobijao ceo događaj od
-- dvesta fotografija, pa se prava tražila ručno. Fotografije žive u jsonb nizu
-- `gallery.photos`, nad kojim se ne može napraviti upotrebljiv indeks.
--
-- Prva verzija ove tabele čuvala je pun tekst za pretragu, i to dvaput, plus
-- trigram indekse — narasla je na 689 MB i oborila bazu u read-only. Ovde se
-- tekst NE čuva: drži se samo `tsvector`, a naziv galerije, cena i kategorija
-- se uzimaju spajanjem na `gallery` za onih 36 redova koji se prikazuju.
--
-- Posledica: nema tolerancije na slovne greške (za to je trebao trigram indeks
-- od 123 MB). Nedovršena reč i dalje radi, preko prefiksa u punom tekstu.

drop table if exists photo_index cascade;

create table photo_index (
    "galleryId" text    not null,
    idx         int     not null,   -- pozicija u nizu gallery.photos

    -- Samo ono što treba za sličicu u rezultatima. Ostalo se spaja iz galerije,
    -- jer bi vađenje iz `photos` niza čitalo ceo niz zbog jednog elementa.
    image       text,
    name        text,
    location    text,
    date        bigint,
    "isActive"  boolean default true,

    /*
     * Tekst za pretragu se ne čuva, samo njegov vektor — i to jedan.
     *
     * Prva verzija je držala dva vektora: jedan sa svime, drugi samo sa
     * podacima fotografije, da bi se poklapanje na fotografiji rangiralo
     * ispred poklapanja preko cele galerije. Ta dva su se skoro poklapala
     * (144 MB i 125 MB) — isti sadržaj upisan dvaput.
     *
     * Umesto toga: jedan vektor, ali označen. Podaci fotografije nose oznaku
     * „A", kontekst galerije oznaku „B", pa `ts_rank` sa različitim težinama
     * daje isti redosled bez druge kolone.
     */
    tsv         tsvector,

    primary key ("galleryId", idx)
);

-- ── Građenje redova za jednu galeriju ─────────────────────────────────────
-- Ključne reči fotografije nadopunjuju se ključnim rečima galerije: fotograf
-- retko kuca isto dvaput, a fotografija treba da se nađe i po onome što je
-- upisano za ceo događaj.
drop function if exists photo_index_insert(gallery);
drop function if exists photo_index_rows(gallery);

create function photo_index_rows(g gallery)
returns table (
    "galleryId" text,
    idx         int,
    image       text,
    name        text,
    location    text,
    date        bigint,
    "isActive"  boolean,
    tsv         tsvector
) language sql stable as $$
  select
      g."_id",
      (ph.ordinality - 1)::int,
      ph.value->>'image',
      ph.value->>'name',
      ph.value->>'location',
      nullif(ph.value->>'date','')::bigint,
      coalesce(g."isActive", true),

      -- „A" = upisano na samoj fotografiji, „B" = kontekst cele galerije.
      --
      -- `localCaption` je skriveni tekst: ulazi u pretragu kao i opis, ali se
      -- nigde ne prikazuje. Zato stoji ovde, a ne u kolonama iznad.
      setweight(to_tsvector('simple', unaccent(lower(concat_ws(' ',
          ph.value->>'name', ph.value->>'description',
          ph.value->>'author', ph.value->>'location',
          ph.value->>'localCaption',
          (select string_agg(v,' ') from jsonb_array_elements_text(
              case when jsonb_typeof(ph.value->'keywords') = 'array'
                   then ph.value->'keywords' else '[]'::jsonb end) v)
      )))), 'A')
      ||
      setweight(to_tsvector('simple', unaccent(lower(concat_ws(' ',
          g.name->>'ba', g.name->>'en',
          g.location, g."user", g."categoryName"->>'ba',
          (select string_agg(v,' ') from jsonb_array_elements_text(
              coalesce(g.keywords->'ba','[]'::jsonb)) v),
          (select string_agg(v,' ') from jsonb_array_elements_text(
              coalesce(g.keywords->'en','[]'::jsonb)) v)
      )))), 'B')
  from jsonb_array_elements(coalesce(g.photos,'[]'::jsonb)) with ordinality ph(value, ordinality);
$$;

create function photo_index_insert(g gallery)
returns void language sql as $$
  insert into photo_index ("galleryId", idx, image, name, location, date, "isActive", tsv)
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
    or old.keywords        is distinct from new.keywords
    or old.location        is distinct from new.location
    or old."user"          is distinct from new."user"
    or old."categoryName"  is distinct from new."categoryName"
    or old."isActive"      is distinct from new."isActive"
)
execute function photo_index_sync();

drop trigger if exists gallery_photo_index_ad on gallery;
create trigger gallery_photo_index_ad
after delete on gallery
for each row execute function photo_index_sync();

-- Popunjava se iz `popuni_photo_index.js`, u serijama — jedan upit nad svih
-- 202.411 fotografija Supabase prekine po isteku vremena.

-- ── Indeksi ───────────────────────────────────────────────────────────────
-- Prave se tek posle punjenja, u istoj skripti.
