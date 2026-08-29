# Popis administracije — 2026-08-28

Snimak zatečenog stanja **pre** bilo kakve izmene. Ništa nije menjano; baza je
samo čitana.

`views/account/` ima **47 fajlova**. Od toga **43 imaju rutu**, 2 su mrtva, a 2
nisu ekrani administracije nego javne strane koje su tu zalutale.

Merenja trajanja su na lokalnom API-ju prema **živoj** bazi (Supabase, eu-west-1),
pa nose i mrežno kašnjenje — odnos među njima je tačan, apsolutni broj je gornja
granica.

---

## 1. Svi ekrani

Oblik: **spisak** (tabela zapisa), **obrazac** (unos jednog zapisa),
**statistika** (brojevi i grafikoni), **mešano**.

### Sadržaj (16)

| Ekran | Ruta | Oblik |
|---|---|---|
| `bannersPage` | `/account/banners` | spisak |
| `bannerPage` | `/account/banners/:id` | obrazac |
| `announcementsPage` | `/account/announcements` | spisak |
| `announcementPage` | `/account/announcements/:id` | obrazac |
| `slidesPage` | `/account/slides` | spisak |
| `slidePage` | `/account/slides/:id` | obrazac |
| `faqsPage` | `/account/faq` | spisak |
| `faqPage` | `/account/faq/:id` | obrazac |
| `faqCategoriesPage` | `/account/faqCategories` | spisak |
| `faqCategoryPage` | `/account/faqCategories/:id` | obrazac |
| `pagesPage` | `/account/pages` | spisak |
| `pageItemPage` | `/account/pages/:id` | obrazac |
| `categoriesPage` | `/account/categories` | spisak *(uređivanje u redu — prekidači i pozicija)* |
| `categoryPage` | `/account/categories/:id` | obrazac |
| `blogPage` | `/account/news` | spisak |
| `blogItemPage` | `/account/news/:id` | obrazac |

### Galerije i fotografije (4)

| Ekran | Ruta | Oblik |
|---|---|---|
| `galleriesPage` | `/account/galleries` | spisak |
| `changeGallery` | `/account/gallery/:id`, `/account/gallery-photographer/:uid/:id` | obrazac *(postavljanje fotografija)* |
| `previewPage` | `/account/preview/:id` | mešano |
| `watermarksPage` | `/account/watermarks` | mešano *(zbirka + postavljanje)* |

### Korisnici i pretplatnici (8)

| Ekran | Ruta | Oblik |
|---|---|---|
| `usersPage` | `/account/users` | spisak *(sa straničenjem i pretragom)* |
| `editAdminUser` | `/account/users/:id` | obrazac |
| `agencySettings` | `/account/agency-settings/:uid` | obrazac |
| `subscribers` | `/account/subscribers` | spisak |
| `import` | `/account/subscribers/import` | obrazac |
| `newslettersPage` | `/account/newsletter` | spisak |
| `newsletterPage` | `/account/newsletter/:id` | obrazac |
| `profilePage` | `/account/profile` | mešano *(nadzorna ploča)* |

### Statistika i evidencija (7)

| Ekran | Ruta | Oblik |
|---|---|---|
| `archiveStats` | `/account/archive-stats` | statistika |
| `galleryStats` | `/account/gallery-stats` | statistika |
| `photographerStats` | `/account/photographer-stats` | statistika |
| `bannerStats` | `/account/banner-stats` | statistika |
| `todayVisits` | `/account/today-visits` | statistika |
| `photoVisits` | `/account/photo-visits` | statistika |
| `logsPage` | `/account/logs` | spisak |
| `downloadLogs` | `/account/download-logs` | spisak |

*(osam redova — `logsPage` i `downloadLogs` su evidencija, ne statistika)*

### Podešavanja (1)

| Ekran | Ruta | Oblik |
|---|---|---|
| `siteSettings` | `/account/settings` | obrazac |

### Nalog prijavljenog korisnika (5)

Nisu administracija, ali stoje u istom folderu.

| Ekran | Ruta | Oblik |
|---|---|---|
| `editAccountPage` | `/account/edit` | obrazac |
| `changePassword` | `/account/change-password` | obrazac |
| `downloadsPage` | `/account/downloads` | spisak |
| `emailVerifyPage` | `/account/verify/:uid/:kod` | poruka |
| `changePasswordPage` | `/reset-password/:uid/:kod` | obrazac |

### Javne strane u `views/account/` (2)

| Ekran | Ruta | Napomena |
|---|---|---|
| `loginPage` | `/login` | javna prijava |
| `registerPage` | `/register` | javna registracija |
| `resetPasswordPage` | `/reset-password` | javna |

---

## 2. Koje API rute svaki ekran zove

Zajedničko: **svih šest ekrana statistike** i `profilePage` u `componentDidMount`
zovu isti trojac — `/admin/statistics`, `/announcements`,
`/photographer/statistics` — bez obzira na to šta prikazuju. To je posledica
kopiranja, ne potrebe (vidi 3.9).

| Ekran | Rute | Šta vraćaju |
|---|---|---|
| `bannersPage` | `GET /banners/all`, `DELETE /banners/delete/:id` | niz banera; prazan objekat |
| `bannerPage` | `GET /banners/get/:id`, `GET /banners/all`, `POST /banners/update/:id` | jedan baner; niz; `{}` |
| `announcementsPage` | `GET /announcements/all`, `DELETE /announcements/delete/:id` | niz najava (bez filtera po datumu) |
| `announcementPage` | `GET /announcements/get/:id`, `POST /announcements/update/:id` | jedna najava; `{}` |
| `slidesPage` / `slidePage` | `/slides/all`, `/slides/get/:id`, `/slides/update/:id`, `DELETE /slides/delete/:id` | niz / jedan slajd |
| `faqsPage` / `faqPage` | `/faq/all`, `/faq/get/:id`, `/faqCategories/all`, `/faq/update/:id`, `DELETE /faq/delete/:id` | niz pitanja; kategorije za padajući spisak |
| `faqCategoriesPage` / `faqCategoryPage` | `/faqCategories/*` | isto po uzoru |
| `pagesPage` / `pageItemPage` | `/pages/all`, `/pages/get/:id`, `/pages/update/:id` | sadržajne strane |
| `categoriesPage` | `GET /all-cateogires` *(tako se piše u kodu)*, `POST /categories/update/:id` | sve kategorije uklj. nevidljive (45), a `/categories` vraća samo vidljive (43) |
| `categoryPage` | `/categories/get/:id`, `/categories/all`, `/categories/update/:id` | jedna kategorija |
| `blogPage` / `blogItemPage` | `/blog/all`, `/blog/get/:id`, `/blog/update/:id` | blog — vidi 4. |
| `galleriesPage` | `loadData: /user/gallery`, `DELETE /gallery/delete/:id` | galerije prijavljenog |
| `changeGallery` | `/gallery/fetch/:id`, `/gallery/update/:id`, `/gallery/photos/upload`, i `photographer/` varijante | galerija + postavljanje fotografija |
| `watermarksPage` | `/watermarks/all`, `/upload`, `/watermarks/update/new`, `/watermarks/activate/:id`, `DELETE /watermarks/delete/:id` | zbirka žigova |
| `usersPage` | `loadData: POST /users/all`, `/users/change/emailVerified/:id/:v`, `/users/change/accountEnabled/:id/:v`, `GET /users/gallery-count/:id`, `DELETE /users/delete/:id` | straničen spisak; broj galerija pre brisanja |
| `editAdminUser` | `/users/get/:id`, `/users/edit/:id` | jedan korisnik |
| `agencySettings` | `loadData: POST /gallery/all/:uid`, `/gallery/user-resolutions/:uid` | galerije i cene po rezoluciji za jednog korisnika |
| `subscribers` | `/subscribers/all`, `/subscribers/delete/:id` | 62 pretplatnika |
| `import` | `POST /newsletter/import` | uvoz adresa |
| `newslettersPage` | `/newsletter/all`, `/subscribers/all`, `/newsletter/send/test/:id`, `/newsletter/send/:id`, `DELETE /newsletter/delete/:id` | 5 newslettera; broj primalaca |
| `newsletterPage` | `/newsletter/get/:id`, `/newsletter/update/:id` | jedan newsletter |
| `siteSettings` | `GET /settings`, `POST /settings/update` | jedan zapis podešavanja (24 polja) |
| `logsPage` | `loadData: POST /logs` | `{items, total, totalItems}` |
| `downloadLogs` | `loadData: POST /downloads` | `{items, total, totalItems}` |
| `archiveStats` | `GET /admin/archive-stats` | vidi 3.1 |
| `todayVisits`, `galleryStats`, `photographerStats`, `bannerStats`, `photoVisits`, `profilePage`, `previewPage` | `GET/POST /admin/statistics`, `GET /photographer/statistics`, `GET /announcements` | vidi 3.2 |

---

## 3. STATISTIKA — šta se danas stvarno može dobiti

### 3.0 Prvo, koliko podataka uopšte postoji

Ovo određuje sve ostalo.

| Tabela | Redova | Vremenski raspon |
|---|---|---|
| `gallery` | 9.965 | 12.02.1995. — 17.05.2026. |
| `logs` (posete) | **2.025** | **13.07.2026. — 27.08.2026.** |
| `bannerClicks` | 1.011 | 21.12.2020. — 20.08.2026. |
| `photoVisits` | **131** | **04.08.2026. — 27.08.2026.** |
| `downloads` | **10** | 25.12.2020. — 26.11.2024. |
| `transactions` | **0** | — |
| `users` | 127 | — |

**Dve stvari koje treba znati pre nego što se planira nadzorna ploča:**

1. **Istorija poseta praktično ne postoji.** `logs` ima 45 dana, `photoVisits`
   24 dana. `admin.js` to i kaže u komentaru: evidencija poseta nije stigla u
   bazi preuzetoj od prethodnog izvođača. Sve „kroz vreme" za posete počinje
   od jula 2026.
2. **Prihoda nema.** `transactions` je **prazna**, `downloads` ima **10 redova**
   od kojih poslednji iz 2024. Sva polja o zaradi (`todayEarnings`,
   `currentMonthEarnings`…) danas vraćaju **0** — ne zato što je nula, nego
   zato što nema šta da se sabere. PayPal je u probnom režimu.

### 3.1 `GET /admin/archive-stats` — rast arhive

Najkorisniji i najjeftiniji podatak koji sajt danas ima.

**Parametri:** nema. **Trajanje:** ~0,70 s (3 merenja: 0,75 / 0,70 / 0,68).

```
{
  ukupno:  { galerija:int 9899, fotografija:int 202411, fotografa:int 48,
             prva:"12.02.1995.", poslednja:"17.05.2026." }
  godine:  [ { godina:int, galerija:int, fotografija:int, fotografa:int } ]   ← 14 redova, 1995–2026
  fotografi:[ { ime:string, galerija:int, fotografija:int } ]                 ← 15 najplodnijih
}
```

**Vremenska dimenzija:** **da, i to je jedina prava** — po godinama, od 1995.
Može se crtati rast arhive kroz 31 godinu.

**Težina:** tri `GROUP BY` nad `gallery` (9.965 redova) sa
`jsonb_array_length` nad `photos`. Puno skeniranje tabele, ali tabela je mala.
**Svakodnevno pozivanje ne smeta**; više puta u minutu bi bilo rasipanje —
podatak se menja tek kad neko postavi galeriju.

### 3.2 `GET /admin/statistics` — zbirni pregled

**Parametri:** nema (GET). **Trajanje:** ~1,6–2,4 s — **najskuplji poziv u
administraciji.**

```
photosCount:int 9694          galerija (aktivnih, neisključenih)
photographersCount:int 62
totalDownloads:int 10
todayDownloads:int 0
todayEarnings / yesterdayEarnings / currentMonthEarnings / prevMonthEarnings : int   ← sve 0, vidi 3.0
visitsPerDay:  [ { timestamp:int, count:int } ]        ← poslednjih 10 dana
todayVisits:   [ { url:string, count:int } ]           ← danas, po adresi
todayVisitsCount:int
lastTransactions: [ ]                                   ← uvek prazno
photographers: [ { _id, userAlias, name, uploadedGalleryCount:int, uploadedPhotosCount:int } ]   ← 70 redova
bannerClicks:  [ ]                                      ← prazno bez opsega, vidi 3.4
galleryVisits: [ { _id, name, visits:int, photos } ]    ← poslednjih 5 dana
```

**Vremenska dimenzija:** delimično. `visitsPerDay` je 10 dana i **jedini niz
koji se može direktno nacrtati**. Ostalo su trenutni brojevi.

**Težina: visoka i nepotrebno.** Jedan poziv radi ~10 odvojenih upita:
`countDocuments` nad `downloads`, `gallery`, `users`; dve agregacije nad `logs`;
`photographerUploadStats` (`LEFT JOIN users×gallery` sa `jsonb_array_length` po
redu — 70 redova preko 9.965 galerija); `galleryVisitStats` nad `photoVisits`;
plus po jedan `findOne` nad `transactions` i `users` za svako od poslednja 4
preuzimanja. **Šest ekrana zove ovo pri svakom otvaranju, i svaki dobija ceo
paket iako koristi jedan njegov deo.** Ako nadzorna ploča bude osvežavana često,
ovo je prvo mesto koje treba razdvojiti.

### 3.3 `POST /admin/statistics` — isto, ali za opseg

**Parametri:** `{ from:int, to:int }` (unix sekunde). **Trajanje:** ~2,4 s.

Isti oblik, ali:
- `visitsPerDay` pokriva traženi opseg (na 30 dana → 22 reda)
- `todayVisits` postaje **spisak adresa za ceo opseg** (212 redova), uprkos imenu
- `bannerClicks` se popunjava **samo ovde** (2 reda za 30 dana)
- `galleryVisits` pokriva opseg (9 redova)

**Vremenska dimenzija: da**, ovo je jedini poziv koji prihvata opseg.

### 3.4 Klikovi na banere — `bannerClicks` unutar 3.3

```
[ { name:string (ili grupa), count:int } ]
```

Upit: `GROUP BY` nad `"bannerClicks"` sa `where timestamp between $1 and $2`.

**Vremenska dimenzija: da, i to najduža za posete-slične podatke** — 1.011
klikova od decembra 2020. **Ovo je jedini trag ponašanja posetilaca koji seže
pre jula 2026.**

**Težina:** mala, tabela ima 1.011 redova.

**Ali:** vraća se **samo** uz `POST` sa opsegom. `GET /admin/statistics` uvek
vraća prazan niz, pa ekran koji ne pošalje opseg misli da klikova nema.

### 3.5 Posete fotografijama — `galleryVisits` i `/photographer/statistics`

`galleryVisits` (u 3.2/3.3): `[{ _id, name, visits:int, photos }]` — najgledanije
galerije u opsegu. Bez opsega uzima **poslednjih 5 dana**.

`GET /photographer/statistics` (`photoVisits` ekran):
- **Prava:** `photographer` + `change-gallery` — administratoru prolazi preko `*`,
  ali vraća **prazan niz** jer filtrira po `galleryUid` = *njegov* id.
- Vraća `[{ photo:{...}, count:int }]`, sortirano opadajuće.
- **Vremenske dimenzije nema** — samo ukupan zbir, bez datuma.
- **Težina:** povlači **sve** `photoVisits` redove korisnika u memoriju i grupiše
  u JavaScriptu. Sa 131 redom je trivijalno; sa 100.000 bi bio problem.

### 3.6 Evidencija poseta — `POST /logs`

**Parametri:** `{ page, search, from, to, perPage, onlyUsers }`.
**Trajanje:** ~0,96 s. **Vraća:** `{ items:[{_id, url, timestamp, uid, user}], total:21, totalItems:2025 }`.

**Vremenska dimenzija: da** — svaki red ima `timestamp`, i ruta prima `from`/`to`.
Ovo je **najbolji sirovi izvor** za bilo šta o posetama.

**Težina:** srednja. `logs` je doc-mode tabela (`_id`, `doc jsonb`), pa filtriranje
ide kroz `doc->>'...'` — **bez indeksa**. Na 2.025 redova nevažno; kad naraste na
stotine hiljada, svaki upit će biti puno skeniranje.

### 3.7 Evidencija preuzimanja — `POST /downloads`

**Parametri:** `{ page, search, from, to, perPage, type }`. **Trajanje:** ~0,48 s.

```
items: [ { _id, timestamp, resolution, photoId, photo, transactionId,
           galleryId, downloadType, user, gallery } ]
total, totalItems: 8
```

**Vremenska dimenzija: da**, ali sa **8 upotrebljivih redova** to nije statistika
nego uzorak.

### 3.8 Statistika po fotografima — `photographers` unutar 3.2

`[{ _id, userAlias, name, uploadedGalleryCount:int, uploadedPhotosCount:int }]`,
70 redova.

Funkcija `photographerUploadStats(from, to)` **prima opseg**, ali ga
`statistics()` prosleđuje **samo** iz `POST` varijante. Znači: rast po fotografu
kroz vreme je moguć, ali samo preko `POST /admin/statistics`.

**Težina:** `LEFT JOIN` `users × gallery` sa `jsonb_array_length` po redu.
Najskuplji pojedinačni upit u paketu.

### 3.9 Šta ekrani statistike stvarno prikazuju

| Ekran | Koristi | Ostatak paketa |
|---|---|---|
| `archiveStats` | samo `/admin/archive-stats` | — *(jedini koji ne vuče veliki paket)* |
| `todayVisits` | `adminStatistics.todayVisits`, `visitsPerDay` | baca ~90% |
| `galleryStats` | `adminStatistics.galleryVisits` + obrazac za opseg | baca ostalo |
| `photographerStats` | `adminStatistics.photographers` + obrazac za opseg | baca ostalo |
| `bannerStats` | `adminStatistics.bannerClicks` + obrazac za opseg | baca ostalo |
| `photoVisits` | `photographerStatistics` | `adminStatistics` se dovuče pa ne koristi |
| `profilePage` | zbirni brojevi | koristi najviše |

**Pet od sedam ekrana povlači paket od ~2 s da bi prikazalo jedan njegov niz.**

---

## 4. Mrtvi ekrani

| Ekran | Stanje |
|---|---|
| `reviewsPage` (183 reda) | **Mrtav.** Nema rutu, niko ga ne uvozi. Zove `DELETE /user/reviews/delete/:id` — ta ruta na serveru **postoji**, ali nema ekrana koji je koristi. Ostatak iz šablona (recenzije proizvoda). |
| `storePage` (155 redova) | **Mrtav.** Nema rutu, niko ga ne uvozi. Zove `POST /stores/create` — te rute na serveru **nema**. Ostatak `store` dela koji je već obrisan iz `views/`. |

**Blizu mrtvog, ali ne mrtvo:**

- `blogPage` i `blogItemPage` — rute postoje (`/account/news`, `/account/news/:id`)
  i API rute rade, ali `CLAUDE.md` kaže da blog nema sadržaja, nema veza sa
  sajta i predlaže se izbacivanje. Dva ekrana administracije održavaju sadržaj
  koji se nigde ne vidi.
- `slidesPage` / `slidePage` — rade, ali slajder crta **jedino**
  `views/homePage.js` (izgled „trenutni"). Pod aktivnim Predlogom A ta dva
  ekrana danas ne utiču ni na šta.
- `import` (`/account/subscribers/import`) — radi, ali je jedini put do njega
  ručno kucanje adrese; u meniju administracije ga nema.

---

## 5. Šta se NE može dobiti, a bilo bi korisno

### 5.1 Prihod po mesecima — **nemoguće danas**

`transactions` je prazna, `downloads` ima 10 redova. Polja o zaradi postoje u
odgovoru i uvek vraćaju 0.

**Šta treba na serveru:** da naplata uopšte piše u `transactions` (PayPal je u
probnom režimu). Kad počne, treba ruta
`POST /admin/earnings { from, to, granularity }` koja grupiše po mesecu —
`date_trunc('month', to_timestamp(timestamp))`. Bez zapisa o naplati nijedan
prikaz nema šta da pokaže.

### 5.2 Najtraženiji pojmovi — **izvodljivo odmah, iz postojećih podataka**

Ovo je najbrža dobit na spisku. `logs` već beleži pun URL, a pretraga ide kroz
upitni parametar:

```
71 zapisa sa `search=` u poslednjih 45 dana
/galerije?search=kosarka, /pretraga?search=sneg, …
```

**Šta treba na serveru:** ruta `GET /admin/top-searches?from&to&limit` koja radi
otprilike:

```sql
select lower(substring(doc->>'url' from 'search=([^&]+)')) as pojam,
       count(*)::int as broj
  from logs
 where doc->>'url' like '%search=%'
   and (doc->>'timestamp')::bigint between $1 and $2
 group by 1 order by broj desc limit $3
```

Uz `url_decode` za kvačice. **Nije potrebna nijedna nova tabela.**

Trajnije rešenje je zasebna tabela `searches` (pojam, broj rezultata, uid,
timestamp) — jer iz URL-a se ne vidi **koliko je rezultata pretraga dala**, a
pretrage bez rezultata su najkorisniji podatak: pokazuju šta ljudi traže a
arhiva nema.

### 5.3 Posete kroz vreme duže od 45 dana — **nemoguće unazad**

Istorije nema i ne može se napraviti. Ono što se može: **prestati je gubiti.**

**Šta treba na serveru:** dnevni sažetak. Tabela
`dailyStats(datum, posete, jedinstveniPosetioci, preuzimanja, prihod)` koju
jednom dnevno puni zadatak, pa se `logs` može orezivati bez gubitka istorije.
Bez toga `logs` ili raste u nedogled ili se briše sa istorijom.

### 5.4 Jedinstveni posetioci — **nemoguće**

`logs` ima `uid` (samo za prijavljene) i `url`. Nema ni IP, ni oznake sesije, ni
`user-agent`. Sve što se danas može reći je **broj pregleda strana**, ne broj ljudi.

**Šta treba:** oznaka sesije (kolačić ili heš IP+agent) uz svaki zapis u `logs`.

### 5.5 Odakle posetioci dolaze — **nemoguće**

Nema `referrer` polja. Ne može se reći šta donosi promet.
**Šta treba:** `referrer` u zapis `logs` — jedan red u `logVisit()`.

### 5.6 Konverzija: pregled → korpa → kupovina — **nemoguće**

Korpa se ne beleži nigde: `cart` je radna tabela koja se prazni. Nema traga o
napuštenoj korpi.
**Šta treba:** beležiti dodavanje u korpu kao događaj (`cartEvents`), inače se
ne može reći gde se ljudi zaustavljaju.

### 5.7 Koje su fotografije gledane a nikad kupljene — **skoro izvodljivo**

`photoVisits` ima posete po fotografiji, `downloads` ima kupovine. Spajanjem bi
se dobio spisak „traženo a neprodato" — vredan podatak za agenciju.

**Šta treba:** ruta koja spaja to dvoje. Danas je besmisleno jer `downloads`
ima 8 upotrebljivih redova, ali kod može stajati spreman.

### 5.8 Galerije bez poseta / bez kategorije — **izvodljivo odmah**

`gallery` ima sve što treba; `docs/galerije-bez-datuma.md` već broji 66 praznih,
a `CLAUDE.md` pominje 281 bez kategorije i 607 dvostrukih aliasa.
**Šta treba:** ruta `GET /admin/health` koja te brojeve vraća zajedno — jedan
`SELECT` sa nekoliko `count(*) filter (where …)`. Jeftino i korisno kao „stanje
arhive".

### 5.9 Šta bi trebalo razdvojiti pre nego što se pravi nadzorna ploča

Nije novi podatak, ali je preduslov: `GET /admin/statistics` je jedan poziv od
~2 s koji **šest ekrana** zove pri svakom otvaranju i od koga pet koristi po
jedan niz. Pre nego što se doda ijedan novi grafikon, vredi ga razbiti na
manje rute (`/admin/visits`, `/admin/photographers`, `/admin/banners`) da svaki
ekran plaća samo ono što prikazuje.
