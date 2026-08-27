# Van tokena

Boje koje se na sajtu iscrtavaju, a ne dolaze iz `scss/_tokens.scss`. Popis
je napravljen 2026-08-23 — merenjem u pregledaču (tema A, `/galerije`) i
pretragom po SCSS-u. Ne rešava se odjednom nego po stranama, uz redizajn.

Kontrast je meren prema beloj (`--boja-podloga`) i tihoj podlozi
(`--boja-podloga-tiha`, `#F5F6F8`). Prag za tekst je 4,5:1.

**Kako čitati tabelu.** Kontrast važi samo tamo gde je boja stvarno tekst,
zato kolona „kao tekst". Svetle boje (ispod 3:1 na beloj) su skoro sigurno
tekst na tamnoj podlozi — njih merenje prema beloj ne opisuje i ovde se ne
sudi o njima; proveravaju se uz stranu na kojoj stoje.

## Zakucane boje u SCSS-u

| Boja | Pojavljivanja | Kao tekst | Na beloj | Na tihoj | Stanje |
|---|---|---|---|---|---|
| `#EDEFF5` | 62 | 52 | 1.15:1 | 1.06:1 | svetla — za tamnu podlogu, nije mereno |
| `#6D7587` | 43 | 31 | 4.62:1 | 4.27:1 | **PADA** |
| `#3C59B9` | 18 | 8 | 6.32:1 | 5.85:1 | prolazi |
| `#9DA5BE` | 16 | 11 | 2.45:1 | 2.27:1 | svetla — za tamnu podlogu, nije mereno |
| `#5C3784` | 16 | 1 | 8.99:1 | 8.32:1 | prolazi |
| `#7B7B93` | 15 | 15 | 4.12:1 | 3.81:1 | **PADA** |
| `#F4F6FA` | 12 | 11 | 1.08:1 | 1.00:1 | svetla — za tamnu podlogu, nije mereno |
| `#DDDDDD` | 11 | 7 | 1.36:1 | 1.26:1 | svetla — za tamnu podlogu, nije mereno |
| `#EEF1F6` | 9 | 1 | 1.13:1 | 1.05:1 | svetla — za tamnu podlogu, nije mereno |
| `#6B7280` | 9 | 9 | 4.83:1 | 4.47:1 | **PADA** |
| `#1F1F1F` | 9 | 0 | 16.48:1 | 15.24:1 | — (nije tekst) |
| `#EBEEF5` | 8 | 0 | 1.16:1 | 1.07:1 | — (nije tekst) |
| `#CE8FFF` | 5 | 5 | 2.33:1 | 2.16:1 | svetla — za tamnu podlogu, nije mereno |
| `#E2082D` | 5 | 2 | 4.88:1 | 4.51:1 | prolazi |
| `#2F3FB5` | 4 | 2 | 8.40:1 | 7.77:1 | prolazi |
| `#C7CCD8` | 4 | 4 | 1.61:1 | 1.49:1 | svetla — za tamnu podlogu, nije mereno |
| `#D60006` | 4 | 0 | 5.44:1 | 5.03:1 | — (nije tekst) |
| `#E4E8F0` | 4 | 0 | 1.23:1 | 1.14:1 | — (nije tekst) |
| `#F3F3F3` | 4 | 3 | 1.11:1 | 1.03:1 | svetla — za tamnu podlogu, nije mereno |
| `#F5F5F5` | 3 | 3 | 1.09:1 | 1.01:1 | svetla — za tamnu podlogu, nije mereno |

## Šta gori

**`#7B7B93` i `#6D7587` — REŠENO 2026-08-25.** Vidi odeljak ispod.

**`#6B7280` — 4,83:1 / 4,47:1.** Isti slučaj, granično. Ostaje: pojavljuje se
u `_naslovnaA/B/C.scss` i `_category.scss`, na predlozima naslovne koji još
čekaju prekrajanje.


## Rešeno — `#7B7B93` i `#6D7587` (2026-08-25)

Obe boje su zamenjene sa `var(--boja-tekst-tiho)` na **29 mesta**:
`_global.scss` 14, `_category.scss` 8, `_account.scss` 7. U `_tokens.scss`
nisu dirane — tamo `#6D7587` stoji kao **zatečena vrednost tokena pod temom
„trenutni"** i tu i ostaje.

### Zašto je ovo bezbedno za temu „trenutni"

Pod `[data-tema="trenutni"]` token `--boja-tekst-tiho` iznosi **tačno
`#6D7587`**. Zamena `#6D7587` → `var(--boja-tekst-tiho)` je zato pod tom
temom **identitet** — 26 od 29 mesta se ne pomera ni za jedan bit.

Preostala tri mesta su bila `#7B7B93`. Sva tri su **mrtvi selektori**,
provereno pojedinačno:

| Mesto | Selektor | Zašto ne iscrtava |
|---|---|---|
| `_category.scss:178` | `.date-picker-field > input span` | `<input>` nema decu — pravilo se nikad ne poklopi |
| `_global.scss:3553` | `.detail-search-modal … .buttons > :nth-child(2)` | napredna pretraga je prekrojena; `.buttons` više ne postoji u markupu |
| `_global.scss:3026` | `.checkbox-label` | iscrtavaju ga `fields/check.js` i `toggleCheckbox.js`, a od formi koje ih koriste nijedna nije na javnom delu sajta |

`.checkbox-label` i dalje stoji u obrascima **administracije**, koji nisu
prekrojeni. Tamo je promena 4,12:1 → 4,62:1 pod „trenutni" i 4,12:1 → 4,98:1
pod temama A/B/C — u oba slučaja bolje nego pre.

### Izmereno posle zamene (tema A, 1280px)

| Mesto | Boja | Podloga | Odnos |
|---|---|---|---|
| Kartica galerije — „Banja Luka · 18.05.2026." | `#6B7079` | bela `#FFFFFF` | **4,98:1** |
| Obojena sekcija — zaglavlje fotografa, „Banja Luka, BA" | `#6B7079` | tiha `#F5F6F8` | **4,60:1** |

Pre zamene je isti tekst na kartici bio `#7B7B93` (**4,12:1**), a na obojenoj
sekciji `#6D7587` (**4,27:1**) — oba ispod praga od 4,5:1. Sada oba prolaze.

Pod temom „trenutni" iste dve tačke ostaju na zatečenih 4,62:1 i 4,02:1 —
zatečeni izgled se nije pomerio, što je i bila namera.

**`#9DA5BE` (2,45:1) i `#CE8FFF` (2,33:1)** kao tekst na svetloj podlozi ne
prolaze ni blizu. Treba videti stoje li stvarno na svetlom — ako da, menjaju
se; ako su na tamnom, ostaju dok se ta strana ne radi.

## Nasleđeno iz Bootstrap-a

Ne stoji u našem SCSS-u nego u `bootstrap.min.css`, koji se uvozi u `App.js`.

| Šta | Boja | Gde | Napomena |
|---|---|---|---|
| `body` | `#212529` | nasleđuje ga skoro svaki sadržalac | 15,43:1 — ne pada, ali je van sistema |
| `a` | `#007bff` | 41 golo `<a>` na `/galerije` | 3,98:1 — palo bi da se vidi |

Plava sa `<a>` se najčešće **ne vidi**, jer unutrašnji element (naslov
kartice, natpis) postavlja svoju boju. Opasnost je što svaki nov element
unutar takvog `<a>`, bez svoje boje, dobija plavu — logotip je bio na korak
od toga (zatvoreno 2026-08-23 u `_zaglavlje.scss`).

## Redosled rešavanja

1. `#7B7B93` → `--boja-tekst-tiho` — jedini koji pada a vidi se na svakoj kartici.
2. `#6D7587` i `#6B7280` → `--boja-tekst-tiho` — najbrojniji.
3. `#9DA5BE`, `#CE8FFF` — prvo utvrditi podlogu, pa odlučiti.
4. Gola `<a>` bez boje — uz redizajn svake strane.
5. `body` iz Bootstrap-a — tek kad sve strane budu na tokenima.
