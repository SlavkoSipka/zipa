# Funkcionalni test administracije — 2026-08-27

Ekrani za unos sadržaja. **Ovo nije redizajn** — izgled nije menjan, ovde su
samo nalazi. Ništa nije popravljeno *u tom prolazu*.

> **Dopuna 2026-08-28.** U posebnom prolazu su popravljeni **Z-6, Z-7, W-1,
> W-3 i B-2**, i delimično **Z-8**. Nalazi ispod stoje nepromenjeni, kao zapis
> zatečenog stanja. Ono što je ostalo i traži dogovor sabrano je u
> [`ceka-odluku.md`](ceka-odluku.md).

## Kako je testirano i šta je ostalo za sobom

Baza je živa i produkcijska, pa su pravila poštovana doslovno:

- Napravljeni su zapisi sa prefiksom **`PROBA-`** i svi su obrisani na kraju.
  Provereno brojanjem pre i posle: baneri 11→11, najave 1→1, slajdovi 2→2,
  FAQ 59→59, FAQ kategorije 11→11, newsletteri 5→5, pretplatnici 62→62.
  Pretraga po `PROBA` po svim zbirkama vraća **0**. Folder `api/uploads`
  je opet na 618 fajlova.
- **Nijedno dugme za slanje nije pritisnuto** — ni „POŠALJI NEWSLETTER" ni
  „POŠALJI TEST". Njihovo ponašanje je utvrđeno iz koda.
- Nijedan postojeći zapis nije menjan ni brisan.
- Brisanje sopstvenih probnih zapisa rađeno je direktno u bazi, jer za baner
  brisanja uopšte nema (vidi B-2).

### Šta NIJE testirano i zašto

| Šta | Zašto |
|---|---|
| Slanje newslettera i probno slanje | Nepovratno. Ide na 62 stvarne adrese, odnosno na tri zakucane adrese. |
| Čuvanje FAQ pitanja i FAQ kategorije | Nemaju **nijedno** polje za skrivanje ni datum prikazivanja — svaki sačuvan zapis odmah izlazi na `/help`. Po pravilu „ako ne može nevidljivo, ne pravi ga" — obrazac je testiran do slanja, ali nije sačuvan. |
| Brisanje postojećih zapisa | Nepovratno, tuđi podaci. |
| Prazan spisak (provera 1) | Nijedan spisak u produkciji nije prazan, a nije dozvoljeno prazniti ih. Nalaz **Z-1** je utvrđen iz koda, nije viđen uživo. |

---

## Zbirni pregled

| Težina | Broj |
|---|---|
| Obara stranu | 3 |
| Gubi podatke | 4 |
| Zbunjuje korisnika | 9 |
| Kozmetika | 5 |
| **Ukupno** | **21** |

---

## Z — nalazi zajednički za sve ekrane

### Z-1 · Prazan spisak ispisuje „0" umesto poruke · *zbunjuje korisnika*

**Korak:** otvoriti bilo koji spisak kad u njemu nema nijednog zapisa.
**Očekivano:** prazna tabela ili poruka „Nema zapisa".
**Dešava se:** u tabeli se ispiše znak **`0`**.

Uzrok je isti obrazac u svih šest spiskova, npr.
[bannersPage.js:107](zipa24062026/site/src/views/account/bannersPage.js:107):

```js
this.state.items && this.state.items.length && this.state.items.map(...)
```

Kad je niz prazan, `[].length` je `0`, izraz vraća `0`, a React broj `0`
iscrtava kao tekst. Isto stoji u `announcementsPage.js`, `slidesPage.js`,
`faqsPage.js`, `faqCategoriesPage.js` i `newslettersPage.js`, svaki na liniji
107 ili 114.

> Utvrđeno čitanjem koda; nije viđeno uživo jer nijedan spisak nije prazan.

### Z-2 · Nijedna kvačica u administraciji nije pravo polje · *zbunjuje korisnika*

**Korak:** pokušati Tab-om doći do „Skriveno", „Lijevi fiksni", „Vidljiva"…
**Očekivano:** kvačica se dobija fokus i menja razmaknicom.
**Dešava se:** ne može se doći tastaturom uopšte — samo mišem.

[fields/check.js:16](zipa24062026/site/src/components/forms/fields/check.js:16)
je `<div onClick>` bez `<input>`, bez `role`, bez `tabIndex` i bez obrade
tastature. Izmereno na `/account/banners/new`: obrazac ima **9 kvačica**, a u
celoj formi postoje **samo 3 prava polja** (dva teksta i jedan fajl).

Pogađa svaki obrazac koji koristi `Check`: baneri (9), kategorije (5).
Čitač ekrana ne vidi ni stanje ni ulogu.

### Z-3 · Greška u obrascu je samo crvena boja, bez ijedne reči · *zbunjuje korisnika*

**Korak:** `/account/banners/new` → „Spremi bannere" sa praznim poljima.
**Očekivano:** poruka koja kaže šta nedostaje.
**Dešava se:** natpis „Naziv \*" pređe u crvenu (`rgb(214, 0, 6)`), i to je
sve. Nema teksta, nema skoka na polje, ništa se ne najavljuje čitaču ekrana.
Pretraga po `obavez|required|unesite|greš` u celom obrascu ne nalazi ništa.

Boja kao jedini nosilac informacije pada i na WCAG 1.4.1.

### Z-4 · Nepostojeća adresa pod `/account/` daje belu stranu · *zbunjuje korisnika*

**Korak:** otvoriti `/account/newsletters` (spisak je zapravo na
`/account/newsletter`) ili bilo koju izmišljenu adresu, npr.
`/account/nepostojeca-strana`.
**Očekivano:** strana 404.
**Dešava se:** potpuno **prazna bela strana**, naslov u kartici `- ZIPA PHOTO`.
`document.body.innerText` je prazan string.

Adresa `/account/newsletters` iz zadatka **ne postoji** — u
[routesList.js:898](zipa24062026/site/src/routesList.js:898) stoje samo
`/account/newsletter` i `/account/newsletter/:id`.

### Z-5 · Naslov kartice pregledača je pogrešan na više ekrana · *kozmetika*

| Adresa | Naslov u kartici | Trebalo bi |
|---|---|---|
| `/account/banners` | „Kategorije" | Banneri |
| `/account/announcements` | „Stranice" | Najave |

Dolazi iz `generateSeoTags` u `routesList.js`, gde je naslov prekopiran sa
susedne rute.

### Z-6 · Postavljanje fajla nema nijednu proveru — ni vrste, ni veličine, ni prava · *obara stranu*

Ovo je najozbiljniji nalaz prolaska.

**Korak (izmereno):**

```
POST /upload  sa .txt fajlom, tokenom OBIČNOG KUPCA  →  HTTP 200
POST /upload  sa 3 MB binarnim fajlom, admin         →  HTTP 200
POST /upload  bez prijave                            →  HTTP 401
```

Vraćena adresa je javna (`/uploads/<uuid>.txt`) i servira se sa
`Content-Type: text/plain`.

Tri odvojena uzroka:

1. **Bilo ko prijavljen sme da postavlja.**
   [users/auth.js:47](zipa24062026/api/users/auth.js:47) — `if (!permission) return next();`,
   a ruta je `app.post('/upload', permissionMiddleware(), ...)` **bez** imena
   prava. Znači i običan kupac (`physicalPerson`), ne samo administrator.
2. **Nema provere vrste fajla.** `Dropzone` u
   [fields/banners.js:249](zipa24062026/site/src/components/forms/fields/banners.js:249)
   nema ni `accept` ni `maxSize`; na serveru
   [admin.js:1590](zipa24062026/api/admin/admin.js:1590) uzima ekstenziju iz
   imena fajla i snima je kakva jeste — uz **izričit izuzetak za `.svg`**.
   `express.static('uploads')` je zatim servira sa pripadajućim tipom. SVG i
   HTML mogu da nose skriptu, pa je ovo trajni XSS na domenu API-ja.
3. **Nema granice veličine.** `app.use(fileUpload())`
   ([app.js:117](zipa24062026/api/app.js:117)) je bez `limits`, što je kod
   `express-fileupload` neograničeno.

### Z-7 · Dvostruki odgovor pri grešci u snimanju fajla · *obara stranu*

[admin.js:1603](zipa24062026/api/admin/admin.js:1603):

```js
file.mv('./uploads/' + filename, (err) => {
    if (err) {
        res.status(500).send('Error');     // nema `return`
    }
    res.status(200).send(`${API_ENDPOINT}/uploads/` + filename);
});
```

Ako `mv` ne uspe (pun disk, prava), šalju se **dva** odgovora — drugi baca
`ERR_HTTP_HEADERS_SENT`, što u Expressu ruši obradu zahteva. Nije izazvano
namerno (traži simulaciju otkaza diska), ali je greška očigledna iz koda.

### Z-8 · Otkazivanje usred postavljanja nije obrađeno · *gubi podatke*

`onDrop` u [fields/banners.js:112](zipa24062026/site/src/components/forms/fields/banners.js:112)
nema `.catch`. Ako se poziv prekine, ne prijavljuje se ništa i polje ostaje
prazno bez ijednog znaka. Gore: prvi red posle odgovora je
`this.props.onChange(img)` — **sirov tekst odgovora** se upisuje u vrednost
polja pre nego što se napravi niz. Ako server vrati poruku o grešci umesto
adrese, ta poruka postaje vrednost polja i tako se i sačuva.

---

## /account/banners i /account/banners/new

### B-1 · Spisak i obrazac se iscrtavaju · *ispravno*

11 banera, kolone „Naziv / Pozicija / Akcije". Obrazac se otvara, čuva i
vraća na spisak. Napravljen `PROBA-baner` sa uključenim „Skriveno" —
u bazi `hidden: true`, i klijent ga filtrira na svim mestima
([App.js:381](zipa24062026/site/src/App.js:381) i dalje), pa nije bio vidljiv.

### B-2 · Dugme za brisanje vodi na naslovnu i ništa ne briše · *zbunjuje korisnika*

**Korak:** `/account/banners` → ikona kante u redu banera.
**Očekivano:** brisanje, ili bar pitanje.
**Dešava se:** administrator je izbačen na **javnu naslovnu stranu** (`/`),
baner je i dalje tu.

[bannersPage.js:115](zipa24062026/site/src/views/account/bannersPage.js:115):

```jsx
<Link to='/'><button><Isvg src={trashIcon} /></button></Link>
```

Izmereno uživo na sopstvenom baneru: `href` je `/`, adresa posle klika `/`.
Uz to, **rute za brisanje banera nema uopšte** — ni `deleteBanner` u
`admin.js` ni `/banners/delete/:id` u `app.js`. Baner se, jednom napravljen,
ne može ukloniti iz administracije.

### B-3 · „Pozicija \*" nosi zvezdicu ali se ne proverava · *zbunjuje korisnika*

**Korak:** poslati obrazac sa praznim „Naziv" i „Pozicija".
**Dešava se:** crveni postaje samo „Naziv". „Pozicija \*" prolazi prazna.
[bannerForm.js:277](zipa24062026/site/src/components/forms/bannerForm.js:277)
nema `validate={[required]}`, za razliku od polja `name`.

### B-4 · Baner se čuva bez ijedne slike · *zbunjuje korisnika*

`PROBA-baner` je sačuvan sa `images: null`. Ništa ne traži sliku i ništa ne
upozorava. Takav baner zauzima mesto u spisku a na sajtu ne crta ništa.

### B-5 · Dva mrtva polja · *zbunjuje korisnika*

Pretraga po celom sajtu (`views`, `components`, `containers`, `App.js`):

| Polje | U obrascu | Čita ga sajt |
|---|---|---|
| `size` — četiri dugmeta „Široki / Uspravni / Kvadratni / Za telefon" | da | **ne, nigde** |
| `mobileOnly` — „Samo na telefonu" | da | **ne, nigde** |

`size` je posebno varljiv jer je istaknut kao izbor sa četiri dugmeta i
izgleda kao da menja prikaz; on je samo podsetnik za pripremu fajla.
`name` se čita samo u administraciji.

### B-6 · Nema pretrage, sortiranja ni straničenja · *zbunjuje korisnika*

Spisak crta svih 11 odjednom. Provereno uživo: nema polja za pretragu, nema
`.pagination`, zaglavlja kolona nisu klikabilna. Isto važi za svih šest
spiskova u ovom testu.

---

## /account/announcements

### N-1 · Spisak ne pokazuje datume · *zbunjuje korisnika*

Kolone su samo **„Tekst"** i **„Akcije"**. Vidljivost najave zavisi isključivo
od `from` i `to`, a nijedan se ne vidi u spisku — mora se otvoriti svaka
najava da bi se znalo da li je aktivna. Postojeća jedina najava („test") ima
opseg 18.–21.08.2026, dakle prošao, ali to se iz spiska ne vidi.

### N-2 · Telo najave se u bazi kvari — kolona je pogrešnog tipa · *gubi podatke*

**Korak:** otvoriti najavu, upisati tekst u editor, sačuvati.
**Očekivano:** `text` kao objekat po jezicima, kao svuda drugde.
**Dešava se:** u bazi je **string koji sadrži JSON**.

Izmereno: obrazac šalje ispravno —

```json
{"title":…,"text":{"ba":"<p>PROBA-tekst …</p>"}}
```

a u bazi stoji `'{"ba":"<p>PROBA-tekst …</p>"}'` kao `str`, dužine 5055.

Uzrok je **tip kolone**, ne kod koji upisuje:

```
announcements.content  →  jsonb
announcements.text     →  text     ← ovde
```

Zato `Object.translate(data,'text',lang)` vraća prazno i telo se ne iscrtava
bez raspakivanja. `CLAUDE.md` ovo opisuje kao dug i pretpostavlja da je uzrok
u `announcementForm.js`; merenje pokazuje da je uzrok u šemi baze.
Provereno da isto **ne važi** za newsletter: on šalje `content` kao običan
string, pa je `newsletters.content → text` tamo ispravno.

### N-3 · Polje „Vrijeme" je pogrešno označeno · *zbunjuje korisnika*

Izgleda kao zasebno polje, a zapravo postavlja **samo sat na datumu DO**.
Izmereno: OD `01.01.2020`, DO `02.01.2020`, Vrijeme `12:30` daje
`from = 01.01.2020 00:00`, `to = 02.01.2020 12:30`. Natpis to ne kaže, a
sat na datumu OD se ne može podesiti uopšte.

### N-4 · Neobjavljena najava je javno čitljiva preko direktne adrese · *zbunjuje korisnika*

**Korak:** napraviti najavu sa datumima izvan današnjeg dana, otvoriti
`/najave/<id>` bez prijave.
**Dešava se:** strana se iscrta u celosti.

`/announcements` (javni spisak) filtrira po datumu
([admin.js:1388](zipa24062026/api/admin/admin.js:1388)), ali
`/announcements/get/:id` ([app.js:420](zipa24062026/api/app.js:420)) nema ni
proveru prava ni filter po datumu. Nije nigde povezano, pa u praksi nije
lako naći — ali nije ni zaštićeno.

### N-5 · Najava bez teksta se čuva bez pogovora · *kozmetika*

Sačuvana je najava sa `text: null`. Javna strana to lepo hvata i ispisuje
„Ova najava još nema teksta." — dakle ne puca, ali obrazac dozvoljava
prazan sadržaj bez upozorenja.

---

## /account/slides

### S-1 · Neispravna pozicija se tiho pretvara u prazno · *gubi podatke*

**Korak:** `/account/slides/new` → „Pozicija" = `abc` → Spremi.
**Očekivano:** poruka da pozicija mora biti broj.
**Dešava se:** obrazac šalje `"position":"abc"`, `parseInt` daje `NaN`, u bazi
ostaje **`null`**. Nikakve poruke nema, administrator ostaje ubeđen da je
poziciju postavio.

[admin.js:787](zipa24062026/api/admin/admin.js:787) —
`position: obj.position ? parseInt(obj.position) : 0`.

### S-2 · Slajd se čuva bez slike i pravi slomljenu sliku na naslovnoj · *zbunjuje korisnika*

Sačuvan slajd ima `image: null`. `homePage.js` ga crta bezuslovno
([homePage.js:202](zipa24062026/site/src/views/homePage.js:202)):

```jsx
<img src={item.image}/>
```

Bez `src` i **bez `alt`** — u vrtešci ostaje slomljena sličica. Slika nije
označena kao obavezna.

### S-3 · Slajdovi se vide samo pod izgledom „trenutni" · *zbunjuje korisnika*

Slajder čita jedino `views/homePage.js`, tj. zatečena naslovna. Predlozi A, B
i C ga ne crtaju. Trenutno je izabran **Predlog A**, pa ceo ekran „Slajder"
danas ne utiče ni na šta — a u administraciji ništa to ne govori.

*(Zbog toga je probni slajd bio nevidljiv posetiocima i tokom testa.)*

### S-4 · Natpisi obrasca nisu provučeni kroz rečnik · *kozmetika*

[slideForm.js:246](zipa24062026/site/src/components/forms/slideForm.js:246)
i `:255` imaju `label="Naslov *"` i `label="Tekst *"` kao goli tekst, bez
`.translate(lang)`. Ostali obrasci to rade. Na engleskom ostaju na srpskom.

---

## /account/faq

> Zapis nije sačuvan — FAQ nema polje za skrivanje, pa bi odmah izašao na
> `/help`. Testirano sve do slanja.

### F-1 · Izbor kategorije je prazna kutija od 40px · *zbunjuje korisnika*

**Korak:** `/account/faq/new` → pogledati polje „Kategorija".
**Očekivano:** spisak sa vidljivim izabranim nazivom.
**Dešava se:** prekidač je širok **40px**, prazan, a jedini tekst u njemu je
`Toggle Dropdown` u `sr-only` (i to na engleskom).

Nije `<select>` nego reactstrap `Dropdown`
([faqForm.js:268](zipa24062026/site/src/components/forms/faqForm.js:268)
kroz `fields/select.js`). Otvaranjem se dobije svih 11 kategorija i izbor
radi — posle izbora se naziv ispiše, ali kutija ostaje 40px, pa se dugačak
naziv ne uklapa. Pre izbora nema ni zamenskog teksta.

### F-2 · Provera obaveznih polja radi · *ispravno*

Prazan obrazac crveni i „Pitanje \*" i „Odgovor \*". Ostaje ograničenje iz
**Z-3** — bez teksta poruke.

### F-3 · Nema načina da se pitanje sakrije ili odloži · *zbunjuje korisnika*

`faq` zapis ima samo `question`/`answer`/`category`/`position`. Nema ni
zastavicu ni datum, a `/faq/all` je javan i `/help` ga crta bez filtera. Znači
svako sačuvano pitanje je **odmah javno** — nema nacrta.

---

## /account/faqCategories

> Iz istog razloga zapis nije sačuvan.

### K-1 · Obrazac je najjednostavniji i radi kako piše · *ispravno*

Polja „Naziv \*" i „Pozicija". Prazan obrazac crveni „Naziv \*". Alias se
pravi sam iz naziva ([admin.js:1005](zipa24062026/api/admin/admin.js:1005)).

### K-2 · Ni kategorije nemaju skrivanje · *zbunjuje korisnika*

Isto kao F-3: sačuvana kategorija odmah stoji na `/help`, prazna, dok joj se
ne dodaju pitanja.

---

## /account/newsletter

### W-1 · „POŠALJI NEWSLETTER" šalje na 62 adrese bez ijedne potvrde · *obara stranu*

**Najteži nalaz.**

**Korak:** `/account/newsletter` → dugme „POŠALJI NEWSLETTER" u redu.
**Očekivano:** pitanje „Da li ste sigurni?", kao kod brisanja.
**Dešava se:** poziv kreće **odmah, na prvi klik**.

[newslettersPage.js:138](zipa24062026/site/src/views/account/newslettersPage.js:138)
zove `/newsletter/send/:id` direktno. U istom redu, **dva dugmeta dalje**,
brisanje ide kroz `this.props.handleDelete(...)` — dakle potvrda u ovom
projektu postoji, ali je stavljena na povratnu radnju, a ne na nepovratnu.

Domet: `sendNewsletter` ([admin.js:1231](zipa24062026/api/admin/admin.js:1231))
uzima **sve** pretplatnike — danas **62 stvarne adrese**. Ne postoji provera
da je newsletter već poslat: status se samo prepiše u „Poslato", pa se isti
newsletter može poslati ponovo, i ponovo.

Dugme stoji odmah pored olovke za izmenu — promašaj od jednog reda.

> Nije pritisnuto. Utvrđeno čitanjem koda i brojanjem pretplatnika.

### W-2 · „POŠALJI TEST" šalje na tri zakucane adrese, među njima i privatnu · *zbunjuje korisnika*

[admin.js:1165](zipa24062026/api/admin/admin.js:1165):

```js
let emails = ['info@zipaphoto.net', 'zipaphoto@gmail.com', 'stanojevic.milan97@gmail.com'];
```

Treća je lična adresa programera, u izvornom kodu. Nema načina da se promeni
iz administracije.

### W-3 · Probno slanje označava newsletter kao „Poslato" · *gubi podatke*

[admin.js:1163](zipa24062026/api/admin/admin.js:1163) — `sendTestNewsletter`
takođe radi `$set: { status: 'Poslato' }`. Posle probe spisak tvrdi da je
newsletter poslat pretplatnicima, iako nije. Od pet postojećih newslettera
četiri su u stanju „Poslato" i **ne može se razaznati** koji su stvarno otišli
na listu, a koji su samo probani.

### W-4 · Obrazac se čuva i vraća na spisak · *ispravno*

`PROBA-newsletter` je napravljen sa naslovom i telom, dobio status
„Na čekanju", `image: null`, `galleries: null`. Slanje nije dirano. Zapis je
obrisan.

### W-5 · Spisak ne pokazuje ni datum ni primaoce · *zbunjuje korisnika*

Kolone su „Naslov / Status / Akcije". Nema kada je poslat, ni na koliko
adresa. Uz W-3 to znači da o slanju nema nikakvog traga osim reči „Poslato".

---

## Ispravka ranijeg nalaza

U prethodnom prolazu sam napisao da **nema dugmeta** koje vodi na
`/account/categories/new`. **To nije tačno** — provereno klikom: dugmad
„Dodaj" stoje u padajućim menijima administracije u zaglavlju
(`ul.account-nav > li > .dropdown`), po jedno za svaki odeljak:

```
Kategorije → Lista, Dodaj      Baneri  → Lista, Dodaj
Stranice   → Lista, Dodaj      Najave  → Lista, Dodaj
Slajder    → Lista, Dodaj      FAQ     → Dodaj kategoriju, Dodaj pitanje
Newsletter → Lista newslettera, Dodaj newsletter
```

Ono što stoji je da na **samim spiskovima** nema dugmeta „Dodaj" — dodavanje
je samo u meniju zaglavlja.
