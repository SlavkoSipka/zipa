-- ZIPA — provera migracije. Nalepi ceo fajl u Supabase SQL Editor i pokreni.
-- Rezultat 1: brojevi redova (očekivano u komentaru)
-- Rezultat 2: broj "siročića" — referenci koje pokazuju na nepostojeći zapis (idealno svuda 0)

-- ========== 1) BROJEVI REDOVA ==========
select 'users' as tabela,           count(*) as redova, 122  as ocekivano from users
union all select 'categories',      count(*), 45   from categories
union all select 'gallery',         count(*), 9965 from gallery
union all select 'cart',            count(*), 12   from cart
union all select 'downloads',       count(*), 10   from downloads
union all select 'transactions',    count(*), 0    from transactions
union all select 'subscribers',     count(*), 62   from subscribers
union all select 'userResolutions', count(*), 3    from "userResolutions"
union all select 'banners',         count(*), 11   from banners
union all select 'bannerClicks',    count(*), 1009 from "bannerClicks"
union all select 'slides',          count(*), 2    from slides
union all select 'announcements',   count(*), 1    from announcements
union all select 'newsletters',     count(*), 5    from newsletters
union all select 'faq',             count(*), 59   from faq
union all select 'faqCategories',   count(*), 11   from "faqCategories"
union all select 'pages',           count(*), 7    from pages
union all select 'settings',        count(*), 1    from settings
union all select 'gallerySettings', count(*), 3    from "gallerySettings"
order by 1;

-- ========== 2) PROVERA REFERENCI (siročići) ==========
select 'gallery.uid -> users' as veza,
       count(*) as sirocici
  from gallery g where g."uid" is not null
   and not exists (select 1 from users u where u."_id" = g."uid")
union all
select 'gallery.category[] -> categories', count(*)
  from (select unnest("category") as cid from gallery) x
 where not exists (select 1 from categories c where c."_id" = x.cid)
union all
select 'cart.uid -> users', count(*)
  from cart where "uid" is not null
   and not exists (select 1 from users u where u."_id" = cart."uid")
union all
select 'cart.galleryId -> gallery', count(*)
  from cart where "galleryId" is not null
   and not exists (select 1 from gallery g where g."_id" = cart."galleryId")
union all
select 'downloads.uid -> users', count(*)
  from downloads where "uid" is not null
   and not exists (select 1 from users u where u."_id" = downloads."uid")
union all
select 'downloads.galleryId -> gallery', count(*)
  from downloads where "galleryId" is not null
   and not exists (select 1 from gallery g where g."_id" = downloads."galleryId")
union all
select 'userResolutions.uid -> users', count(*)
  from "userResolutions" r where r."uid" is not null
   and not exists (select 1 from users u where u."_id" = r."uid")
union all
select 'gallerySettings.uid -> users', count(*)
  from "gallerySettings" s where s."uid" is not null
   and not exists (select 1 from users u where u."_id" = s."uid")
union all
select 'gallerySettings.galleryId -> gallery', count(*)
  from "gallerySettings" s where s."galleryId" is not null
   and not exists (select 1 from gallery g where g."_id" = s."galleryId")
union all
select 'faq.category -> faqCategories', count(*)
  from faq where "category" is not null
   and not exists (select 1 from "faqCategories" fc where fc."_id" = faq."category")
union all
select 'newsletters.galleries[] -> gallery', count(*)
  from (select unnest("galleries") as gid from newsletters) x
 where not exists (select 1 from gallery g where g."_id" = x.gid)
order by 1;

-- ========== 3) BROJ FOTOGRAFIJA (očekivano 202411) ==========
select sum(jsonb_array_length("photos")) as ukupno_fotografija
  from gallery where "photos" is not null;
