-- ZIPA Photo — Supabase (Postgres) šema
-- Preslikava MongoDB kolekcije 1:1 — ista imena tabela i kolona (camelCase, pod navodnicima)
-- da bi postojeći API pozivi i polja na sajtu radili bez preimenovanja.
-- _id ostaje tekst (Mongo ObjectId hex string) da sve reference (uid, galleryId, category...) rade bez remapiranja.

-- ============ users ============
create table if not exists users (
    "_id"                            text primary key,
    "email"                          text not null,
    "pk"                             text,              -- bcrypt hash lozinke (iz starog sistema)
    "emailVerified"                  boolean default false,
    "permissions"                    text[] default '{}',
    "name"                           text,
    "accountEnabled"                 boolean default true,
    "userRole"                       text,
    "profilePhoto"                   text,
    "userAlias"                      text,
    "lastLoginTimestamp"             bigint,
    "address"                        text,
    "businessPhoneNumber"            text,
    "city"                           text,
    "country"                        text,
    "phoneNumber"                    text,
    "webSite"                        text,
    "emailVerificationCode"          text,
    "emailVerificationTimestamp"     bigint,
    "registerTimestamp"              bigint,
    "previousLoginTimestamp"         bigint,   -- prijava pre trenutne (za prikaz na profilu)
    "skype"                          text,
    "facebook"                       text,
    "instagram"                      text,
    "twitter"                        text,
    "biography"                      text,
    "resetPasswordVerificationCode"  text,
    "_mysqlId"                       bigint
);
create unique index if not exists users_email_idx on users (lower("email"));
create index if not exists users_useralias_idx on users ("userAlias");

-- ============ categories ============
create table if not exists categories (
    "_id"             text primary key,
    "name"            jsonb,          -- {ba, en}
    "alias"           jsonb,          -- {ba, en}
    "isVisible"       boolean default true,
    "photosCount"     bigint default 0,
    "isRecommended"   boolean default false,
    "isSpecial"       boolean default false,
    "isVisibleOnHome" boolean default false,
    "isVisibleOnNav"  boolean default false,
    "position"        int default 0,
    "_mysqlId"        bigint
);

-- ============ gallery ============
create table if not exists gallery (
    "_id"                   text primary key,
    "name"                  jsonb,   -- {ba, en}
    "description"           jsonb,   -- {ba, en}
    "keywords"              jsonb,   -- {ba: [], en: []}
    "category"              text[],  -- id-jevi iz categories
    "location"              text,
    "isActive"              boolean default true,
    "userAlias"             text,
    "user"                  text,    -- ime fotografa (denormalizovano, kao u Mongu)
    "uid"                   text,    -- users._id
    "price"                 numeric,
    "alias"                 jsonb,   -- {ba, en}
    "orientationPortrait"   boolean,
    "orientationHorizontal" boolean,
    "published"             bigint,
    "date"                  bigint,
    "forcedDate"            bigint,
    "requiredDate"          bigint,
    "categoryName"          jsonb,   -- {ba, en}
    "photos"                jsonb,   -- niz photo objekata (name, width, height, image, author...)
    "userDisabled"          boolean,
    "_mysqlId"              bigint
);
create index if not exists gallery_uid_idx        on gallery ("uid");
create index if not exists gallery_category_idx   on gallery using gin ("category");
create index if not exists gallery_published_idx  on gallery ("published" desc);
create index if not exists gallery_keywords_idx   on gallery using gin ("keywords");
create index if not exists gallery_isactive_idx   on gallery ("isActive");

-- ============ cart ============
create table if not exists cart (
    "_id"        text primary key,
    "uid"        text,
    "galleryId"  text,
    "photoId"    int,
    "resolution" int,
    "photo"      jsonb,
    "timestamp"  bigint
);
create index if not exists cart_uid_idx on cart ("uid");

-- ============ downloads ============
create table if not exists downloads (
    "_id"           text primary key,
    "uid"           text,
    "transactionId" text,
    "galleryId"     text,
    "photoId"       int,
    "resolution"    int,
    "photo"         jsonb,
    "timestamp"     bigint
);
create index if not exists downloads_uid_idx on downloads ("uid");

-- ============ transactions ============
-- (dump je prazan; kolone prema kodu iz users.js:1332)
create table if not exists transactions (
    "_id"         text primary key,
    "timestamp"   bigint,
    "transaction" jsonb    -- ceo PayPal transaction objekat
);

-- ============ subscribers ============
create table if not exists subscribers (
    "_id"       text primary key,
    "email"     text not null,
    "timestamp" bigint
);

-- ============ userResolutions ============
-- (pretplatnički paketi: koliko preuzimanja po rezoluciji, koje kategorije/fotografi, period)
create table if not exists "userResolutions" (
    "_id"             text primary key,
    "uid"             text,
    "resolution3000px" int default 0,
    "resolution1500px" int default 0,
    "resolution800px"  int default 0,
    "resolution300px"  int default 0,
    "categories"      text[],
    "photographers"   text[],
    "from"            bigint,
    "to"              bigint
);
create index if not exists userresolutions_uid_idx on "userResolutions" ("uid");

-- ============ banners ============
create table if not exists banners (
    "_id"       text primary key,
    "name"      text,
    "images"    jsonb,   -- [{image, link}]
    "published" bigint,
    "position"  int,
    "footer"    boolean default false,
    "leftSide"  boolean default false,
    "rightSide" boolean default false,
    "detail"    boolean default false,
    "sponsor"   boolean default false,
    "ad"        boolean default false,
    "hidden"    boolean default false
);

-- ============ bannerClicks ============
create table if not exists "bannerClicks" (
    "_id"       text primary key,
    "url"       text,
    "bannerId"  text,      -- koji je baner kliknut (adresa ume da se menja)
    "timestamp" bigint
);

-- ============ slides ============
create table if not exists slides (
    "_id"       text primary key,
    "title"     jsonb,
    "content"   jsonb,
    "image"     text,
    "position"  int,
    "published" bigint
);

-- ============ announcements ============
create table if not exists announcements (
    "_id"       text primary key,
    "content"   jsonb,
    "text"      text,
    "from"      bigint,
    "to"        bigint,
    "published" bigint
);

-- ============ newsletters ============
create table if not exists newsletters (
    "_id"       text primary key,
    "title"     jsonb,
    "content"   text,     -- HTML
    "image"     text,
    "status"    text,
    "published" bigint,
    "galleries" text[]
);

-- ============ faq ============
create table if not exists faq (
    "_id"       text primary key,
    "name"      jsonb,
    "content"   jsonb,
    "position"  int,
    "published" bigint,
    "category"  text,    -- faqCategories._id
    "alias"     jsonb
);

-- ============ faqCategories ============
create table if not exists "faqCategories" (
    "_id"       text primary key,
    "name"      jsonb,
    "alias"     jsonb,
    "position"  int,
    "published" bigint
);

-- ============ pages ============
create table if not exists pages (
    "_id"       text primary key,
    "name"      jsonb,
    "alias"     jsonb,
    "content"   jsonb,
    "published" bigint
);

-- ============ settings (jedan red) ============
create table if not exists settings (
    "_id"              text primary key,
    "watermark"        text,
    "logo"             text,
    "footerLogo"       text,
    "phoneNumber"      text,
    "location"         text,
    "facebook"         text,
    "instagram"        text,
    "twitter"          text,
    "pinterest"        text,
    "tumblr"           text,
    "linkedin"         text,
    "logoText"         text,
    "email"            text,
    "infoblock"        jsonb,
    "defaultPhotoPrice" numeric,   -- podrazumevana cena nove galerije (KM)
    "enableInfoBlocks" boolean default true,
    "showSlider"       boolean default true,
    "showBanner"       boolean default true
);

-- ============ gallerySettings ============
-- (obaveštenja: koji korisnik prati koju galeriju)
create table if not exists "gallerySettings" (
    "_id"       text primary key,
    "uid"       text,
    "galleryId" text,
    "status"    boolean
);
create index if not exists gallerysettings_uid_idx on "gallerySettings" ("uid");


-- ============ loginHistory ============
-- Evidencija prijava: ko se od registrovanih korisnika i kada prijavljivao.
create table if not exists "loginHistory" (
    "_id"       text primary key,
    "uid"       text,
    "timestamp" bigint,
    "ip"        text,
    "userAgent" text
);
create index if not exists loginhistory_ts_idx  on "loginHistory" ("timestamp" desc);
create index if not exists loginhistory_uid_idx on "loginHistory" ("uid");

-- ============ RLS ============
-- Uključujemo RLS na svim tabelama; pristup ide preko service_role ključa (backend/API),
-- tako da anon ključ ne može ništa da čita/piše dok ne definišemo prave polise.
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
      and tablename in ('users','categories','gallery','cart','downloads','transactions',
                        'subscribers','userResolutions','banners','bannerClicks','slides',
                        'announcements','newsletters','faq','faqCategories','pages',
                        'settings','gallerySettings')
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Javno čitanje sadržaja koji je i na starom sajtu javan:
create policy "public read" on categories       for select using (true);
create policy "public read" on gallery          for select using ("isActive" is true);
create policy "public read" on banners          for select using (hidden is not true);
create policy "public read" on slides           for select using (true);
create policy "public read" on announcements    for select using (true);
create policy "public read" on faq              for select using (true);
create policy "public read" on "faqCategories"  for select using (true);
create policy "public read" on pages            for select using (true);
create policy "public read" on settings         for select using (true);
