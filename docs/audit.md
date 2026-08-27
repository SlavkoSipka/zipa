# Audit vizuelnog stanja — ZIPA PHOTO

Pregled svih SCSS fajlova (19, ukupno **14.741 red**) i svih komponenti u
`views/` i `components/`. Ništa nije menjano.

---

## 1. Boje

**111 različitih boja** u projektu. Definisano kao promenljive: **9**.
Ostalih 102 su upisane rukom u fajlove.

### Najčešće

| Puta | Vrednost | Gde |
|---|---|---|
| 60 | `#EDEFF5` | `_account`(21), `_category`(13), `_global`(13), `_photographer`(4) |
| 46 | `#FFF` | `statistics.js`(21), `_global`(7), `contactPage.js`(4) |
| 43 | `#6D7587` | `_global`(12), `_account`(8), `_category`(7) |
| 37 | `#2F629C` | `statistics.js`(10), `previewPage.js`(6), `profilePage.js`(6) |
| 23 | `rgba(0,0,0,0.1)` | `_global`(18), `_detail`(3), `_category`(1) |
| 18 | `#3C59B9` | `_photoModal`(4), `contactPage.js`(3), `_photographer`(2) |
| 18 | `#7C7C7C` | `statistics.js`(18) |
| 17 | `#F4F5FB` | `photographerStats.js`, `previewPage.js`, `galleryStats.js` |
| 16 | `#9DA5BE` | `_account`(7), `_global`(5) |
| 16 | `#5C3784` | `_account`(7), `_category`(3), `_global`(3), `_contact`(3) |
| 15 | `#7B7B93` | `_global`(8), `_login`(4), `_cart`(2) |
| 12 | `#F4F6FA` | `_global`(4), `_login`(4), `_naslovnaA`(2) |
| 11 | `#FFFFFF` | isti bela kao `#FFF`, pisana drugačije |
| 11 | `#DDDDDD` | `_login`(4), `_cart`(3) |
| 11 | `rgba(220,220,220,1)` | u JS fajlovima, grafikoni |

### Problematične grupe

**Sedam nijansi sive-plave koje se ne razlikuju golim okom:**
`#EDEFF5`, `#EEF1F6`, `#EBEEF5`, `#F4F5FB`, `#F4F6FA`, `#F7F8FC`, `#E8EBF2`

**Šest sivih za tekst:**
`#6D7587`, `#7B7B93`, `#9DA5BE`, `#6B7280`, `#858C9C`, `#7C7C7C`

**Bela napisana na tri načina:** `#FFF`, `#FFFFFF`, `rgba(255,255,255,1)`

**Boje koje nemaju veze sa identitetom:** `#5C3784` (ljubičasta, 16x),
`#CE8FFF` (svetloljubičasta, 5x), `#2F629C` (druga plava, 37x u grafikonima),
`#369C2F` (zelena), `#E2082D` (druga crvena, uz postojeću `#D60006`).

**Dve crvene i tri plave** postoje uporedo: `$red: #D60006` naspram `#E2082D`;
`$blue` i `$darkBlue` su **ista vrednost** `#3C59B9`, a uz njih stoji i
`#2F3FB5` i `#2F629C`.

---

## 2. Veličine fonta

**39 različitih vrednosti.** Nijedna nije promenljiva.

| Puta | Vrednost |
|---|---|
| 156 | `14px` |
| 122 | `16px` |
| 61 | `12px` |
| 46 | `18px` |
| 29 | `24px` |
| 25 | `32px` |
| 22 | `20px` |
| 15 | `26px` |
| 14 | `22px` |
| 10 | `13px` |

Zatim: `15, 11, 28, 42, 21, 30, 17, 48, 10, 27, 19, 64, 38, 23` px.

**Decimalne vrednosti** (uvedene u novijim fajlovima): `13.5px`, `11.5px`,
`12.5px`, `10.5px`, `14.5px`.

Samo dva mesta koriste `rem`; sve ostalo je `px`, pa uvećanje slova u
pregledaču nema efekta.

Nema nijedne lestvice — između `12` i `13` i `13.5` i `14` i `14.5` nema
pravila, biralo se po oku.

---

## 3. Border-radius i box-shadow

### Border-radius — 32 različite vrednosti

| Puta | Vrednost |
|---|---|
| 69 | `15px` |
| 51 | `10px` |
| 29 | `20px` |
| 25 | `50%` |
| 24 | `25px` |
| 20 | `3px` |
| 19 | `6px` |
| 13 | `27px` |
| 12 | `23px`, `4px` |
| 11 | `30px` |
| 9 | `8px` |
| 8 | `122px`, `0 0 20px 20px` |
| 5 | `33px` |
| 4 | `26px` |
| 3 | `124px` |

`122px`, `124px`, `120px` su tri pokušaja da se dobije potpuno zaobljeno
dugme — za to služi `999px`.

`23px`, `25px`, `26px`, `27px`, `30px`, `33px` su šest vrednosti za istu
nameru.

### Box-shadow — 12 različitih

| Puta | Vrednost |
|---|---|
| 18 | `0px 14px 24px 0px rgba(0, 0, 0, 0.1)` |
| 7 | `none !important` |
| 3 | `0px 4px 8px 0px rgba(0, 0, 0, 0)` — senka bez vidljivosti |
| 3 | `0px 4px 8px 0px rgba(0, 0, 0, 0.2)` |
| 3 | `0 2px 8px 0 rgba(0, 0, 0, 0.1)` |
| 2 | `0 2px 8px 0 rgba(0,0,0,0.1)` — ista, bez razmaka |
| 1 | `0 3px 14px rgba(20, 26, 45, 0.07)` |
| 1 | `0 12px 34px rgba(17, 19, 24, .16)` |

Glavna senka `0px 14px 24px` je duboka i mekana — obrazac iz 2019—2020.

---

## 4. Fontovi

Jedan font: **Poppins**, težine 300–700.

Učitava se sa **Google Fonts**, iz `App.scss`, redom drugim:

```
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
```

Postavljen na `body` i `html` u `_global.scss`.

**Zapažanja:**

- `@import` unutar CSS-a blokira prikaz — font se traži tek pošto se pročita
  ceo stil. Bolje `<link rel="preconnect">` i `<link>` u zaglavlju.
- Pet težina za sajt koji koristi uglavnom tri (400, 600, 700).
- Nema lokalne rezerve — ako Google ne odgovori, pada na `sans-serif`.
- Nema `font-display` podešavanja osim `swap` iz adrese.
- Poppins je geometrijski font vrlo prisutan u šablonima; za foto-agenciju
  koja prodaje ozbiljnu novinsku fotografiju deluje mekše nego što sadržaj
  traži.

---

## 5. Razmaci

**79 različitih px vrednosti** u `padding`, `margin` i `gap`.

| Puta | Vrednost | Deljivo sa 4 |
|---|---|---|
| 212 | `20px` | da |
| 195 | `10px` | ne |
| 135 | `30px` | ne |
| 78 | `15px` | ne |
| 75 | `14px` | ne |
| 59 | `5px` | ne |
| 54 | `8px` | da |
| 48 | `50px`, `12px` | ne / da |
| 41 | `13px` | ne |
| 37 | `40px` | da |
| 36 | `9px`, `16px` | ne / da |
| 34 | `18px` | ne |

**53 od 79 vrednosti nisu deljive sa 4.** Preovlađuje lestvica od 5
(`5, 10, 15, 20, 30, 50`), ali se s njom mešaju `9, 11, 13, 14, 18, 22, 34`.

Nema nijedne promenljive za razmak.

---

## 6. Isti element napisan više puta

### Dugme — 76 definicija u 13 fajlova, 19 različitih kombinacija

Primeri istog dugmeta:

| Fajl | Pozadina | Radijus | Razmak |
|---|---|---|---|
| `_category` | `$blue` | `122px` | `12px 52px 11px 52px` |
| `_cart` | `$darkBlue` | `124px` | `16px 22px 16px 33px` |
| `_cart` | `$darkBlue` | `27px` | `14px 22px 14px 35px` |
| `_contact` | `$darkBlue` | `120px` | `10px 30px` |
| `_store` | `$darkBlue` | `25px` | `8px 30px` |
| `_category` | `$darkBlue` | `6px` | `8px 14px` |
| `_photographer` | `$blue` | `10px` | `5px 20px` |

Sedam „glavnih plavih dugmadi" sa sedam različitih radijusa i sedam
različitih razmaka.

### Kartica galerije — najmanje šest verzija

| Fajl | Pravila sa radijusom/isecanjem |
|---|---|
| `_category.scss` | 29 |
| `_photographer.scss` | 21 |
| `_naslovnaC.scss` | 19 |
| `_naslovnaA.scss` | 16 |
| `_naslovnaB.scss` | 12 |
| `_home.scss` | 10 |

Ista kartica — slika, naslov, podaci — pisana šest puta nezavisno. U novim
predlozima se zove `.kartica`, u starim `.home-article`, u pretrazi
`.photo-result`, kod predloga A `.plocica`.

### Polja obrazaca — 38 definicija u 12 fajlova

Prijava, korpa, kontakt, administracija i pretraga imaju svaki svoju verziju
polja za unos.

---

## 7. Postojeće SCSS promenljive

Sve u jednom fajlu: **`scss/_settings.scss`**. Ukupno **16**.

```scss
$white: #FFFFFF;      $black: #1F1F1F;      $gray: #A8A8A8;
$darkGray: #6D7587;   $lightGray: #D9D9D9;  $red: #D60006;
$blue: #3C59B9;       $darkBlue: #3C59B9;   $lightBlue: #DEEBF8;
$bgColor: #F4F5FB;    $skewAngle: -10deg;

$light: 300;   $regular: 400;  $medium: 500;
$semiBold: 600; $bold: 700;    $extraBold: 800;
```

**Nema nijedne promenljive za:** razmak, veličinu fonta, radijus, senku,
visinu reda, brzinu prelaza, slojeve (`z-index`).

`$blue` i `$darkBlue` imaju **istu vrednost**, pa imena ne znače ništa.

Nijedan drugi fajl ne definiše promenljive — bar je to na jednom mestu.

---

## 8. Prelomne tačke

Sistem **postoji** i uglavnom se poštuje: četiri mixina u `_settings.scss`,
korišćena **323 puta**.

| Mixin | Puta | Opseg |
|---|---|---|
| `@include mobile` | 236 | do 767 |
| `@include mobile-tablet` | 54 | do 1023 |
| `@include tablet` | 21 | 768–1023 |
| `@include small-desktop` | 12 | 992–1199 |

**Ali:** postoji i **15 ručno pisanih** upita mimo sistema, sa tačkama
`578, 767, 768, 992, 1023, 1024, 1199, 1200, 1500, 1600` px — plus dva po
visini ekrana (`680`, `820`), koje sam uveo za naslovni blok predloga B.

`tablet` (768–1023) i `small-desktop` (992–1199) se **preklapaju** u opsegu
992–1023.

Tražene tačke **480 / 768 / 1024 / 1440** se ne poklapaju sa postojećim:
nema ničega na 480, granica je 767 umesto 768, i nema ničega na 1440.

---

# NAJVEĆI PROBLEMI

Poređano po tome koliko doprinose utisku zastarelosti.

### 1. Nema sistema — 111 boja, 39 veličina slova, 79 razmaka, 32 radijusa

Ovo je koren svega ostalog. Svaka strana je rađena zasebno, pa svaka
izgleda kao poseban sajt. Dok se ovo ne sredi, svaka izmena je krpljenje.

### 2. Duboke mekane senke i preterano zaobljeni uglovi

`0px 14px 24px rgba(0,0,0,0.1)` uz radijuse od `15–30px` je vizuelni potpis
2019—2020. Današnji izgled je oštriji: radijus 6–12, senka jedva primetna ili
je nema, a razdvajanje se postiže tankom linijom.

### 3. Dugme napisano na devetnaest načina

Sedam glavnih plavih dugmadi sa radijusima `6, 10, 25, 27, 120, 122, 124`.
Korisnik nesvesno primeti da „nešto ne štima" iako ne ume da kaže šta.

### 4. Kartica galerije u šest verzija

Najvažniji element na sajtu — fotografija sa naslovom — pisan je šest puta.
Za foto-servis je to element koji se vidi hiljadu puta po poseti.

### 5. Boje van identiteta

Ljubičasta `#5C3784` i `#CE8FFF` (21 pojava), druga plava `#2F629C` (37),
zelena, druga crvena. Agencija ima crvenu i plavu; sve ostalo razvodnjava.

### 6. Sve u pikselima, ništa u rem

Ko poveća slova u pregledaču — ništa se ne dešava. Uz to su veličine
neusklađene (`12, 13, 13.5, 14, 14.5`), pa tekst nema ritam.

### 7. Fokus na tastaturi je ugašen na 103 mesta

`outline: none` bez zamene. Ko koristi tastaturu ne vidi gde se nalazi.
Nema nijednog `:focus-visible` u celom projektu.

### 8. Nema obzira prema `prefers-reduced-motion`

Nula pojava. Svi prelazi i uvećanja pri prelasku mišem rade i onima koji su
u sistemu tražili da se kretanje smanji.

### 9. `_global.scss` od 4.173 reda

Četvrtina svih stilova u jednom fajlu, sa 62 `!important`. Svaka izmena tu
je rizik po ceo sajt — što se već pokazalo dvaput u ovom radu, kad je
postojeće pravilo nadjačalo novo.

### 10. Poppins sa Google Fonts preko `@import`

Blokira prvi prikaz, učitava pet težina umesto tri, nema lokalnu rezervu.
Uz to je izbor fonta mekši nego što novinska fotografija traži.

---

## Predlog prvog koraka

Napraviti `scss/_tokens.scss` sa:

- **8–10 boja** umesto 111 (dve iz identiteta, četiri sive, dve podloge, dve stanja)
- **lestvica slova** u `rem`, 7 stepeni umesto 39
- **lestvica razmaka** od 4, 8 stepeni umesto 79
- **tri radijusa** umesto 32 (mali 6, srednji 10, pun 999)
- **dve senke** umesto 12
- **prelomne tačke** 480 / 768 / 1024 / 1440, kao jedini sistem

Zatim redom: dugme, polje obrasca, kartica galerije. Tek onda pojedinačne
strane — do tada svaka izmena stvara još jednu verziju istog elementa.
