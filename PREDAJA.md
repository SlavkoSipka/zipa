# PREDAJA — nastavak rada na drugom računaru

Stanje na dan **2026-09-21**, poslednji commit `f758295`.
`CLAUDE.md` je glavni izvor pravila i istorije. Ovaj fajl je **uputstvo za
rad**: kako podići projekat, gde se šta menja kad dođe dizajnerska izmena, i
šta je stanje posle poslednjih promena (koje `CLAUDE.md` još ne opisuje).

Pročitaj ovo celo, pa `CLAUDE.md` po potrebi.

---

## 1. Prvo podizanje na novom računaru

Na git **ne idu** (vidi `.gitignore`) i moraju se preneti ručno ili napraviti:

| Šta | Kako |
|---|---|
| `zipa24062026/api/.env` | kopija sa starog računara, ili iz `.env.example` + prave vrednosti (Supabase, R2, JWT, SMTP) |
| `node_modules/` | `npm install` u `api/` i u `site/` |
| `site/src/App.css` | pravi se sam iz SCSS-a (`npm run build` / `npm start`) |
| `graphify-out/` | `graphify .` u korenu (ako je Graphify instaliran) |
| Claude memorija | nije potrebna — sve iz nje je već u `CLAUDE.md` |

```bash
cd zipa24062026/api && npm install && node app.js          # API, port 10015
cd zipa24062026/site && npm install && npm start           # razvoj: prati SCSS, port 10016
```

Za proveru kao na produkciji:

```bash
cd zipa24062026/site && npm run build && NODE_ENV=production SERVER_PORT=10016 node build/server.js
```

- `razzle build` sam **ne prevodi SCSS** — uvek `npm run build`.
- U izlazu gradnje traži i `^Error:` (SCSS greška ne piše „Failed to compile").
- API čita šemu baze **pri pokretanju**. Posle `ALTER TABLE` u Supabase-u
  API se mora restartovati, inače tiho preskače nove kolone.
- Guranje na `main` = deploy na Render (sajt + API). Nema zasebnog koraka.

---

## 2. Recept za dizajnersku izmenu

1. **Nađi fajl** — tabela u odeljku 3 ispod, ili `CLAUDE.md` → „Strane".
2. **Boje, slova, razmaci, radijusi — samo iz `scss/_tokens.scss`.** Nova
   vrednost ide prvo kao token, pa se koristi. Nijedan hex ni px u fajlu strane.
3. **Telefon ili desktop?** Ako izmena važi samo za telefon, ide unutar
   `@include mobile { … }` (≤767px). Desktop se tada ne sme pomeriti.
   Za mere/slova koja se menjaju samo na telefonu postoji blok
   `@media (max-width: 767px)` na dnu `_tokens.scss` — prvo pogledaj njega.
4. **Mixin se definiše samo u `_settings.scss`.** Nikad u `_komponente.scss`
   ni u fajlu strane (tri puta srušilo gradnju).
5. **Grid:** nikad golo `1fr`, uvek `minmax(0, 1fr)`.
6. **Bez `min()`, `max()`, `clamp()`** — stari parser u Razzle-u puca.
7. **Nov natpis** → i u `site/src/langs.json`, pod `ba` i `en`.
8. **Slika sa `srcSet`** → putanja kroz `encodeURI` (imena imaju razmake).
9. **Amber `#F2A93B` je površina, nikad tekst.** Veza = boja teksta + podvlačenje.
10. **Provera:** bez vodoravnog preliva na 320, 360, 375, 414, 430, 768, 1280
    (`document.documentElement.scrollWidth - clientWidth` = 0).
    Za izmenu samo za telefon: izmeri i 1280/1440 da se desktop nije pomerio.
11. Menjamo **samo izgled** (JSX markup + SCSS) — ne logiku, API pozive,
    propove, rute, state.

Teme: `data-tema` na `<html>` (`trenutni | a | b | c`). Za merenje tema
**sveže učitavanje** (`localStorage.setItem('tema','a'); location.reload()`),
ne prebacivanje atributa u letu. Detalji u `CLAUDE.md`.

---

## 3. Gde se šta menja

Sve putanje su od `zipa24062026/site/src/`.

### Zajedničko — menja sve strane odjednom

| Šta | JSX | SCSS |
|---|---|---|
| Tokeni (boje, slova, razmaci, radijusi, telefonska lestvica) | — | `scss/_tokens.scss` |
| Mixini i prelomne tačke | — | `scss/_settings.scss` |
| Komponente `z-*` (dugme, polje, kartica…) | — | `scss/_komponente.scss` |
| Mete za prst i polja obrazaca na telefonu | — | `scss/_telefon.scss` (uvozi se posle svega) |
| Zaglavlje, meni, fioka, naslovni blok, traka najave | `components/header.js` | `scss/_zaglavlje.scss` |
| Podnožje | `components/footer.js` | `scss/_podnozje.scss` |
| Kartica galerije | `components/articles/article.js` | `scss/_kartica.scss` |
| Okvir administracije (bočni meni) | `components/adminOkvir.js` | `scss/_adminOkvir.scss` |
| Okvir „Moj nalog" | `components/nalogOkvir.js` | `scss/_nalog.scss` |
| Pregled svih tokena i komponenti | `views/stiloviPage.js` (`/stilovi`) | `scss/_stilovi.scss` |

### Strane

| Strana | JSX | SCSS |
|---|---|---|
| Naslovna (skretnica) | `views/homePage.js` | — |
| Naslovna A / B / C | `views/naslovna/predlogA/B/C.js` | `_naslovnaA/B/C.scss` |
| `/galerije` — alatna traka, filteri | `views/categoryPage.js` | `_alatnaTraka.scss`, `_category.scss` |
| Napredna pretraga | `components/forms/detailSearchForm.js` | `_naprednaPretraga.scss` |
| Galerija — mreža fotografija | `views/detailPage.js` | `_galerija.scss` |
| **Prozor fotografije sa cenama / korpom** | `views/detailPage.js` (`z-prozor`) | `_photoModal.scss` |
| Pojedinačna fotografija | `views/photoPage.js` | `_fotografija.scss` |
| Fotograf | `views/photographerPage.js` | `_photographer.scss` |
| Korpa | `views/cart/cartPage.js` | `_cart.scss` |
| Prijava, registracija, lozinke | `views/account/*` | `_login.scss` |
| Kontakt | `views/contactPage.js` | `_contact.scss` |
| Pomoć, FAQ, sadržajne strane | `helpPage.js`, `faqPage.js`, `dynamicPage.js` | `_stranice.scss` |
| Najava, video, odjava, 404, potvrda | odgovarajući `views/*` | `_najava`, `_video`, `_odjava`, `_nemastrane`, `_potvrda` |
| Administracija | `views/account/*` | `_account.scss`, `_adminOkvir.scss`, `_ploca.scss` |

Redosled uvoza je u `App.scss` — nov fajl strane ide u grupu posle
`_komponente.scss`, pre `_telefon.scss` i `_print.scss`.

**Ne dirati:** `_global.scss` (4.173 reda zatečenog koda, ne prepravlja se),
`views/blog/*` i `_blog.scss` (mrtav ostatak šablona).

---

## 4. Šta je urađeno posle poslednjeg ažuriranja `CLAUDE.md`

Commitovi `13500bd` i `f758295` — **sloj za telefon**. Sve je unutar
`@include mobile` / `max-width: 767px`; desktop je meren posle svake
izmene i nije se pomerio. Ako sledeća izmena dira telefon, prvo pogledaj
ove blokove da ne napraviš drugi, paralelan.

- **`_tokens.scss`** — telefonska lestvica slova (dno fajla): sitno gore
  (`--slovo-sm` 14→15), krupno dole (`--slovo-3xl` 44→28, naslovni 38→28).
  `--slovo-md` ostaje 16px — ispod toga Safari uveća stranu pri fokusu polja.
- **`_zaglavlje.scss`** — ilustracija iz naslovnog bloka je na telefonu
  podloga (kadar 75%, zatamnjena; kontrast belog teksta najmanje 4,9:1);
  uska pretraga u zaglavlju sakrivena; panel naloga je padajući prozor uz
  desnu ivicu; uklonjena dupla linija ispod zaglavlja.
- **`_telefon.scss`** — mete za prst 44px (32 za prekidač jezika u traci).
- **`_alatnaTraka.scss`** — `/galerije` na telefonu: pretraga, filteri
  2×2, „Više filtera", pa prikaz; padajući spiskovi preko pune širine.
- **`_galerija.scss`** — ispod 480px jedna fotografija u redu.
- **`_photoModal.scss` + `detailPage.js`** (prozor fotografije) — na
  telefonu: bez strelica levo/desno, bez trake sličica, brojač „3 / 24 ·
  prevucite" dole levo na fotografiji (prevlačenje prstom već postoji,
  `naDodirPocetak` / `naDodirKraj`, prag 50px), veći redovi rezolucija,
  dugme „U korpu" 48px i vidljivo u prvom ekranu. Na desktopu je brojač na
  slici `display: none` i sve je kao pre.

---

## 5. Otvoreno

**Baza — čeka se da vlasnik pusti u Supabase SQL editoru**, pa restart API-ja:

```sql
alter table "userResolutions" add column if not exists "naPretplati" boolean default true;
alter table "userResolutions" add column if not exists "cena3000px" numeric;
alter table "userResolutions" add column if not exists "cena1500px" numeric;
alter table "userResolutions" add column if not exists "cena800px" numeric;
alter table subscribers add column if not exists "unsubscribedAt" bigint;
```

Dok se ne pusti, način naplate u *Podešavanjima agencije* i pamćenje odjava
sa newslettera ne rade; ostatak sajta radi normalno. Ne upisivati u bazu
skriptama sa računara — ALTER pušta vlasnik.

**Ponuđeno, nije traženo:** ikona pretrage u zaglavlju na telefonu (uska
pretraga je sakrivena, na `/galerije` postoji svoja).

**Iz `CLAUDE.md`, i dalje važi:** „Čeka odluku klijenta" (stavke 2–6),
predlog C (dugme za pauzu, virak kartice), ekran za unos videa,
`docs/outline-none.md`, `docs/van-tokena.md`.

**Zastarelo u `CLAUDE.md`:** odeljak „Visina zaglavlja — `--zaglavlje-visina`"
opisuje fiksirano zaglavlje sa meračem. Ne važi — zaglavlje je u toku strane i
token je `0px` (tačno je opisano u odeljku „Zaglavlje nije fiksirano").

---

## 6. Način rada koji vlasnik očekuje

- Piše na srpskom, odgovara se na srpskom (ekavica, latinica).
- Kratko: jedna do tri rečenice po izmeni, bez tabela i rekapitulacija.
- Više stavki u jednom zahtevu — uradi sve, javi jednom.
- Pregledač i merenje samo kad se traži ili kad se diraju zajednički fajlovi.
- „Samo za telefon" znači: desktop se ne sme pomeriti ni za piksel.
- Commit i push samo kad kaže („gurni", „push"). Push ide na `main`.
