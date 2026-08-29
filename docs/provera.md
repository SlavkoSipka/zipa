# Kontrolni prolaz — 2026-08-27

Poslednja provera pre ručnog prolaska kroz sajt. Ovde stoji **šta je nađeno**,
**šta je popravljeno** i **šta nisam mogao sam da proverim**.

Mereno na svežem učitavanju, po pravilu iz `CLAUDE.md`: tema se postavlja
**pre prvog iscrtavanja**, ne prebacivanjem `data-tema` u letu. Za to je
napravljen posrednik ka API-ju koji menja samo `homepageLayout` u odgovoru
`/settings` — baza nije dirana. Posrednik i probni server su posle merenja
ugašeni, a sajt je vraćen na uobičajenu gradnju (`API_ENDPOINT` opet
`localhost:10015`).

Mereno je **20 javnih strana** × 5 širina (320 / 375 / 768 / 1024 / 1440) za
preliv, i na 1280 za kontrast i fokus. Strane iza prijave su dodate naknadno —
vidi **Dopunu** na kraju.

---

## Kratak pregled

| Stavka | Stanje |
|---|---|
| 1. Zakucane vrednosti van tokena | popravljeno u svim prekrojenim fajlovima |
| 2. Kontrast — tekst 4,5:1, ivice 3:1 | 6 grupa kvarova nađeno, 5 popravljeno |
| 3. Tastatura — red, vidljiv fokus, Escape | prolazi; 3 mesta doterana |
| 4. Vodoravni preliv na 5 širina | **nigde nema preliva** |
| 5. Mrtav CSS i mrtvi `@import` | 1.030 redova obrisano |
| 6. Dugme za pauzu + virak kartice | oba urađena i izmerena |
| 7. Strane iza prijave | naknadno; 6 kvarova nađeno i popravljeno — vidi Dopunu |

---

## 1. Zakucane vrednosti — nađeno i prebačeno u tokene

### Šta je nađeno

Pretraga je išla po **prekrojenim** fajlovima (grupa 3 iz `App.scss` plus
`_naslovnaA`, `_komponente`, `_settings`, `_stilovi`). Zatečeni fajlovi
(`_global`, `_category`, `_detail`, `_account`, `_home`, `_blog`) nisu deo
redizajna i o njima piše niže.

| Vrsta | Nađeno | Gde |
|---|---|---|
| Veličine slova | 61 mesto | `_kartica`, `_alatnaTraka`, `_galerija`, `_photoModal`, `_login`, `_cart`, `_nalog`, `_naslovnaA` |
| Radijusi | 27 mesta | isti fajlovi + `_zaglavlje`, `_naprednaPretraga` |
| Boje (heks) | 24 mesta | sve u `_naslovnaA.scss` |
| Boje (`rgba`) | 4 mesta | `_naslovnaA`, `_video` |

Boje su bile skoro sve u dva bloka `_naslovnaA.scss` koji **nemaju veze sa
naslovnom** — `.arhiva-stat` i `.zigovi-strana`, dva ekrana administracije
koja su tu ostala jer je fajl bio pri ruci.

### Novi tokeni

Nisu nove odluke o izgledu — to su vrednosti koje su **već stajale zakucane**
i sad imaju ime. Bez njih se zakucane mere nisu imale u šta prevesti.

| Token | Vrednost | Zašto |
|---|---|---|
| `--slovo-oznaka` | 0,625rem (10px) | oznaka preko fotografije; verzal na 12px izgleda krupnije od 12px teksta |
| `--slovo-sitno` | 0,71875rem (11,5px) | gust panel sa cenama |
| `--slovo-lg-plus` | 1,375rem (22px) | korak koji je **nedostajao** između `lg` (18) i `xl` (24) |
| `--radijus-oznaka` | 3px | sitna oznaka visoka 14–16px; na njoj se 6px vidi kao pun krug |
| `--boja-zastor-foto` | `rgba(9,12,22,.9)` | zatamnjenje ispod natpisa preko snimka |
| `--boja-zastor-dugme` | `rgba(9,12,22,.58)` | okruglo dugme na snimku |
| `--boja-zastor-oznaka` | `rgba(9,12,22,.66)` | podloga sitne oznake |
| `--senka-preko-foto` | `0 1px 3px rgba(9,12,22,.55)` | znak na snimku (`/video`) |

Uz njih još pet tokena koji rešavaju kvarove kontrasta — vidi odeljak 2.

`--slovo-lg-plus` je popravio i jednu zapisanu ogradu: `_alatnaTraka.scss` je
imao komentar *„nijedan token se ne poklapa tačno (24 ili 32 najbliži), pa ide
direktna vrednost"*. Ta rupa u lestvici sad ne postoji.

### Mere koje su se pomerile

Većina zamena je **bez ikakve promene u prikazu** — 12/14/16/18/24px su tačne
vrednosti postojećih tokena. Ove su se pomerile, sve u administraciji i sve
najviše za 1px, osim dve označene:

| Bilo | Postalo | Token | Gde |
|---|---|---|---|
| 13px | 14px | `--slovo-sm` | `.arhiva-stat .opis`, dugmad u `.zigovi-strana` |
| 14,5px | 14px | `--slovo-sm` | natpis preko pločice, `.zig b` |
| 15px | 16px | `--slovo-md` | `.uvod` u oba ekrana |
| 19px | 18px | `--slovo-lg` | `.arhiva-stat h2` |
| 21px | 22px | `--slovo-lg-plus` | `.naslov-odeljka h3` |
| 10,5px | 10px | `--slovo-oznaka` | oznaka na žigu |
| 11px | 11,5px | `--slovo-sitno` | oznaka na pločici |
| **27px** | **24px** | `--slovo-xl` | veliki broj u `.arhiva-stat` |
| **28px** | **24px** | `--slovo-xl` | `h1` u oba ekrana administracije |

Poslednje dve su najveći pomak (−3 i −4px). Nisu nasumične: **prekrojene
strane naloga (`_nalog.scss`) već koriste 24px za `h1`**, pa ova dva ekrana
sada stoje u istom redu sa ostatkom administracije umesto da su za nijansu
krupnija. Ako ti to bode oči pri ručnom prolasku, javi — vraća se u jednom redu.

Radijusi 8/10/15px u ta dva ekrana su svedeni na `--radijus-panel` (6px).

### Šta je NAMERNO ostavljeno

- **`_naslovnaB.scss` i `_naslovnaC.scss`** — rekao si da ih ne diram. U njima
  je ostalo 7 zakucanih boja (`#6B7280`, `#C7CCD8`, `#9096A5`, `#E7EAF0`,
  dva `rgba` zastora) i nekoliko veličina. Ide uz njihov korak.
- **Zatečeni fajlovi** — `_global` (31 mesto), `_account` (43), `_category`
  (22), `_detail` (8), `_home` (3). Te strane nisu prekrojene; spisak stoji u
  `docs/van-tokena.md` i rešava se po stranama, kako je i dogovoreno.
- **Razmaci** — nisu bili u tvom spisku (boja, slovo, radijus, senka). Ostalo
  je nekoliko zakucanih (`padding: 28px 0 20px` u `_alatnaTraka`), jer lestvica
  razmaka ide 4/8/12/16/24/32 i nema 20 ni 28.
- **`border-radius: 50%`** — to je oblik (krug), ne vrednost iz sistema.
- **`_print.scss`** drži `#fff` i `#000` — papir je beo a mastilo crno bez
  obzira na temu.

---

## 2. Kontrast — sve četiri teme

### Prvo: teme A, B i C su **isto obojene**

Provereno u prevedenom `App.css`, ne po sećanju:

```
[data-tema=a]  → /* namerno prazno */
[data-tema=b]  → /* namerno prazno */
[data-tema=c]  → /* namerno prazno */
[data-tema=trenutni] → 53 tokena
```

Nijedan drugi selektor u celom `App.css` ne zavisi od `data-tema`. Znači A, B
i C daju **identične boje na svakoj strani** — razlikuje ih samo koja se
naslovna crta. Zato je kontrast meren dva puta (A i „trenutni"), a za B i C
posebno samo naslovna.

### Nađeni kvarovi i popravke

**a) Ivica polja i dugmadi — 1,23:1 (traži se 3:1)** — *popravljeno*

`--boja-linija` (`#E6E8EB`) je stajala kao ivica polja za unos, pilula i
obrubljene dugmadi. Za razdvajanje u toku teksta ta tišina je namerna, ali kad
je ivica **jedino** što pokazuje gde počinje polje, WCAG 1.4.11 traži 3:1.

Pogođeno: `/login` (2), `/register` (5), `/contact` (10), `/reset-password`
(1), `/reset-password/:uid/:kod` (2), `/galerije` (1), `/fotograf` (12),
`/stilovi` (5).

→ Dodat `--boja-linija-kontrola: #868C93` — **3,39:1 na beloj, 3,14:1 na
tihoj podlozi**. Primenjen na 14 mesta koja su stvarno kontrole; ivice kartica
i panela (`.z-kartica`, `.z-poruka`, padajuća lista) su ostale tihe, jer one
nisu granica kontrole.

Posle popravke: **0 palih ivica na svim stranama** osim `/stilovi` (dole).

**b) Tekst na oznaci — 2,07 do 2,52:1** — *popravljeno*

`--boja-tekst-na-akcentu` je tamnobraon (`#3A2B0C`), napravljena za **amber**.
Ali su je koristile i crvena, zelena i braon oznaka, i uključena pilula
filtera. Na tim podlogama daje 2,52:1 / 2,07:1 / 2,32:1.

→ Dodat `--boja-tekst-na-oznaci: #FFFFFF` (5,44 / 6,62 / 5,92:1) i primenjen
na `.z-oznaka--oznaka`, `--uspeh`, `--upozorenje` i `.z-pilula--ukljuceno`.

**c) Oznaka grupe na `/galerija/:alias/:id/:photo` — 1,97:1** — *popravljeno*

`&__oznaka-grupe` je podrazumevano uzimala `--boja-traka-tekst-tiho`
(`#B4B9C0`) — boju za **tamni panel** — a natpis „Podijelite" stoji na
**beloj** strani. Podrazumevano pravilo i izuzetak su bili naopako postavljeni.

→ Podrazumevano je sad `--boja-tekst-tiho` (za belu stranu), a tiha boja trake
se dodaje **unutar** `&__panel`, gde podloga i jeste tamna.

**d) Broj fotografija na kartici — 4,36:1** — *popravljeno*

Belo na `--boja-zavesa` (`rgba(17,19,21,.55)`) nad svetlim kadrom.
→ Sopstveni token `--boja-zastor-oznaka` na `.66` → **6,04:1**.

**e) Tema „trenutni" je bila POKVARENA — i to ozbiljno** — *popravljeno*

Ovo je najveći nalaz prolaska. „Trenutni" je po `CLAUDE.md` **mreža za pad** —
ono na šta se sajt vraća ako nešto pukne. Pod njom je bilo:

| Šta | Izmereno | Posledica |
|---|---|---|
| `.z-podnozje__veza` | **1:1 (belo na belom)** | **celo podnožje se nije videlo, na 19 od 20 strana** |
| `.z-zaglavlje__trazi-se-pojam` | 1:1 | red „Traži se:" nevidljiv |
| `.z-zaglavlje__dugme-prijava` | 1,09:1 | dugme „Prijava" nečitljivo |
| `.z-zaglavlje__najava-dugme` | 1,09:1 | dugme u traci najave nečitljivo |
| `.z-zaglavlje__najava-tekst` | 3,34:1 | natpis u traci najave |
| `.z-kartica-galerije__broj` | 2,36:1 | broj fotografija na kartici |
| `.z-fotografija__rezolucija` (ivica) | 1,06:1 | izbor rezolucije se nije video |
| `.z-fotografija__strelica` (ivica) | 1,15:1 | strelice uz fotografiju |

Uzrok je svuda isti: **zaglavlje i podnožje su zajednička, prekrojena, i pod
svim temama ista** — a njihove boje se izvode iz `--boja-traka*`. U novom
pravcu je traka tamna, pa su „na traci" tokeni svetli. Pod „trenutni" traka
postaje **bela**, a ti tokeni su ostali svetli → belo na belom.

Popravljeno kroz tokene, bez diranja izgleda pod A/B/C:

| Token | `:root` | `trenutni` |
|---|---|---|
| `--boja-veza-traka` | `--boja-traka-tekst` (belo) | `#3C59B9` (ista plava kao `--boja-veza`) |
| `--boja-pilula-tekst` *(nov)* | `--boja-traka` | `#1F1F1F` |
| `--boja-najava-tekst` *(nov)* | `#FFFFFF` | `#FFFFFF` (traka najave je plava pod svim temama) |
| `--boja-traka-linija-kontrola` *(nov)* | `--boja-traka-linija` | `--boja-linija-kontrola` |

Posle popravke, pod „trenutni": podnožje `rgb(31,31,31)` na belom, veza
`rgb(60,89,185)` = **6,32:1**; **0 palih ivica** na svih 11 proverenih strana.

**f) Ostalo pod „trenutni" — 4,02 do 4,25:1** — *ODLUKA: ostaje kako jeste*

Posle svih popravki pod „trenutni" ostaje **12 mesta, sva iz istog uzroka**:
`--boja-tekst-tiho` je pod tom temom `#6D7587` — to je **zatečena vrednost
starog sajta**, koju tema namerno vraća. Na `#EDEFF5` daje **4,02:1**, na
`#F4F5FB` **4,25:1**.

Gde se vidi: `.z-fotograf__uloga/__mesto/__broj-naziv/__kontakt-naziv`,
`.z-pomoc__uvod`, `.z-kontakt__uvod`, `.z-video__uvod`, `.z-najava__trajanje`,
`.z-zaglavlje__vrsta-dugme`, `.z-fotografija__podnaslov/__oznaka-grupe`.

**Nisam ovo menjao namerno.** Tema „trenutni" postoji da reprodukuje stari
sajt tačno; podizanje te boje bi promenilo izgled kome je posao da se ne menja.
Isto piše i u `docs/van-tokena.md` (`#6D7587`, 43 pojavljivanja, „PADA").

**Odluka (2026-08-27):** ne dira se. Tema „trenutni" postoji da stari sajt
izgleda tačno kao pre; kontrast se popravlja u novom pravcu, ne u zamrznutom.
Ostaje zapisano da se zna da je mereno, a ne previđeno.

(Za slučaj da se odluka ikad promeni, popravka je jedan red u
`[data-tema="trenutni"]`: `--boja-tekst-tiho: #656C7D` — 4,54:1 na `#EDEFF5`.
Pod A/B/C se ne bi promenilo ništa, one imaju svoju vrednost `#6B7079`.)

**g) Amber ivica — 2:1 na beloj** — *ODLUKA: ostaje kako jeste*

`.z-dugme--glavno` i `.z-stranice__dugme--ovde` imaju amber ivicu oko amber
površine; amber na beloj je 2:1. To je već zapisano u `_tokens.scss` („amber je
površina, nikad tekst") i tiče se **identiteta**, ne previda. Tekst NA amberu
prolazi (6,87:1), a okvir fokusa je tamni (8,36:1 uz amber). Vidi se samo na
`/stilovi`, gde stoje svi delovi jedan uz drugi.

**Odluka (2026-08-27):** ostaje. Ivica iste boje kao površina ne nosi nikakvu
informaciju — dugme se razaznaje površinom i tekstom, a oba prolaze.

---

## 3. Tastatura

### Red fokusa

Na svih 20 strana: **nijedan `tabindex` veći od nule**. Red kretanja je red u
dokumentu — zaglavlje → sadržaj → podnožje. Nema preskakanja ni vraćanja.

### Vidljiv fokus

Prvo merenje je reklo da **nijedan** element nema znak fokusa. To je bila
greška moje alatke, ne sajta, i vredi je zapisati:

- `el.focus()` iz skripte **ne pali `:focus-visible`** po istim pravilima kao
  pritisak Taba — pregledač ima svoju heuristiku.
- Kad sam prešao na čitanje samih pravila iz `document.styleSheets`, dobio sam
  nulu iz drugog razloga: **`CSSStyleRule` od uvođenja ugnježđavanja takođe ima
  `cssRules`, samo prazan** — a prazna lista je `truthy`. Rekurzija se spuštala
  u prazno i preskakala samo pravilo. Uslov mora da gleda `cssRules.length`.

Posle popravke: 301 pravilo sa `:focus` u stilovima, i **provera stvarnim
pritiskom Taba** (26 koraka kroz naslovnu) — svaki fokusiran element ima
vidljiv okvir:

- `solid 2px rgb(27,30,36)` — `--boja-fokus`, na beloj strani
- `solid 2px rgb(242,169,59)` — `--boja-fokus-traka`, u podnožju

Tri veze su nosile samo **podrazumevani okvir pregledača** (`auto 1px`), koji
se razlikuje od ostatka sajta — „Sve galerije →", „Sve kategorije →" i veza
reklame. `z-veza-meni` pod fokusom samo podvlači, a podvlačenje je isto što i
na hover, pa korisniku tastature to nije znak. → Dodat `z-fokus` na oba mesta
u `_naslovnaA.scss`.

### Escape

| Šta | Kako je provereno | Rezultat |
|---|---|---|
| Prozor sa cenama (`/galerija/…`) | otvoren klikom, pritisnut Escape | zatvara se; `body.modal-open` se skida |
| Panel u zaglavlju („Kategorije") | otvoren, pritisnut Escape | zatvara se |
| Fioka na telefonu | isti čuvar (`naTaster` u `header.js`, uslov `meniOtvoren \|\| panel`) | pokriveno |
| Napredna pretraga | `detailSearchForm.js:343` | pokriveno |
| Predlozi u pretrazi | `pretragaSaPrijedlozima.js:79` | pokriveno |

**Napomena o mom prvom nalazu:** prvo sam zapisao da Escape *ne* zatvara prozor
sa cenama. To je bilo pogrešno — pritisak nije stizao do strane jer je fokus
posle poziva skripte bio van nje. Kad se prvo klikne u prozor, Escape ga
zatvara. `backdrop="static"` gasi Escape u samom reactstrap-u, ali strana ima
svoj čuvar (`naTasterProzora`) koji to pokriva.

---

## 4. Preliv na 320 / 375 / 768 / 1024 / 1440

**Nigde nema vodoravnog preliva.** 20 strana × 5 širina = 100 merenja, sve nula.
Mera je `documentElement.scrollWidth - clientWidth`; traka koja se namerno
prevlači (`overflow-x: auto`) se ne računa.

Naslovna je posebno provrena pod sve tri teme — A, B i C — na svih 5 širina:
preliv 0 svuda.

---

## 5. Mrtav CSS

### `_global.scss`: 4.225 → 3.282 reda (943 obrisano)

Iz 174 klase u fajlu, 37 nije imalo nijednu referencu. Šest sam **zadržao** jer
ih ispisuju biblioteke, ne naš kod: `dropdown-toggle` i `overlay` (reactstrap),
`dropright` i `links` (bootstrap), `checks`, `react-autosuggest__container`.

Preostalih 31 je provereno pretragom po **celom repou** (bez `node_modules`) —
nula pogodaka. Skoro sve je ostatak **starog zaglavlja i podnožja**, koje je
redizajn zamenio:

`.mobile-menu-wrap` (183 reda), `.section-newsletter` (131), `.hamburger-animation`
(43), `.mobile-actions` (43), `.desktop-search` ×2 (74), `.header-top` (71),
`.submenu` (66), `.categories-tree` (58), `.f-col-1/2/3` (103), `.article-col`,
`.header-page-title`, `.error-404`, `.download-button`, `.list-articles`,
`.full-image` ×5, `.white-logo`, `.hide-header`, `.scroll-header`,
`.mobile-visible`, `.hide-on-mobile`, `.nav-category`, `.mobile-menu-open`.

Nisam ga refaktorisao — samo sam obrisao blokove. Balans zagrada je provrenen
(497/497) i gradnja prolazi.

### Mrtav fajl i mrtav `@import`

`scss/_page.scss` (87 redova) — sve četiri njegove klase (`page-wrap`,
`content-section`, `left-anim`, `right-anim`) imaju **nula referenci u celom
repou**. Sadržajne strane su odavno prešle na `_stranice.scss`. Fajl je obrisan
i njegov `@import` uklonjen iz `App.scss`.

### Mrtvo pravilo u `_naslovnaA.scss`

`header .navigation ul.meni-a` (21 red) — služilo je staroj varijanti zaglavlja
za predlog A, koje više nema jer je zaglavlje jedno. Bilo je već zapisano kao
mrtvo u `docs/provera-zaglavlja.md`; sad je obrisano.

**Ukupno obrisano: 1.030 redova + 1 fajl + 1 `@import`.**

---

## 6. Dve zapisane sitnice

### Dugme za pauzu (WCAG 2.2.2)

`components/traka.js` sad crta vidljivo dugme ispod trake, uz desnu ivicu.
Iznad je već naslov odeljka sa vezom „Sve galerije →", pa bi druga kontrola u
istom redu bila gužva.

- Natpis se menja: **„Zaustavi pomjeranje" ↔ „Nastavi pomjeranje"**, uz
  `aria-pressed`. Oba natpisa dodata u `langs.json` (`ba` i `en`).
- **Pauza sa dugmeta je jača od hovera** — `pokreni()` odbija da krene dok je
  `pauzirano`, pa prelazak mišem ne poništava korisnikovu odluku.
- Pod `prefers-reduced-motion: reduce` dugme se **sakriva iz prikaza**, a ne
  izostavlja iz markupa — da se prikaz sa servera i prvi prikaz u pregledaču ne
  razlikuju (hidracija bi prijavila neslaganje).

Izmereno (tema C, svih 5 širina): dugme prisutno i vidljivo svuda. Klik →
`clearInterval`, `aria-pressed="true"`, natpis „Nastavi pomjeranje". Ponovni
klik → `clearInterval` + `setInterval 4500`, `aria-pressed="false"`. Ulaz i
izlaz miša dok traje pauza → **ne pokreće traku**.

### Virak sledeće kartice ispod 480px

Bilo `flex-basis: 100%` (nijedan nagoveštaj da traka ide dalje), sad
`calc(100% - 14px)`.

Izmereno: na **320px** kartica 276 / traka 290 → virak **14px**; na **375px**
kartica 331 / traka 345 → virak **14px**. U traženom opsegu 12–16px.

---

## Šta nisam mogao sam da proverim

1. **Strane naloga iza prijave.** `/account/profile`, `/account/downloads`,
   `/account/edit`, `/account/change-password`, `/account/verify` i cela
   administracija (`/account/*`) traže prijavu. Nemam nalog i ne unosim lozinke.
   **Nijedna od njih nije merena** — ni kontrast, ni preliv, ni fokus.
   Ako mi daš probni nalog (ili sesiju), prolazi se istom alatkom.
   Ovo je i najveća rupa u prolasku: ta strana ekrana nosi
   `_account.scss` (2.215 redova), gde je i najviše zatečenih boja (43 mesta).

2. **Kako traka izgleda dok se pomera.** Pregledač u ovom okruženju prijavljuje
   `document.visibilityState === "hidden"` i ne da se izneti u prvi plan.
   Komponenta ispravno staje dok je kartica u pozadini, pa se **samo pomeranje
   nije moglo videti uživo** — proveren je mehanizam (tajmeri se pale i gase
   kako treba), ne i utisak. Pogledaj to okom.

3. **`prefers-reduced-motion`.** Pravilo koje sakriva dugme za pauzu je
   napisano, ali ga nisam mogao izvršiti — sistemska postavka se iz pregledača
   ne menja. Provera: uključi „Smanji kretanje" u macOS-u i osveži naslovnu pod
   predlogom C — traka treba da miruje i dugme da nestane.

4. **Kako mere izgledaju oku.** Devet veličina slova u administraciji se
   pomerilo (tabela u odeljku 1). Brojke su tačne, ali da li `h1` od 24px
   umesto 28px izgleda dobro na `/account/archive-stats` i `/account/watermarks`
   — to je sud, ne merenje.

5. **Tekst preko fotografije.** Merač namerno preskače svaki element kome je
   iza leđa slika ili preliv, jer se kontrast prema fotografiji ne može
   izračunati — zavisi od kadra. Natpisi preko snimaka (`predlogA .preko`,
   `.z-kartica-galerije__naslov` u traci) **nisu izmereni**. Zastori su
   pojačani gde je bilo mereno (odeljak 2d), ali svetao kadar treba pogledati.

6. **Prava tabela cena i korpa sa sadržajem.** `/cart` je meren **prazan**, a
   prozor sa cenama sa jednom galerijom. Redovi sa mnogo stavki, dugim nazivima
   i velikim brojevima nisu videni.

7. **Štampa.** `_print.scss` nije proveren — ni jedna strana nije poslata u
   pregled štampe.

8. **Blog.** `/blog` i `/blog/:alias` su preskočeni, po `CLAUDE.md` („ne
   dirati").

### Jedna napomena o merenju

Dva puta se javio nalaz koji je posle nestao: veza sa Bootstrap-plavom
(`rgb(0,123,255)`) na `/galerija/…/:photo`. Na **slegnutoj** strani je nula
takvih veza. To znači da tokom hidracije postoji kratak prozor (ispod ~1s) u
kome neke veze nose Bootstrap-ovu boju pre nego što se stil slegne. Nije kvar
u izgledu, ali jeste nešto što se na sporoj vezi može videti na trenutak.

---

# Dopuna — iza prijave (2026-08-27)

Ovo je bila najveća rupa prvog prolaska: nijedna strana koja traži prijavu nije
bila merena. Sada jeste.

## Probni nalozi

Napravljena su **dva** naloga, da se profil vidi i bez administratorskog
pregleda:

| Uloga | Adresa | Lozinka |
|---|---|---|
| administrator (`permissions: ['*']`) | `proba.admin@zipa-test.invalid` | `Zipa-Proba7!` |
| običan kupac (`physicalPerson`) | `proba.kupac@zipa-test.invalid` | `Zipa-Proba7!` |

Prijava: `http://localhost:10016/login`

**Baza NIJE lokalna.** `DATABASE_URL` gleda u `aws-0-eu-west-1.pooler.supabase.com`,
u istu bazu u kojoj stoji 125 stvarnih korisnika. Nalozi su zato napravljeni sa
adresama na `.invalid` (rezervisan domen — na njega se ne može poslati pošta) i
kroz upis koji **ne šalje nijednu poruku e-poštom**; redovni `register()` bi
poslao potvrdu i napravio nalog koji čeka odobrenje.

Brisanje kad završiš:

```bash
cd zipa24062026/api && node napravi-admina.js --obrisi
```

Skripta briše samo nalog sa punim pravima, pa **kupca treba obrisati ručno**
(iz administracije, *Korisnici*). Korpa kupca je namerno ostavljena puna sa
4 stavke, da imaš šta da vidiš.

## Šta je nađeno i popravljeno

### 1. Meni naloga u zaglavlju — belo na svetlom, na SVAKOJ strani naloga

Najteži nalaz ove dopune. Izmereno pod temom „a":

| Šta | Kontrast |
|---|---|
| „Preuzimanja", „Pretplata" | **1,08:1** |
| dugme „Profil" (`btn-secondary`) | **1,08:1** |
| stavke padajuće liste | **belo na belom** |

Uzrok: `/account/*` ispod nova dva reda zaglavlja crta i **zatečeni** red
(`.navigation > ul`, klase `account-nav` / `admin-nav`), koji ima svoju
**svetlu** podlogu `#F4F6FA` iz `_global.scss`. `.z-zaglavlje` preusmerava
`--boja-tekst` na `--boja-traka-tekst` (belu) jer je traka tamna, a to je
nasleđivanjem stiglo i u taj svetli red.

→ Popravljeno kao i belo polje pretrage u tamnoj traci: u opsegu tog reda se
`--boja-tekst`, `--boja-tekst-tiho`, `--boja-veza`, `--boja-povrsina` i
`--boja-fokus` vraćaju na `--boja-polje-tekst*`, koje se nikad ne preusmerava.
Jedno pravilo, sve tri stavke.

### 2. Preliv na stranama naloga — 175px na 375, 230px na 320

Jedine strane na sajtu koje su se prelivale.

**375px — bočni meni naloga.** `.z-nalog__raspored` je imao **golo `1fr`** —
tačno zamka iz `CLAUDE.md`. Red stavki menija je na telefonu vodoravan sa
`nowrap` stavkama, pa mu je `min-content` 535px; stubac se razvukao na 535 u
okviru od 290. Da `__stavke` ima `overflow-x: auto` **nije pomoglo** — granicu
postavlja sam stubac, ne dete.
→ `minmax(0, 1fr)` na oba mesta + `min-width: 0` na meniju.

**320px — desna strana zaglavlja.** Sklanjanje u fioku važi samo pod
`--sa-fiokom`, a strane naloga nemaju javni meni pa nemaju ni fioku — ništa se
nije sklanjalo. Traženo 344px kod raspoloživih ~290:

```
POMOĆ 47 · jezici 56 · korpa 40 · dugme naloga 177
```

→ Bez fioke desna strana sme da se **prelomi u drugi red** (`flex-wrap: wrap`
uz `flex: 1 1 auto`), a ime na dugmetu se skraćuje na 11ch sa tri tačke. Puno
ime i adresa ionako stoje u bočnom meniju same strane.

**44px na `/account/edit`** — zatečeni birač slike (`.image-picker`) nosi go
`input[type=file]` sa urođenom širinom ~349px.
→ `max-width: 100%` na biraču i na unosu.

> **Greška koju sam napravio usput:** prvo sam na birač stavio i `min-width: 0`.
> To je poništilo njegov `min-width: 128px` iz `_account.scss` i **ceo birač se
> skupio na nulu** — nestao je sa strane. Uhvaćeno merenjem, vraćeno; sada stoji
> samo gornja granica. Vredi zapisati: na zatečenim komponentama `min-width: 0`
> ume da obori donju meru na koju se neko drugi oslanja.

### 3. Fokus

Tri veze zatečenog menija naloga („Početna", „Preuzimanja", „Pretplata") bile
su bez ijednog pravila za fokus — nosile su samo podrazumevani okvir
pregledača. → `z-fokus` u istom pravilu iz tačke 1.

### 4. `_account.scss` — 51 zakucana boja prebačena na tokene

| Bilo | Postalo | Puta |
|---|---|---|
| `#EDEFF5`, `#EEF1F6`, `#EBEEF5`, `#DEDEDE`, `#DDDDDD`, `#CCD4E1` | `--boja-linija` | 26 |
| `#9DA5BE`, `#7c828f`, `#545a6b` | `--boja-tekst-tiho` | 9 |
| `#F5F5F5` | `--boja-podloga-tiha` | 2 |
| `#FFFFFF` | `--boja-povrsina` | 1 |
| `#4ACB6C`, `#369C2F` | `--boja-uspeh` | 2 |
| `#3C59B9`, `#2f3fb5` | `--boja-akcenat` | 2 |
| `#5C3784` (kvačica i ivica polja za potvrdu) | `--boja-tekst` | 6 |
| `#5C3784` (podloga trake napretka) | `--boja-podloga-tiha` | 1 |
| `#CE8FFF` (ispuna trake napretka) | `--boja-akcenat` | 3 |

`#EDEFF5` → `--boja-linija` je pod temom „trenutni" **ista vrednost**, pa se
zatečeni izgled tamo nije pomerio ni za nijansu.

**Jedno mesto je namerno ostavljeno:** `*[stroke="#6d7587"]` na liniji 304 nije
zakucana boja nego **poređenje vrednosti atributa** u ubačenom SVG-u. Dodat je
komentar da se ne „popravi" greškom.

### 5. Belo na amberu — 15 mesta u administraciji

Ovo je **starije od moje izmene**: most u `_settings.scss` je još 22. avgusta
preusmerio `$blue` i `$darkBlue` na `--boja-akcenat`, a to je amber. Belo na
amberu daje **2:1**. Pogađa dugmad „PRETRAŽI", „Spremi", „Izaberi PNG i
sačuvaj", oznaku „uključen" i aktivnu stranicu u podeli na strane.

→ Svih 15 mesta prebačeno na `--boja-tekst-na-akcentu` (6,87:1 uz amber). Pod
temom „trenutni" ta boja je i dalje **bela uz plavu**, pa se zatečeni izgled ne
menja.

### 6. Tabele administracije se nisu prevlačile

`/account/users` je na 320px prelazilo **388px**, `/account/categories` 199px —
tabele imaju stubaca koliko i podataka i ne prelamaju se.
→ `overflow-x: auto` na `.table` ispod 1024px, isto kao `.tabela-okvir` na
pregledu arhive.

## Izmereno posle popravki

**Strane kupca** (tema „a" i „trenutni", 5 širina):

| Strana | Tekst | Ivice | Fokus | Preliv |
|---|---|---|---|---|
| `/account/profile` | 0 | 0 | 0 | 0 |
| `/account/downloads` | 0 | 0 | 0 | 0 |
| `/account/edit` | 0 | 0 | 0 | 0 |
| `/account/change-password` | 0 | 0 | 0 | 0 |
| `/account/subscription` | 0 | 0 | 0 | 0 |
| `/cart` (4 stavke) | 0 | 0 | 0 | 0 |

**Administracija** (tema „a", 5 širina):

| Strana | Tekst | Ivice | Preliv |
|---|---|---|---|
| `/account/profile` (admin) | 0 | 0 | 0 |
| `/account/galleries` | 0 | 0 | 0 |
| `/account/users` | 0 | 0 | 0 |
| `/account/categories` | 0 | 0 | 0 |
| `/account/settings` | 0 | 0 | 0 |
| `/account/watermarks` | 0 | 0 | 0 |
| `/account/archive-stats` | 0 | 0 | 0 |
| `/account/announcements` | 0 | 0 | 0 |

## Nalaz koji NISAM popravio — `/cart` pukne od jednog lošeg reda

Dok sam punio korpu, poslao sam `/cart/add/:id/:photo/web` (izmišljena
rezolucija — prave su `800`, `1500`, `3000`).

- API je to primio **bez greške**: `{"error":null}`.
- `/cart` se posle toga uopšte nije iscrtao — **prazna bela strana**, sa
  `TypeError: Cannot read properties of null (reading 'formatPrice')`.

Jedan red sa nepoznatom rezolucijom, dakle, obori celu korpu. Nije zakrpljeno
jer je to logika, a dogovor je da se menja samo izgled — ali vredi popraviti na
dva mesta:

- `views/cart/cartPage.js:353` — `${(s.price).formatPrice(2)}` bez provere.
  Red bez cene treba preskočiti ili prikazati kao neispravan, ne oboriti stranu.
- ruta `/cart/add/:galleryId/:photoId/:resolution` — treba da odbije rezoluciju
  koja nije `800`, `1500` ili `3000`.

Sa ispravnim rezolucijama korpa radi bez ijedne primedbe (tabela gore).

## Šta ni sada nije provereno

1. **Administracija ima 47 ekrana; izmereno je 8.** Uzeti su oni koje `_account.scss`
   najviše oblači i koji imaju tabele, obrasce i statistiku. Preostali (statistike
   po fotografima, dnevne posete, uvoz, baneri, slajder, FAQ, newsletter…) nisu
   otvarani.
2. **Ekrani koji traže sadržaj kojeg nema** — postavljanje galerije
   (`changeGallery.js`) nije mereno sa pravim otpremanjem fotografija, a
   `/account/preview/:id` nije otvaran.
3. **Naplata do kraja.** Korpa je merena puna, ali **`/checkout` nije otvaran** i
   nijedno plaćanje nije pokretano. PayPal je i dalje u probnom režimu.
4. **Uloge `photographer`, `agency`, `legalPerson`.** Meren je samo kupac
   (`physicalPerson`) i administrator. Fotograf ima svoj meni i svoje ekrane
   (`photographer-nav`), koji nisu videni.
5. **Tema „trenutni" u administraciji.** Strane kupca jesu merene i pod njom;
   admin ekrani samo pod „a".
