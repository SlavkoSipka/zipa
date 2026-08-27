# Galerije bez datuma snimanja

Provereno nad celom bazom: **9.965 galerija**, od toga **66 bez datuma**.

## Zašto ovaj spisak postoji

Kataloški broj se sastavlja iz datuma i poslednja četiri znaka `_id`.
Galerija bez datuma ga ne može dobiti. Dogovoreno je da se zamena ne
izmišlja — prazan kataloški broj je iskrena praznina, a izmišljen datum
je podatak koji se posle ne razlikuje od pravog.

## Nalaz — praznina je manja nego što je izgledalo

Svih 66 galerija ima **isti obrazac**:

| Provera | Rezultat |
|---|---|
| bez datuma | 66 |
| od toga **vidljivih na sajtu** (`isActive`) | **0** |
| od toga **sa ijednom fotografijom** | **0** |
| od toga bez kategorije | 66 |

Nijedna nije objavljena i nijedna nema nijednu fotografiju. To su
**napušteni nacrti** — galerija je otvorena u administraciji i nikad
dovršena. Ne pojavljuju se u pretrazi, ne pojavljuju se na spisku
galerija, ne mogu se kupiti.

**Posledica:** kataloškom broju zaista ne treba zamena. Nijedna galerija
koju posetilac može da vidi nije bez datuma, pa se prazan kataloški broj
nikad neće ni prikazati.

## Šta uraditi

Ništa hitno. Kad se nekad bude čistilo:

1. Više od pola spiska je sa jednog naloga (`borislav-zdrinja`, 39
   galerija) — verovatno probni unosi pri postavljanju sajta.
2. Nazivi poput `dasdsad` i `temp value` potvrđuju isto — od 66 njih,
   50 se zove upravo `temp value`.
3. Brisanje je bezbedno jer nijedna nema fotografije — ali to je odluka
   agencije, ne naša.

## Po fotografima

| Nalog | Broj |
|---|---|
| `borislav-zdrinja` | 39 |
| `slobodan-bobara-rasic` | 15 |
| `ranko-cukovic` | 4 |
| `aleksandar-golic` | 1 |
| `dragana-dusanic` | 1 |
| `dule-borkovic` | 1 |
| `nikolatadic` | 1 |
| `russell-gordon` | 1 |
| `sinisa-pasalic` | 1 |
| `stefanfoto` | 1 |
| `zipa-photo` | 1 |

## Ceo spisak

Na javnom sajtu ove galerije ne postoje — vide se samo u administraciji.

| # | Naziv | Fotograf | `_id` |
|---|---|---|---|
| 1 | temp value | `aleksandar-golic` | `5f3a5a035b4166097b4cf32a` |
| 2 | DAN REPUBLIKE SRPSKE - SVEČANI DEFILE | `borislav-zdrinja` | `5f452c9f7f90af6f3032b6cb` |
| 3 | DIVLJA KAMILICA | `borislav-zdrinja` | `5f36af444a6ed8364dd8f7e3` |
| 4 | DIVLJA KAMILICA | `borislav-zdrinja` | `5f36af534a6ed8364dd8f7e6` |
| 5 | KASTEL - RIJEKA VRBAS | `borislav-zdrinja` | `5f36af444a6ed8364dd8f7e2` |
| 6 | KASTEL - RIJEKA VRBAS | `borislav-zdrinja` | `5f36af444a6ed8364dd8f7e1` |
| 7 | Milorad Dodik i Jasmina Vujic | `borislav-zdrinja` | `5f369c7a4a6ed8364dd8f684` |
| 8 | temp value | `borislav-zdrinja` | `5f36c09b4a6ed8364dd8f922` |
| 9 | temp value | `borislav-zdrinja` | `5f36afc64a6ed8364dd8f7f1` |
| 10 | temp value | `borislav-zdrinja` | `5f36935b8e788927d4f79523` |
| 11 | temp value | `borislav-zdrinja` | `5f36935b8e788927d4f79524` |
| 12 | temp value | `borislav-zdrinja` | `5f36935b8e788927d4f79525` |
| 13 | temp value | `borislav-zdrinja` | `5f36935b8e788927d4f79526` |
| 14 | temp value | `borislav-zdrinja` | `5f3694e04a6ed8364dd8f607` |
| 15 | temp value | `borislav-zdrinja` | `5f3694e04a6ed8364dd8f608` |
| 16 | temp value | `borislav-zdrinja` | `5f36937f8e788927d4f7952b` |
| 17 | temp value | `borislav-zdrinja` | `5f36a15e4a6ed8364dd8f6d7` |
| 18 | temp value | `borislav-zdrinja` | `5f36b2344a6ed8364dd8f818` |
| 19 | temp value | `borislav-zdrinja` | `5f36a8f14a6ed8364dd8f75a` |
| 20 | temp value | `borislav-zdrinja` | `5f36ae964a6ed8364dd8f7cf` |
| 21 | temp value | `borislav-zdrinja` | `5f36937f8e788927d4f79528` |
| 22 | temp value | `borislav-zdrinja` | `5f3694c84a6ed8364dd8f603` |
| 23 | temp value | `borislav-zdrinja` | `5f369c794a6ed8364dd8f680` |
| 24 | temp value | `borislav-zdrinja` | `5f36a72d4a6ed8364dd8f731` |
| 25 | temp value | `borislav-zdrinja` | `5f36b6784a6ed8364dd8f84f` |
| 26 | temp value | `borislav-zdrinja` | `5f452cd47f90af6f3032b6cf` |
| 27 | temp value | `borislav-zdrinja` | `5f36c0fd4a6ed8364dd8f92c` |
| 28 | temp value | `borislav-zdrinja` | `5f36937f8e788927d4f79529` |
| 29 | temp value | `borislav-zdrinja` | `5f36937f8e788927d4f7952a` |
| 30 | temp value | `borislav-zdrinja` | `5f36a15e4a6ed8364dd8f6d5` |
| 31 | temp value | `borislav-zdrinja` | `5f36a15e4a6ed8364dd8f6d6` |
| 32 | temp value | `borislav-zdrinja` | `5f36a1ca4a6ed8364dd8f6dd` |
| 33 | temp value | `borislav-zdrinja` | `5f36a2784a6ed8364dd8f6e9` |
| 34 | temp value | `borislav-zdrinja` | `5f3694c74a6ed8364dd8f602` |
| 35 | temp value | `borislav-zdrinja` | `5f36a8f14a6ed8364dd8f759` |
| 36 | temp value | `borislav-zdrinja` | `5f36a1ca4a6ed8364dd8f6de` |
| 37 | temp value | `borislav-zdrinja` | `5f36a1ca4a6ed8364dd8f6df` |
| 38 | test | `borislav-zdrinja` | `5f4529227f90af6f3032b68d` |
| 39 | test arhiva | `borislav-zdrinja` | `5f369c794a6ed8364dd8f682` |
| 40 | test arhiva | `borislav-zdrinja` | `5f369c794a6ed8364dd8f681` |
| 41 | temp value | `dragana-dusanic` | `5f36c6194a6ed8364dd8f9a9` |
| 42 | Patrijarh Vartolomej i patrijarh Irinej služili liturgiju u Jasenovcu | `dule-borkovic` | `5f43cfbec02fa644bb5eec86` |
| 43 | temp value | `nikolatadic` | `5f36a81f4a6ed8364dd8f744` |
| 44 | Skup podrške u Banja Luci | `ranko-cukovic` | `5f3699754a6ed8364dd8f65d` |
| 45 | temp value | `ranko-cukovic` | `5f369cdb4a6ed8364dd8f693` |
| 46 | temp value | `ranko-cukovic` | `5f3699754a6ed8364dd8f65c` |
| 47 | temp value | `ranko-cukovic` | `5f3699754a6ed8364dd8f65e` |
| 48 | Russell Gordon | `russell-gordon` | `5f453d277f90af6f3032b7b4` |
| 49 | temp value | `sinisa-pasalic` | `5f369e7e4a6ed8364dd8f6a9` |
| 50 | dasdsad | `slobodan-bobara-rasic` | `5f4531f77f90af6f3032b72d` |
| 51 | srthe | `slobodan-bobara-rasic` | `5f452c9f7f90af6f3032b6ca` |
| 52 | srthe | `slobodan-bobara-rasic` | `5f452c9f7f90af6f3032b6c9` |
| 53 | temp value | `slobodan-bobara-rasic` | `5f36a2fc4a6ed8364dd8f6f7` |
| 54 | temp value | `slobodan-bobara-rasic` | `5f36aa4b4a6ed8364dd8f775` |
| 55 | temp value | `slobodan-bobara-rasic` | `5f4531f77f90af6f3032b72a` |
| 56 | temp value | `slobodan-bobara-rasic` | `5f4531f77f90af6f3032b72b` |
| 57 | temp value | `slobodan-bobara-rasic` | `5f4531f77f90af6f3032b72c` |
| 58 | temp value | `slobodan-bobara-rasic` | `5f4531f67f90af6f3032b723` |
| 59 | temp value | `slobodan-bobara-rasic` | `5f4531f67f90af6f3032b724` |
| 60 | temp value | `slobodan-bobara-rasic` | `5f4531f77f90af6f3032b725` |
| 61 | temp value | `slobodan-bobara-rasic` | `5f4531f77f90af6f3032b726` |
| 62 | temp value | `slobodan-bobara-rasic` | `5f4531f77f90af6f3032b727` |
| 63 | temp value | `slobodan-bobara-rasic` | `5f4531f77f90af6f3032b728` |
| 64 | temp value | `slobodan-bobara-rasic` | `5f4531f77f90af6f3032b729` |
| 65 | Prvi sneg 2016. godine u Beogradu | `stefanfoto` | `5f43e29cc02fa644bb5eed8f` |
| 66 | temp value | `zipa-photo` | `5f4557587f90af6f3032b963` |

Spisak se ponovo pravi sa `node zipa24062026/api/preuzmi-bez-datuma.js`.
