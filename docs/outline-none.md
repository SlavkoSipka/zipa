# `outline: none` — spisak za kasnije

Nastalo pri pravljenju sistema tokena. **Ništa ovde nije promenjeno** — ovo je
samo popis, po dogovoru.

## Zašto je ovo problem

`outline: none` uklanja jedini znak koji pokazuje gde je fokus tastature.
Ko ne koristi miša — zbog povrede, čitača ekrana ili navike — ostaje bez
ikakvog pokazatelja gde se nalazi na strani. WCAG 2.4.7 (nivo AA) to izričito
traži.

Skoro sve ovde dolazi iz istog razloga: podrazumevani plavi okvir pregledača
ružno stoji, pa je uklonjen **bez zamene**. Ispravno je ukloniti podrazumevani
i staviti svoj — `:focus-visible` u `scss/_komponente.scss` upravo to radi, i
to je obrazac za prelazak.

## Obrazac za ispravku

```scss
// bilo
&:focus { outline: none; }

// treba
&:focus { outline: none; }                      // miš — bez okvira
&:focus-visible {                               // tastatura — okvir
    outline: 2px solid var(--boja-akcenat);
    outline-offset: 2px;
}
```

`:focus-visible` pregledač pali samo pri kretanju tastaturom, pa se okvir ne
vidi pri kliku mišem — što je i bio razlog zbog kog je uklonjen.

## Spisak — ukupno 103 mesta u 13 fajlova

### `_global.scss` — 32

| Red | Selektor |
|---|---|
| 21 | `button` |
| 24 | `&:focus` |
| 399 | `button` |
| 419 | `button` |
| 485 | `input` |
| 496 | `.search` |
| 529 | `input` |
| 540 | `.search` |
| 665 | `input` |
| 673 | `button` |
| 808 | `button` |
| 1005 | `input` |
| 1014 | `.btn1` |
| 1024 | `.btn2` |
| 1223 | `button` |
| 1814 | `.remove-button` |
| 1998 | `.button` |
| 2113 | `input` |
| 2125 | `button` |
| 2295 | `.close-button` |
| 2315 | `.checkout-button` |
| 2505 | `button` |
| 2561 | `.button` |
| 2621 | `&:focus` |
| 2683 | `button` |
| 2938 | `&:focus` |
| 3143 | `> input` |
| 3194 | `.button` |
| 3319 | `> input` |
| 3370 | `.button` |
| 3539 | `> input` |
| 3805 | `.button` |

### `_account.scss` — 16

| Red | Selektor |
|---|---|
| 33 | `&:focus` |
| 288 | `button` |
| 323 | `button` |
| 571 | `button` |
| 612 | `&:focus` |
| 815 | `button` |
| 929 | `button` |
| 971 | `> button` |
| 1090 | `button` |
| 1166 | `.delete-button` |
| 1185 | `.update-button` |
| 1311 | `button` |
| 1363 | `input` |
| 1377 | `.button` |
| 1585 | `> input` |
| 2087 | `.button` |

### `_category.scss` — 11

| Red | Selektor |
|---|---|
| 76 | `input` |
| 90 | `.button` |
| 164 | `> input` |
| 261 | `button` |
| 488 | `.button` |
| 598 | `button` |
| 631 | `.filters-button` |
| 654 | `> button` |
| 702 | `button` |
| 777 | `button` |
| 949 | `button` |

### `_store.scss` — 9

| Red | Selektor |
|---|---|
| 62 | `.scroll-down` |
| 119 | `input` |
| 155 | `.button` |
| 438 | `&:focus` |
| 517 | `button` |
| 559 | `.button` |
| 593 | `&:focus` |
| 684 | `button` |
| 914 | `&:focus` |

### `_cart.scss` — 6

| Red | Selektor |
|---|---|
| 234 | `input, textarea` |
| 319 | `button` |
| 517 | `.checkout-button` |
| 591 | `button` |
| 724 | `button` |
| 793 | `button` |

### `_photographer.scss` — 6

| Red | Selektor |
|---|---|
| 82 | `input` |
| 96 | `.button` |
| 177 | `button` |
| 237 | `button` |
| 303 | `button` |
| 402 | `.close-button` |

### `_detail.scss` — 5

| Red | Selektor |
|---|---|
| 86 | `input` |
| 100 | `.button` |
| 203 | `button` |
| 408 | `button` |
| 550 | `.close-button` |

### `_home.scss` — 5

| Red | Selektor |
|---|---|
| 212 | `input` |
| 226 | `.button` |
| 313 | `.slick-arrow` |
| 440 | `.button` |
| 498 | `.button` |

### `_contact.scss` — 4

| Red | Selektor |
|---|---|
| 277 | `input` |
| 287 | `textarea` |
| 303 | `button` |
| 367 | `button` |

### `_photoModal.scss` — 3

| Red | Selektor |
|---|---|
| 220 | `&:focus` |
| 228 | `button` |
| 248 | `&:focus` |

### `_stores.scss` — 3

| Red | Selektor |
|---|---|
| 62 | `.scroll-down` |
| 122 | `input` |
| 158 | `.button` |

### `_login.scss` — 2

| Red | Selektor |
|---|---|
| 196 | `input` |
| 439 | `button` |

### `_naslovnaA.scss` — 1

| Red | Selektor |
|---|---|
| 432 | `input[type="text"]` |
