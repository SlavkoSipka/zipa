-- ZIPA — rangiranje rezultata pretrage po fotografijama
--
-- `search_document` namerno sadrži i kontekst galerije (naziv događaja, grad,
-- fotograf, ključne reči cele galerije) da bi se fotografija našla i po onome
-- što nije upisano na njoj samoj. Nuspojava: fotografija koja pojam ima samo
-- preko galerije bila je ravnopravna sa onom kojoj pojam stoji u opisu ili
-- ključnim rečima.
--
-- Zato se sopstveni podaci fotografije čuvaju i odvojeno, pa se pri pretrazi
-- ono što je zaista upisano na fotografiji stavlja ispred konteksta.

alter table photo_index add column if not exists own_document text;

-- Menja se broj kolona koje funkcija vraća, pa se stara mora prvo ukloniti.
-- `photo_index_insert` je zavisi od nje, pa i ona ide sa njom.
drop function if exists photo_index_insert(gallery);
drop function if exists photo_index_rows(gallery);

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
    search_document text,
    own_document    text
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

      -- sve, uključujući kontekst galerije
      unaccent(lower(concat_ws(' ',
          ph.value->>'name', ph.value->>'description',
          ph.value->>'author', ph.value->>'location',
          (select string_agg(v,' ') from jsonb_array_elements_text(
              case when jsonb_typeof(ph.value->'keywords') = 'array'
                   then ph.value->'keywords' else '[]'::jsonb end) v),
          g.name->>'ba', g.name->>'en',
          g.location, g."user", g."categoryName"->>'ba',
          (select string_agg(v,' ') from jsonb_array_elements_text(
              coalesce(g.keywords->'ba','[]'::jsonb)) v),
          (select string_agg(v,' ') from jsonb_array_elements_text(
              coalesce(g.keywords->'en','[]'::jsonb)) v)
      ))),

      -- samo ono što je upisano na samoj fotografiji
      unaccent(lower(concat_ws(' ',
          ph.value->>'name', ph.value->>'description',
          ph.value->>'author', ph.value->>'location',
          (select string_agg(v,' ') from jsonb_array_elements_text(
              case when jsonb_typeof(ph.value->'keywords') = 'array'
                   then ph.value->'keywords' else '[]'::jsonb end) v)
      )))
  from jsonb_array_elements(coalesce(g.photos,'[]'::jsonb)) with ordinality ph(value, ordinality);
$$;

create or replace function photo_index_insert(g gallery)
returns void language sql as $$
  insert into photo_index (
      "galleryId", idx, image, name, description, author, location, date, keywords,
      "galleryName", "galleryAlias", "categoryId", "categoryName",
      "userAlias", "userName", price, "isActive", search_document, own_document
  )
  select * from photo_index_rows(g);
$$;

-- Postojeći redovi se popunjavaju iz skripte, u serijama po galerijama —
-- jedan upit nad 202.411 redova Supabase prekine po isteku vremena.

create index if not exists photo_index_own_trgm_idx
    on photo_index using gin (own_document gin_trgm_ops);

analyze photo_index;
