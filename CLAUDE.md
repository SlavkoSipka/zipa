# ZIPA PHOTO — kontekst za redizajn

## BRZINA

- Ne pokreći pregledač i ne meri elemente osim kad prompt to izričito traži
  ili kad diram `_global.scss`, `_tokens.scss`, `_settings.scss` ili
  zajedničke komponente.
- Ne piši izveštaje, tabele ni rekapitulacije. Odgovor na uobičajenu izmenu
  je jedna do tri rečenice.
- Ne nabrajaj šta si proverio ako ništa nije puklo.
- Grupiši izmene: ako prompt ima pet stavki, uradi svih pet pa javi jednom.

## O projektu

Foto-servis agencije ZIPA PHOTO iz Banjaluke. Arhiva od **9.965 galerija i
202.411 fotografija** od 62 fotografa, od 1995. do danas. Posetioci pretražuju
arhivu i kupuju fotografije po rezolucijama; fotografi postavljaju galerije
kroz administraciju.

### Stek

| | |
|---|---|
| Sajt | React 16 + Razzle 3 (prikaz i na serveru), reactstrap, redux-form |
| Stilovi | SCSS, prevode se u `src/App.css` (**ne** kroz Razzle) |
| API | Express, zaseban proces |
| Baza | Supabase Postgres, kroz Mongo-oblik sloj u `api/db.js` |
| Fotografije | Cloudflare R2, isporučuje ih Worker |
| Postavljen na | Render (`render.yaml` u korenu) |

### Pokretanje

```bash
# API — port 10015
cd zipa24062026/api && node app.js

# Sajt — port 10016
cd zipa24062026/site
npm run build          # OBAVEZNO: prevodi SCSS pa gradi
NODE_ENV=production SERVER_PORT=10016 node build/server.js
```

**Pazi:** `razzle build` sam **ne prevodi SCSS**. Uvek `npm run build`, koji
prvo pokrene `build-css`. Ako se izmena stila ne vidi — ovo je razlog.

Za rad na stilu: `npm start` prati SCSS i osvežava sam.

### Gde stoji šta

| | |
|---|---|
| Rute | `site/src/routesList.js` — jedan niz, `path` + `component` + `loadData` |
| Prevodi | `site/src/langs.json` — `ba` i `en`; natpis bez unosa ostaje neprevedeni original |
| Tokeni | `site/src/scss/_tokens.scss` — jedini izvor boja, slova, razmaka |
| Komponente | `site/src/scss/_komponente.scss` — dugme, polje, kartica… (prefiks `z-`) |
| Prikaz sistema | `/stilovi` → `views/stiloviPage.js`, `_stilovi.scss` |
| Most ka starom | `site/src/scss/_settings.scss` — stare `$` promenljive gledaju u tokene |
| Uvoz svih stilova | `site/src/App.scss` — redosled je bitan, vidi „Redosled uvoza SCSS-a” |
| Zajednički okvir | `site/src/containers/defaultLayout.js` — zaglavlje, podnožje, iskačuća reklama |

Svaka strana se izvozi kroz `Page(...)` iz `containers/page.js`. Bez toga se
prikazuje bez zaglavlja i podnožja.

### Redosled uvoza SCSS-a — pravilo koje je tri puta srušilo gradnju

`App.scss` uvozi u **tri sloja, uvek ovim redom**:

1. **temelj** — `_tokens.scss` (vrednosti) i `_settings.scss` (**svi mixini**)
2. **strane** — fajlovi pojedinačnih strana i `_global.scss`
3. **komponente** — `z-*` klase, POSLE strana, da im specifičnost ide u korist

**Mixin se definiše SAMO u `_settings.scss`.** Ako se definiše u
`_komponente.scss`, fajlovi strana ga ne vide — komponente se uvoze posle
njih, pa gradnja pukne sa `Error: Undefined mixin`. To se desilo tri puta
zaredom (`_photoModal`, `_login`, `_cart`), svaki put uz istu poruku.

Zato su `z-fokus` i `z-prelaz` preseljeni iz `_komponente.scss` u
`_settings.scss`, gde su već stajali `z-veza`, `z-veza-meni`, `z-veza-traka` i
svi prelomni mixini. `_komponente.scss` sada **ne definiše nijedan mixin** —
samo pravila.

Nov fajl prekrojene strane ide u grupu 3, uz ostale `z-*`. `_print.scss`
ostaje poslednji, da nadjača sve.

**Provera pre javljanja da je gotovo:** `grep -c "Failed to compile"` nije
dovoljan — SCSS greška se javlja kao `Error: Undefined mixin`, bez te
rečenice. Traži i `^Error:`.

### Graf projekta — pitaj njega, ne pretragu

Projekat je uvezan Graphify-jem. Graf stoji u `graphify-out/` (ne ide na git)
i pravi se sa:

```bash
graphify .
```

**Pre svake veće izmene prvo pitaj graf, pa tek onda otvaraj fajlove.** Ko
uvozi `_global.scss`, kuda sve stiže kartica galerije, gde ulazi `settings`
iz `App.js` — na to graf odgovara odjednom i tačno; ručni `grep` po 4.173
reda `_global.scss` promaši posrednu vezu i pokaže manje nego što jeste.

Izveštaj je `graphify-out/GRAPH_REPORT.md`. Graf se ne osvežava sam — posle
većeg preseljenja fajlova pokreni `graphify .` ponovo.

---

## Strane

### Naslovna — tri izgleda

Bira se u administraciji (*Podešavanja sajta → Izgled naslovne strane*).
`homePage.js` je skretnica koja bira komponentu.

| Izgled | Fajl | SCSS |
|---|---|---|
| trenutni | `views/homePage.js` | `_home.scss` |
| A — vodeća galerija, spisak, urednički redovi | `views/naslovna/predlogA.js` | `_naslovnaA.scss` |
| B — naslovni blok i odeljci | `views/naslovna/predlogB.js` | `_naslovnaB.scss` |
| C — trake koje se listaju | `views/naslovna/predlogC.js` | `_naslovnaC.scss` |

### Javne strane

| Ruta | Fajl | SCSS |
|---|---|---|
| `/galerije` | `views/categoryPage.js` | `_category.scss` |
| `/galerija/:alias/:id` | `views/detailPage.js` | `_detail.scss`, `_photoModal.scss` |
| `/galerija/:alias/:id/:photo` | `views/photoPage.js` | `_detail.scss` |
| `/fotograf/:photographer` | `views/photographerPage.js` | `_photographer.scss` |
| `/cart` | `views/cart/cartPage.js` | `_cart.scss` |
| `/login` | `views/account/loginPage.js` | `_login.scss` |
| `/register` | `views/account/registerPage.js` | `_login.scss` |
| `/reset-password` | `views/account/resetPasswordPage.js` | `_login.scss` |
| `/reset-password/:uid/:kod` | `views/account/changePasswordPage.js` | `_login.scss` |
| `/contact` | `views/contactPage.js` | `_contact.scss` |
| `/help` | `views/helpPage.js` | `_page.scss` |
| `/faq/:alias` | `views/faqPage.js` | `_page.scss` |
| `/page/:alias` | `views/dynamicPage.js` | `_page.scss` |
| `/najave/:id` | `views/annoucmentPage.js` | `_page.scss` |
| `/video` | `views/videoPage.js` | `_naslovnaA.scss` |
| `/odjava` | `views/odjavaPage.js` | `_naslovnaA.scss` |
| `/404` | `views/404.js` | `_global.scss` |
| `/blog`, `/blog/:alias` | `views/blog/*` | `_blog.scss` |

**Blog ne dirati** — nema veza ka njemu, nema tabela u bazi ni ruta u API-ju.
Ostatak iz šablona; predlog je da se izbaci.

### Administracija

Sve pod `/account/*`, fajlovi u `views/account/`, stilovi u `_account.scss` i
`_settings.scss`. Najvažnije: `profilePage.js` (nadzorna ploča),
`galleriesPage.js`, `changeGallery.js` (postavljanje galerije),
`siteSettings.js`, `watermarksPage.js`, `archiveStats.js`.

### Zajednički delovi — menjaju sve strane odjednom

| Šta | Fajl |
|---|---|
| Zaglavlje i meni | `components/header.js` + `scss/_zaglavlje.scss` |
| Podnožje | `components/footer.js` |
| Kartica galerije | `components/articles/article.js` |
| Pretraga sa predlozima | `components/pretragaSaPrijedlozima.js` |
| Prozor sa cenama | unutar `views/detailPage.js` |
| Polja obrazaca (26) | `components/forms/fields/` |

Ovo raditi **pre** pojedinačnih strana — vide se svuda.

---

## DIZAJN PRAVAC — „tamna traka"

**Odabran 2026-08-23.** Klijent je odabrao ovaj smer i odluka je konačna.

Uzor je **shutterstock.com**: tamna traka i naslovni blok na vrhu, bela
strana ispod. Sajt nije taman — tamno je samo zaglavlje i naslovni blok, sve
ispod je belo. Fotografije se time ističu, a čitljivost ostaje.

### Mere su preuzete sa uzora, ne izmišljene

Zaglavlje, traka najave i naslovni blok sa pretragom prate uzor u
tipografiji, veličinama, razmacima i visinama. **Izmerene vrednosti stoje u
`scss/_tokens.scss`, grupa „MERE PREUZETE SA UZORA"** — uz svaku i izmerena
tačka. Ako treba nova mera, prvo je izmeriti na uzoru pa dodati kao token.

Izmereno 2026-08-23 na širini 1280:

| | Uzor | Kod nas |
|---|---|---|
| Pismo | Haffer (zaštićeno) | Figtree, promenljiv `wght@400..700` |
| Težine | 430 i 670 | `--tezina-knjiga`, `--tezina-poludebela` |
| Naslovni blok | 38px / 42px, razmak −0,19px | `--slovo-naslovni` |
| Podnaslov, „Traži se:" | 18px / 26px, težina 430 | `--slovo-podnaslov` |
| Navigacija | 14px / 20px, razmak 0,14px | `--slovo-nav` |
| Pilule radnje | 16px / 20px, visina 44px, **radijus 8px** | `--slovo-radnja`, `--radijus-radnja` |
| Traka najave | visina 60px, dugme 40px, puna pilula | `--visina-najava` |
| Polje pretrage | visina 48px | `--visina-pretraga` |
| Plava trake najave | `#2877A3` | `--boja-najava` |

Vrednosti su u **rem**, ne u px: na podrazumevanoj veličini daju tačno
izmerene tačke, a uvećanje slova u pregledaču i dalje radi.

**Boja trake NIJE preuzeta.** Uzor ima skoro crnu `#141414`; klijent je
izabrao tamnoplavu — A `#0E1626`, B `#131C30`, C `#0A1119`.

### Zaglavlje nije fiksirano — `--zaglavlje-visina` je 0

Zaglavlje stoji u toku strane (`position: relative`) i pri skrolovanju odlazi
van kadra zajedno sa naslovnim blokom i pretragom. Zato je
**`--zaglavlje-visina: 0px`** i merenja visine u `header.js` više nema.

Token se **ne briše**: čita ga 16 fajlova, često kao
`calc(var(--zaglavlje-visina) + 40px)`, pa bi brisanje srušilo svaki takav
`calc`. Sa nulom se te mere svedu na sopstveni razmak strane.

Ako se zaglavlje ikad vrati na `position: fixed`, merač treba vratiti — i sa
njim tri stvari koje nisu očigledne: čuvar mora da čita **živu** poziciju
skrola (stanje kasni), mera se mora osvežiti na `document.fonts.ready` (traka
naraste kad Figtree zameni rezervno pismo), i **ne sme se animirati
`max-height`** — taj prelaz se nikad ne dovrši.

Nosioci pravca:

| | |
|---|---|
| Strana | bela `#FFFFFF`, tihe površine `#F5F6F8` |
| Traka | `--boja-traka` — jedina tamna površina, zaglavlje i naslovni blok |
| Radnja | amber `#F2A93B` — pretraga i glavna radnja. **Površina, nikad tekst.** |
| Oznaka | crvena identiteta `#D60006` — oznake, aktivno stanje |
| Pismo | Figtree, težine 400 / 500 / 600, i za naslove i za tekst i za podatke |
| Radijusi | 6 osnovni, 999 pilula |

**A, B i C ne razlikuje nijedna boja (od 2026-08-25).** Sva tri bloka u
`_tokens.scss` su prazna i nasleđuju `:root`. Zaglavlje i podnožje su teget
`#0E1626`, **isti na celom sajtu**, i izbor predloga ih ne dira. Predlozi
menjaju samo ono ispod zaglavlja, kroz `_naslovnaA/B/C.scss`.

Ranije su B i C menjali `--boja-traka`, `--boja-traka-linija` i
`--boja-traka-povrsina`. To je bio kvar: ta tri tokena čita **osam fajlova
van naslovne** — `_zaglavlje` i `_podnozje` (preko njih preusmeravaju svoju
površinu, liniju i tihu podlogu), pa `_photoModal`, `_fotografija`,
`_nemastrane`, `_alatnaTraka`, `_galerija`, `_login` i `_video`. Izbor
Predloga B je zato prefarbao navbar i podnožje na **svakoj** strani sajta,
iako se biralo samo kako izgleda naslovna.

Izmereno posle razdvajanja, na svežem učitavanju za svaku temu: zaglavlje i
podnožje su `rgb(14, 22, 38)` pod a, b i c — identično.

**Pravilo:** predlog naslovne nikad ne sme da menja token koji čita nešto van
naslovne. Ako A/B/C ikad zatreba razlika, ide u njihov SCSS, ne u token.

Amber je površina, ne tekst: `#F2A93B` kao tekst na beloj daje 2,00:1.
Tekst na amberu je `--boja-akcenat-tekst` (`#3A2B0C`, 6,87:1).

### Veza se poznaje po podvlačenju, ne po boji

Pošto amber ne sme da bude tekst, veza ima **istu boju kao tekst**
(`--boja-veza`). Klikabilnost nosi podvlačenje. Tri mixina u `_settings.scss`
(ne u `_komponente.scss` — on se uvozi prekasno za većinu strana):

| Mixin | Gde | Podvlačenje |
|---|---|---|
| `z-veza` | veza u toku teksta | u mirovanju |
| `z-veza-meni` | meni, naslov odeljka, stavka zaglavlja | na hover i fokus |
| `z-veza-traka` | veza na tamnoj traci (bela) | na hover i fokus |

U toku teksta se podvlači **u mirovanju** jer boja ne nosi nikakvu razliku —
bez linije se veza ne razlikuje od teksta, a hover na telefonu ne postoji.
U meniju je mesto dovoljan znak, pa bi stalna linija bila šum.

**Četvrta gola zamka je uklonjena (2026-08-23).** Bila je:

```scss
a { text-decoration: none !important; }
```

Gasila je podvlačenje na celom sajtu, pa veza u novom pravcu nije imala
nijedan znak da je veza. Sada važi samo pod temom „trenutni":

```scss
[data-tema="trenutni"] a { text-decoration: none !important; }
a       { text-decoration: none; }
a:hover { text-decoration: none; }
```

`a:hover` mora izričito, jer Bootstrap podvlači svaku vezu na hover, a to
pravilo u bundle-u stoji **pre** našeg. Pod temama A/B/C `!important` više
ne postoji, pa svako pravilo sa klasom normalno pobeđuje — mixini za vezu
zato više ne nose `!important`.

Izmereno posle izmene: naslovna 808 elemenata, `/galerije` 1.060, `/help`
256, `/login` 246. Pod temom „trenutni" **nula podvlačenja na sve četiri** —
zatečeni izgled se nije pomerio. Pod temom A jedino `/login` ima jedno, i to
je namerno („Kreirajte nalog").

### Okvir fokusa — `--boja-fokus`

Amber kao okvir fokusa daje 2,00:1 na beloj, a znak fokusa traži 3:1. Zato
postoji `--boja-fokus`, tamna (`#1B1E24`): 16,70:1 na beloj, 8,36:1 uz amber
dugme, 3,07:1 uz crvenu oznaku. Tamni amber bi na beloj prošao, ali uz samo
amber dugme pada na 2,96:1 — zato tamna.

Na tamnoj traci okvir ostaje amber (9,32:1) preko `--boja-fokus-traka`;
traka svojim opsegom pregazi `--boja-fokus`.

Menja se na jednom mestu — mixin `z-fokus` — i time pokriva svih 8 mesta u
`_komponente.scss` i 10 u `_zaglavlje.scss`. Polje pretrage je izuzetak: ono
ne pokazuje okvir na `input`-u nego na omotaču, preko `:focus-within`, pa i
tamo ide isti token.

### Napušteno — pravac 1, „sto za pregled" (do 2026-08-23)

Neutralno siva podloga `#E4E6EA` kao radna površina za procenu boja, plavi
akcenat, tri pisma, oštar radijus od 2px oko fotografije. **Povučen** —
klijent je odabrao drugi smer. Zapisano da se zna šta je bilo i da se ne
predlaže ponovo:

| | |
|---|---|
| Podloga / površina | `#E4E6EA` / `#FFFFFF`, tiha `#EDEEF1` |
| Tekst / tiho / linija | `#16181D` / `#5E626A` / `#CFD3DA` |
| Akcenat plavi / pritisnut | `#3C59B9` / `#2F489C`, tekst na njemu beo |
| Oznaka / kao tekst | `#D60006` / `#C40006` (potamnjena, siva podloga ju je rušila) |
| Uspeh / upozorenje | `#166A41` / `#8A5A0F` — **zadržani**, prilagođeni beloj |
| Pisma | Archivo Narrow (naslov), Source Sans 3 (tekst), IBM Plex Mono (podaci) |
| Radijusi | 2 / 6 / 999 |
| Teme | B svetlija `#F2F3F6` + `#2F4FCC` + radijusi 4/10; C tamnija `#D8DBE1` + `#3A5296` + radijusi 2/4 |

Iz tog pravca **ostaje** i dalje važeće: most u `_settings.scss`, prelomne
tačke, `:focus-visible` u `_komponente.scss`, `--zaglavlje-visina`, kapija za
pretpregled, tema „trenutni", kataloški broj, i pravilo da tekst nikad ne ide
preko fotografije (žig je potvrđen).

---

## PRAVILA REDIZAJNA

- Menjamo SAMO izgled: JSX markup i SCSS. Ne diramo logiku, pozive ka
  API-ju, imena propova, rute, state, form validaciju.

- Nijedna strana ne sme da uvede novu hardkodovanu boju, veličinu fonta,
  razmak ili radijus. Sve ide iz `scss/_tokens.scss`.

- Sajt ima tri izgleda naslovne (A, B, C) koji se biraju iz administracije.
  Podstrane nemaju svoje varijante — one koriste tokene i automatski prate
  aktivnu temu.

- Tekst na sajtu je na srpskom, ekavica, ćirilica se ne koristi. Ne prevodi
  postojeće natpise na engleski.

- Sve mora da radi na telefonu. Prelomne tačke: 480, 768, 1024, 1440.

- **U grid mrežama nikad golo `1fr` — uvek `minmax(0, 1fr)`.** Najmanja mera
  `1fr`-a je `min-content`, pa jedan neprelomiv sadržaj (dug naziv, kataloški
  broj, `white-space: nowrap`) razvuče stubac preko širine ekrana i cela
  strana izađe iz kadra. `min-width: 0` na detetu ne pomaže — granicu postavlja
  sam stubac. Izmereno na naslovnoj: stubac je na 320px bio 593px, preliv
  288px; sa `minmax(0, 1fr)` preliv je nula na svih sedam širina. Isto važi
  za `auto` stupce i za `flex-basis` u redu koji se ne prelama.

- **Provera se radi na sedam širina: 320, 360, 375, 414, 430, 768, 1280.**
  Ni na jednoj ne sme biti vodoravnog preliva. 320 je najuži uređaj koji se
  još sreće, 414 i 430 su široki telefoni (iPhone Plus/Pro Max) — na njima
  prelomne tačke ne pucaju, ali razmaci i mreže znaju da izgledaju
  razvučeno. Merenje je `document.documentElement.scrollWidth - clientWidth`;
  traka koja se namerno prevlači (`overflow-x: auto`) se ne računa.

- Poštuj `prefers-reduced-motion`. Fokus na tastaturi mora da se vidi.

### Napomene uz pravila

`scss/_tokens.scss` **postoji** i sve stare `$` promenljive iz `_settings.scss`
sada pokazuju u njega. Nova strana ne uvodi svoje vrednosti — uzima tokene.

Teme se biraju atributom `data-tema` na `<html>`, iz istog podešavanja kojim se
bira izgled naslovne (`settings.homepageLayout`). Postavlja ga `App.js`
(`postaviTemu`), a kratka skripta u zaglavlju u `server.js` primeni zapamćenu
vrednost pre prvog iscrtavanja da nema treptaja. Vrednost `trenutni` vraća sve
tokene na zatečene — to je mreža za pad: ako nešto pukne, izbor „Trenutni
izgled" u administraciji vraća stari sajt bez vraćanja koda.

Prelomne tačke su usklađene. Mixini su u `_settings.scss`: `mobile` (≤767),
`tablet` (768–1023), `mobile-tablet` (≤1023), `small-desktop` (1024–1439),
`veliki-ekran` (≥1440), plus `tablet-i-vise`, `desktop-i-vise`,
`do-velikog-ekrana`, `telefon-mali` i dva po visini ekrana. Ručnih `@media`
upita više nema — ako pišeš novi, prvo proveri postoji li mixin.

### Kako da vidim redizajn dok radim

Tema ide iz istog podešavanja kao izgled naslovne, pa se prebacuje bez
diranja koda.

**Da vidiš temu A na celom sajtu, a posetioci i dalje stari izgled:**

1. Prijavi se kao administrator.
2. *Podešavanja sajta → Izgled naslovne strane* → **Predlog A**.
3. Odmah ispod uključi **„Novi izgled vidim samo ja"**.
4. Sačuvaj i osveži stranu.

Tako A vidiš samo ti; svi ostali ostaju na temi „trenutni". Isto važi za
Predlog B i C.

**Nazad na staro:** isti padajući spisak → **Trenutni izgled**. To vraća sve
tokene na zatečene vrednosti, bez vraćanja koda — mreža za pad ako nešto
pukne.

**Za brz pogled, bez diranja podešavanja** — u konzoli pregledača:

```js
document.documentElement.setAttribute('data-tema', 'a');         // a | b | c
document.documentElement.setAttribute('data-tema', 'trenutni');  // nazad
```

Važi do osvežavanja strane. Sve četiri teme jedna do druge stoje na
`/stilovi`, gde preklopnik ne dira podešavanja.

**MERENJE PO TEMAMA IDE NA SVEŽE UČITAVANJE — ne prebacivanjem `data-tema`
u letu.** Prebacivanje atributa je dobro da se nešto pogleda, ali **ne** da
se izmeri. `getComputedStyle` posle takve promene ume da vrati vrednost iz
prethodne teme: token pročitan sa elementa pokazuje novu boju, a `color` na
istom elementu još staru. Dva puta je poslao na pogrešan trag — jednom je
„procurela" boja teme A pod „trenutni", jednom obrnuto, a nijedno nije bilo
tačno.

Dva razloga: komponente imaju `transition` na `color`, pa se prvih 120ms
čita međuvrednost; i kad je pregledač skriven ili se meri u `iframe`-u van
ekrana, preračun stila se odloži, pa se čita zatečena vrednost.

Kako se meri ispravno:

1. Postavi temu **pre** prvog iscrtavanja — kroz *Podešavanja sajta* ili
   `localStorage.setItem('tema', 'a')` pa `location.reload()`.
2. Meri tek na tako učitanoj strani, bez daljeg diranja `data-tema`.
3. Za drugu temu — opet učitaj, ne prebacuj.

Kad je zamena boje **identitet pod temom** (npr. `#6D7587` →
`var(--boja-tekst-tiho)`, a token pod „trenutni" je baš `#6D7587`), merenje
i ne treba — dovoljno je pokazati vrednost tokena u prevedenom `App.css`.

**Zamke iz `_global.scss`** (4.173 reda, ne prepravlja se):
`button { outline: none }` — zato svaka komponenta ima svoj `:focus-visible`;
spisak preostalih 103 mesta je u `docs/outline-none.md`.

Tri ranije zamke su **uklonjene** (2026-08-22), izmerenim dokazom da se
zatečeni izgled nije pomerio — 1.661 element na naslovnoj i 1.446 na
`/galerije`, nula razlika:

- `html, body, h1…h6, p, a, span, div { font-family: 'Poppins' }` sada uzima
  tokene: naslovi `--pismo-naslov`, ostalo `--pismo-tekst`. Pod temom
  „trenutni" oba su i dalje Poppins.
- `header { position: fixed }` → `header:where(.zaglavlje-sajta)`.
- `footer { … }` → `footer:where(.podnozje-sajta)`.

Klase postavljaju `components/header.js` i `components/footer.js`. `:where()`
je namerno: unutar njega selektor ne nosi specifičnost, pa se kaskada ne
pomera. Ako pišeš novo pravilo za pravo zaglavlje ili podnožje, ciljaj klasu.

### Visina zaglavlja — `--zaglavlje-visina`

Zaglavlje je `position: fixed`, pa svaka strana sama odvaja mesto za njega.
Te mere su ranije bile zakucane i različite (200, 180, 140, 130, 120, 20px) i
nijedna nije bila tačna posle izmene zaglavlja.

Sada `components/header.js` meri sebe i upisuje pravu vrednost u
`--zaglavlje-visina` na `<html>`; `_zaglavlje.scss` drži približnu vrednost
za prvo iscrtavanje sa servera. Strane je čitaju:

```scss
padding-top: var(--zaglavlje-visina);
```

Mera se **ne** osvežava dok je zaglavlje stanjeno — inače bi se prostor smanjio
usred skrolovanja i sadržaj bi poskočio. Ako praviš novu stranu, uzmi ovaj
token; ne piši svoj broj.

### CSS `min()` ne prolazi kroz gradnju

Razzle u ovom projektu ima stari CSS parser koji na `min()` pukne sa
`ParserError: Syntax Error at line: 1, column 18` nad `App.css`. Isto se
dobija parom `width` + `max-width`. Važi i za `max()` i `clamp()` —
neprovereno, ali ne isprobavaj bez potrebe.

Novi natpis uvek dodati i u `langs.json` (`ba` i `en`) — bez unosa u rečniku
prevod tiho vraća original i strana ostaje mešana.

---

## ČEKA ODLUKU KLIJENTA

Stvari iz pravca „tamna traka" koje su **sagrađene u izgledu**, ali čekaju
odluku ili podatak. Ovo je spisak koji ide klijentu.

Traka najave i fotografija u naslovnom bloku su u međuvremenu **rešene** —
obe se hrane najnovijom galerijom, kroz jedno dovlačenje u `App.js`.

### 1. ~~Dovlačenje najava~~ — ZATVORENO (2026-09-08)

Traka na vrhu zaglavlja ima **dva izvora, jedan izgled**:

1. **Najava iz administracije** — ima prednost. `App.js` dovlači
   `/announcements` i prosleđuje kao `najavaAdmin`. Traka tada nosi crvenu
   identiteta (`--boja-oznaka`), piše „Obavještenje" + `content` najave, a
   dugme „Pročitaj" vodi na `/najave/:id`.
2. **Najnovija galerija** — kad nijedna najava nije važeća. Plava traka,
   „Pogledajte novu galeriju" + naziv, dugme vodi na galeriju. Kao i pre.

**Nema polja „prikaži u zaglavlju" i ne treba ga.** Ruta `/announcements`
već vraća samo najave kod kojih je današnji dan između `from` i `to`, a ta
dva polja se zadaju u *Administracija → Najave* (OD i DO). **Prozor važenja
JE prekidač** — najava se sama pojavi i sama nestane. Ako ih je više
važećih, ide poslednja objavljena.

Provereno kroz posrednika koji menja samo odgovor `/announcements` (baza
nije dirana): sa važećom najavom traka je `rgb(214, 0, 6)` sa vezom ka
`/najave/:id`, bez nje `rgb(40, 119, 163)` sa vezom ka galeriji.

### 2. Polje za obrisnu pilulu u podešavanjima

Levo mesto u drugom redu zaglavlja čeka pilulu iz administracije. Vezana je
za `settings.headerPill`, koje danas ne postoji, pa se **ne iscrtava**.

Šta treba dodati u *Podešavanja sajta*:

- `headerPill` — natpis (npr. „Foto servis").
- `headerPillLink` — kuda vodi.

Postojećih 18 polja (`logo`, `logoText`, `homepageLayout`, `mobilePopup`,
`showBanner`, društvene mreže, telefon, lokacija) nijedno ne odgovara.

### 3. Izvor za popularne pojmove — red „Traži se:"

Red ispod velike pretrage na naslovnoj povlači **kategorije zakačene u meni**
(`isVisibleOnNav`). To je stvaran podatak i već stiže — ali danas je zakačena
**samo jedna** („Dan Republike Srpske"), pa se vidi jedan pojam umesto četiri
do pet.

Dve mogućnosti:

- **Bez koda:** klijent u administraciji zakači još 3–4 kategorije. Red se
  popuni sam.
- **Sa kodom:** zasebno polje u podešavanjima za pojmove, nezavisno od
  kategorija — ako se traži da pojam ne mora da bude kategorija.

### 4. Radno vreme na `/contact`

Kontakt strana ima mesto za radno vreme, ali se **ne iscrtava** — čita
`settings.workingHours`, a to polje danas ne postoji. Radno vreme se ne
izmišlja. Treba dodati jedno polje u *Podešavanja sajta* (`workingHours`,
slobodan tekst u više redova, kao `location`).

### 5. Dužina trajanja snimka na `/video`

Pločica snimka ima mesto za trajanje, ali se **ne iscrtava** — čita
`duration`, a zapis snimka u bazi ima samo `title`, `link`, `thumbnail`,
`position` i `isActive`. Trajanje se ne izmišlja. Treba dodati polje u
*Video → snimak* (`duration`, npr. „4:12"), ili ga povlačiti sa YouTube-a,
što traži ključ ka njihovom API-ju.

### 6. Mapa na `/contact` ide preko Google-a

Mapa se učitava kao `iframe` sa `maps.google.com`, sa adresom iz
`settings.location` kao upitom — bez ključa i bez naloga. To znači da
posetiocu strana povlači Google. Ako agencija to ne želi, briše se blok
`z-kontakt__mapa` u `contactPage.js` — ostatak strane ne zavisi od njega.

---

## STANJE REDIZAJNA

| Korak | Status | Datum |
|---|---|---|
| Tokeni (`_tokens.scss`) — prvi pravac, 14 boja / 7 slova / 8 razmaka / 3 radijusa | zamenjeno | 2026-08-22 |
| Tokeni prebačeni na pravac „tamna traka” — 20 boja, jedno pismo, 2 radijusa | gotovo | 2026-08-23 |
| Figtree u učitavanju; Archivo Narrow, Source Sans 3, IBM Plex Mono izbačeni | gotovo | 2026-08-23 |
| Amber kao tekst uklonjen — 44 mesta na `--boja-veza` / `--boja-tekst` | gotovo | 2026-08-23 |
| Most `_settings.scss` → tokeni (18 fajlova prefarbano) | gotovo | 2026-08-22 |
| Prelomne tačke usklađene (15 ručnih upita prebačeno) | gotovo | 2026-08-22 |
| `data-tema` na `<html>`, pre prvog iscrtavanja | gotovo | 2026-08-22 |
| Komponente (`_komponente.scss`) — 10 delova, `:focus-visible` | gotovo | 2026-08-22 |
| Strana `/stilovi` sa preklopnikom tema | gotovo | 2026-08-22 |
| Strana `/stilovi` osvežena na nove tokene (grupe „Traka” i „Radnja”) | gotovo | 2026-08-23 |
| Tri gole zamke u `_global.scss` (pisma, `header`, `footer`) | gotovo | 2026-08-22 |
| Zaglavlje — dva sloja, panel kategorija, fioka na telefonu | gotovo | 2026-08-22 |
| Naslovna — predlog A, sekcije 2/3/4 prekrojene (vodeća + spisak, naizmenični redovi, kvadratni indeks) | gotovo | 2026-08-25 |
| Naslovna — A/B/C razdvojeni od trakastih tokena (navbar više ne zavisi od izbora) | gotovo | 2026-08-25 |
| Naslovna — predlog C, trake se same pomeraju i ne seku karticu | gotovo | 2026-08-25 |
| Naslovna — predlozi B i C, ostatak (crtani u prvom pravcu) | nije počelo | |

### Podstrane — red po red

Spisak i redosled su u `STRANE_ZA_REDIZAJN.md`.

| Strana | Fajl | Status | Datum |
|---|---|---|---|
| Podnožje | `components/footer.js`, `_podnozje.scss` | gotovo | 2026-08-23 |
| Napredna pretraga | `components/forms/detailSearchForm.js`, `_naprednaPretraga.scss` | gotovo | 2026-08-23 |
| Kartica galerije | `components/articles/article.js`, `_kartica.scss` | gotovo | 2026-08-23 |
| `/galerije` — vrh i alatna traka | `views/categoryPage.js`, `_alatnaTraka.scss` | gotovo | 2026-08-23 |
| `/galerija/:alias/:id` | `views/detailPage.js`, `_galerija.scss` | gotovo | 2026-08-23 |
| Prozor fotografije sa cenama | `views/detailPage.js`, `_photoModal.scss` | gotovo | 2026-08-23 |
| `/login`, `/register` | `views/account/loginPage.js`, `registerPage.js`, `_login.scss` | gotovo | 2026-08-23 |
| `/cart` | `views/cart/cartPage.js`, `_cart.scss` | gotovo | 2026-08-23 |
| `/account/profile` + okvir naloga | `views/account/profilePage.js`, `components/nalogOkvir.js`, `_nalog.scss` | gotovo | 2026-08-23 |
| `/account/downloads` | `views/account/downloadsPage.js` | gotovo | 2026-08-25 |
| `/account/edit` | `views/account/editAccountPage.js` | gotovo | 2026-08-25 |
| `/account/change-password` | `views/account/changePassword.js` | gotovo | 2026-08-25 |
| `/reset-password` | `views/account/resetPasswordPage.js` | gotovo | 2026-08-25 |
| `/reset-password/:uid/:kod` | `views/account/changePasswordPage.js` | gotovo | 2026-08-25 |
| `/fotograf/:alias` | `views/photographerPage.js`, `_photographer.scss` | gotovo | 2026-08-25 |
| `/help` | `views/helpPage.js`, `_stranice.scss` | gotovo | 2026-08-25 |
| `/faq/:alias` | `views/faqPage.js`, `_stranice.scss` | gotovo | 2026-08-25 |
| `/contact` | `views/contactPage.js`, `_contact.scss` | gotovo | 2026-08-25 |
| `/page/:alias` — jedan izgled za sve sadržajne strane | `views/dynamicPage.js`, `_stranice.scss` | gotovo | 2026-08-25 |
| Zaglavlje — preliv na telefonu (320/360/375) | `components/header.js`, `_zaglavlje.scss` | gotovo | 2026-08-25 |
| `/najave/:id` | `views/annoucmentPage.js`, `_najava.scss` | gotovo | 2026-08-25 |
| `/video` | `views/videoPage.js`, `_video.scss` | gotovo | 2026-08-25 |
| `/galerija/:alias/:id/:photo` + OG oznake | `views/photoPage.js`, `_fotografija.scss` | gotovo | 2026-08-25 |
| `/odjava` | `views/odjavaPage.js`, `_odjava.scss` | gotovo | 2026-08-25 |
| `/account/verify/:uid/:kod` | `views/account/emailVerifyPage.js`, `_potvrda.scss` | gotovo | 2026-08-25 |
| `/404` | `views/404.js`, `_nemastrane.scss` | gotovo | 2026-08-25 |
| Ostalo iz `STRANE_ZA_REDIZAJN.md` | | nije počelo | |

**Obrasci naloga više ne idu kroz redux-form.** `/account/edit` i
`/account/change-password` su prebačeni na obična kontrolisana polja, kao
prijava i registracija — ali **imena polja i pozivi ka `/user/edit` su
nepromenjeni**, pa server ne vidi razliku. Polja koriste `z-prijava__*`
klase iz `_login.scss`; nema druge kopije istih pravila.

**Sadržajne strane dele jedan fajl.** `scss/_stranice.scss` drži tri celine —
`.z-pomoc` (`/help`), `.z-tema` (`/faq/:alias`) i `.z-strana` (`/page/:alias`).
Zajedničko im je pravilo o širini reda: `max-width: 65ch`. `.z-strana__telo`
oblači **gole oznake**, ne klase, jer sadržaj stiže kao slobodan HTML iz
administracije — h2/h3/h4, spiskovi, citat, tabela (skroluje u sebi), slika.
Nova sadržajna strana ne traži nijedan novi stil.

**Sadržaj sa strane se izvodi iz teksta.** `dynamicPage.js` prolazi kroz
uneti HTML, dodaje `id` naslovima h2 i h3 i od njih pravi spisak. Radi nad
tekstom (ne nad DOM-om), pa isto daje i na serveru i u pregledaču — inače bi
se prvo iscrtavanje razlikovalo. Ako je `id` već unet u administraciji,
poštuje se. Bez naslova nema spiska i tekst uzima punu širinu.

**Zaglavlje na telefonu — šta gde stoji.** Desna strana trake je na 375px
tražila 249px kod raspoloživih 200 i gurala ceo sajt izvan ekrana. Ispod
768px cjenovnik, pomoć i prekidač jezika silaze u **dno fioke**
(`z-zaglavlje__fioka-dno`); u traci ostaju dugme menija, logo, korpa i
prijava. Stavke koje se sele nose klasu `z-zaglavlje__u-fioku`, a pravilo
važi samo pod `z-zaglavlje--sa-fiokom` — na stranama naloga i kod fotografa
javnog menija nema, pa nema ni fioke i tamo se ništa ne sklanja.

Ispod 480px (`telefon-mali`) padaju još dve stvari: tri jednake kolone reda
sa logom postaju `flex` (u tri kolone leva dobije manje od 48px koliko traži
dugme menija, pa se logo popne preko njega), i prekidač „Galerije /
Fotografije" prelazi u svoj red iznad polja za unos (traži 184px, pa je od
polja ostajalo 30px).

Usput su ispravljene i dve zatečene greške istog reda: `naslovni-tekst` je
ispod 1024px zadržavao granicu od 54% postavljenu zbog ilustracije koja se
tu **ne iscrtava**, pa je naslov stajao u stupcu od 145px na 375px i 108px na
320px; i `.pagination` iz `_global.scss` je plutajući red koji se ne prelama,
zbog čega je `/galerije` na 320px prelazilo 47px — prelamanje je dodato u
`_komponente.scss`, samo ispod 480px.

**Mrtav kod obrisan (2026-08-25).** Ceo `views/store/` (9 fajlova),
`views/storesPage.js`, `scss/_store.scss`, `scss/_stores.scss` i pet obrazaca
koji su ostali bez uvoza posle prelaska na kontrolisana polja:
`editAccountForm.js`, `changePassword.js`, `resetPassword.js`,
`changePasswordForm.js`, `articles/downloadArticle.js`. Svi su pre brisanja
imali nula referenci.

### Dug — popraviti na izvoru, ne u prikazu

- **`text` najave je JSON u stringu.** U `announcements` polje `text` ne stoji
  kao objekat po jezicima (`{ba: '…', en: '…'}`) kao svuda drugde, nego kao
  **string koji sadrži JSON**: `"{\"ba\": \"<p>…</p>\"}"`. Zbog toga je
  `Object.translate(data, 'text', lang)` vraćao prazno i telo najave se nikad
  nije iscrtavalo.

  `views/annoucmentPage.js` sada taj string raspakuje **pri prikazu** — to je
  zakrpa, ne rešenje. Pravo mesto je **strana upisa**: `announcementForm.js` i
  ruta `/announcements/update/:id` treba da upišu objekat, kao što to rade
  sve ostale višejezične vrednosti. Uz izmenu ide i jednokratna migracija
  postojećih zapisa (danas ih je malo — proveriti `announcements/all`).

  Dok se to ne uradi, raspakivanje u prikazu **ne sme da se ukloni**, a
  ostaje i posle popravke kao mreža za pad za stare zapise.

### Trake u predlogu C — `components/traka.js`

Sve tri trake u `predlogC.js` idu kroz `<Traka>`. Komponenta pomera traku za
**tačno jednu karticu** na 4,5s, glatko, i sa kraja se vraća na početak. Korak
se **meri iz same kartice** (`offsetWidth` + stvarni razmak do sledeće), pa ne
zavisi od vrednosti u SCSS-u.

Staje dok je miš iznad trake, dok je fokus u njoj, dok se prevlači prstom ili
točkićem (pa miruje još 6s), i dok je kartica pregledača u pozadini. Pod
`prefers-reduced-motion: reduce` se **ne pomera uopšte**.

Kartica se meri u **delovima širine**, ne u pikselima — sa zakucanih 232px
broj kartica nije izlazio ceo, pa je poslednja vidljiva uvek bila presečena.
Uz `scroll-snap-type: x mandatory` (ranije `proximity`, koji je dozvoljavao
zaustavljanje između dve kartice) nijedna kartica ne ostaje na pola.

Izmereno koliko kartica staje: 320/375/430 → 1, 768 → 3, 1024 i 1280 → 4,
1440 → 5. Svuda ceo broj.

**Dve stavke koje OBAVEZNO idu kad se bude radio predlog C** (dogovoreno
2026-08-25, namerno nisu rađene sad):

1. **Dugme za pauzu — WCAG 2.2.2.** Sadržaj koji se sam pomera duže od pet
   sekundi mora da ima **vidljivu kontrolu** za zaustavljanje. Pauza na hover
   i na fokus se **ne računa** — korisniku tastature i čitača ekrana to nije
   kontrola. Sajt vodimo ka AA, pa bez ovoga traka ne sme na produkciju.
2. **Virak sledeće kartice — vratiti 12–16px.** Sada je ispod 480px kartica
   tačno `100%`, bez ijednog nagoveštaja da traka ide dalje. Ivica sledeće
   kartice je jedini znak da sadržaj postoji desno.

### Podešavanja stižu sa servera — nema treptaja na naslovnoj

Do 2026-08-27 su podešavanja dovlačena tek na klijentu, pa je server crtao
naslovnu bez njih: `homePage.js` bi dobio `undefined` i vratio „trenutni", a
čim bi podešavanja stigla strana bi skočila na izabrani predlog. Posetilac je
video treptaj, a **u izvoru strane je stajala pogrešna naslovna** — što su
videli i pretraživači.

Sada `server.js`:

1. dovuče `/settings` pre iscrtavanja (keš u procesu, 60s — podešavanja se
   menjaju retko, a bez keša bi svaka poseta dodala poziv ka API-ju);
2. prosledi ih u `renderToString` kao prop `podesavanja`, pa SSR odmah crta
   pravu naslovnu;
3. upiše ih u početni HTML kao `window.__PODESAVANJA__`, pre bundla.

`App.js` iz toga puni **početno stanje** (`window.__PODESAVANJA__` u
pregledaču, prop na serveru), pa se prvi prikaz na klijentu poklapa sa onim
koji je server već iscrtao — nema treptaja ni razlike pri hidraciji.
`/settings` se i dalje dovlači u `componentDidMount`, ali sada samo osvežava.

Skripta koja postavlja `data-tema` pre prvog iscrtavanja čita isti izvor:
`window.__PODESAVANJA__.homepageLayout`, pa pamćenje pregledača, pa
„trenutni" kao rezerva.

Provereno u **izvoru strane**, ne u inspektoru: `a` → `naslovna-a`,
`b` → `naslovna-b`, `c` → `naslovna-c`, `trenutni` → `home-wrap`. Varijante
`b`, `c` i `trenutni` su merene kroz posrednika koji menja samo
`homepageLayout` u odgovoru `/settings` — baza nije dirana.

### Imena datoteka sa razmakom obaraju `srcset`

Fotografije u arhivi imaju razmake u imenu
(`20260518_100god FK Borac Banja Luka…jpg`). `srcset` razdvaja kandidate
razmakom, pa nekodiran razmak obori **ceo** atribut i pregledač ga odbaci
(`Failed parsing 'srcset' attribute value`) — slika tiho padne na `src` i
prikaz na retina ekranu ostaje na maloj verziji.

Putanja se zato uvek provlači kroz `encodeURI` (ostavlja `/`, razmak pretvara
u `%20`). Ispravljeno u `article.js`, `predlogA.js` i `photographerPage.js`.
Svako novo mesto sa `srcSet` mora isto.

### Ekran za unos videa — dogovoreno, još nije napravljeno

Klijent koristi i najave i video. Ekran ide u administraciju, po uzoru na
`/account/announcements` (tabela + „Akcije", olovka vodi na izmenu, brisanje
kroz `handleDelete`). **Sve četiri API rute već postoje** — `/videos/admin/all`,
`/videos/get/:id`, `/videos/update/:id` (sa `new`), `/videos/delete/:id`.

Odluke (potvrđene 2026-08-25):

- **Adresa** — jedno polje, prima i pun link i goli ID; goli ID se normalizuje
  u punu adresu pre slanja. Ispod polja stoji **živ prikaz prepoznate oznake i
  sličice**, da se pogrešno nalepljeno vidi odmah.
- **Sličica** — automatski iz adrese, uz neobavezno polje za ručnu zamenu.
  Redosled pokušaja: `maxresdefault.jpg` (čist 16:9) → `hqdefault.jpg`
  (480×360, crni pojasevi) → ručno polje.
- **Naslov** — ručno, dva polja (`ba`, `en`), uz dugme „Povuci naslov sa
  YouTube-a" (oEmbed, bez ključa) koje popuni `ba` kao ispomoć. Naslovi na
  kanalu su VELIKIM SLOVIMA i ionako se doteruju.
- **`duration`** — **ručno polje, neobavezno**, format `4:12`. Povlačenje traži
  YouTube Data API v3 (ključ + kvota), a projekat nema nijedan Google ključ.
  *Dug:* ako broj snimaka naraste, preći na API.
- **Izbor i redosled na naslovnoj** — bez novog mehanizma: `position` +
  `isActive`, kao kod „Izdvajamo". `/videos/all` vraća aktivne sortirane po
  `position`, naslovna uzima prva četiri. U spisku prikazati poređano po
  `position`, sa oznakom **„na naslovnoj"** na prva četiri aktivna.

**Poznato ograničenje — Shorts.** `slicicaSaYouTube()` prepoznaje `shorts/`,
ali je ta sličica 9:16 i u mreži 16:9 izgleda loše. Rešenje: upozorenje u
ekranu kad se prepozna Shorts adresa, uz predlog da se postavi svoja sličica.

### Otvoreno

- `docs/outline-none.md` — 103 mesta gde je uklonjen okvir fokusa. Popis je
  napravljen, ispravke namerno nisu dirane.
- `docs/van-tokena.md` — boje koje se iscrtavaju a ne dolaze iz tokena.
  Tri padaju ispod 4,5:1 kao tekst: `#7B7B93` (15 mesta, vidi se na svakoj
  kartici), `#6D7587` (43) i `#6B7280` (9). Rešava se po stranama.
- `docs/galerije-bez-datuma.md` — 66 galerija; sve su prazni nacrti, nijedna
  nije vidljiva. Kataloškom broju ne treba zamena.
- Deljenje na mreže, PayPal iz probnog u pravi režim, 281 galerija bez
  kategorije, 607 dvostrukih aliasa — čeka odluku agencije.
