# Čeka odluku — nalazi iz testa administracije

Nastavak na [`test-administracija.md`](test-administracija.md). Tamo su svi
nalazi; ovde su samo oni koji **nisu popravljeni jer traže dogovor** — zato što
menjaju šemu baze, menjaju kako se sadržaj objavljuje, ili traže podatak koji
mi nemamo.

Popravljeno 2026-08-28 i **nije** na ovom spisku: postavljanje fajla (Z-6, Z-7,
Z-8 delimično), potvrda i onemogućeno dugme na slanju newslettera (W-1),
probno slanje koje je lažno označavalo „Poslato" (W-3), i brisanje banera (B-2).

---

## 1. Migracija kolone `announcements.text` · *gubi podatke*

**Nalaz:** N-2. Telo najave se u bazi čuva kao **string koji sadrži JSON**
(`'{"ba":"<p>…</p>"}'`) umesto kao objekat po jezicima.

Obrazac šalje ispravno — izmereno, telo zahteva je
`{"text":{"ba":"<p>…</p>"}}`. Kvari se pri upisu, i uzrok **nije u kodu** nego
u tipu kolone:

```
announcements.content  →  jsonb     ✅
announcements.text     →  text      ← ovde
```

`db.js` je Mongo-oblik sloj nad Postgresom; kad naiđe na `text` kolonu, objekat
serijalizuje u string. `content` je `jsonb` i prolazi uredno.

**Posledica:** `Object.translate(data, 'text', lang)` vraća prazno, pa se telo
najave ne iscrtava. `views/annoucmentPage.js` to raspakuje **pri prikazu** —
zakrpa koja radi, ali svaki novi potrošač tog polja mora da je ponovi.

**Zašto nije popravljeno:** traži `ALTER TABLE` nad živom bazom i jednokratnu
migraciju postojećih zapisa. To je zahvat nad produkcijom i ide klijentu.

**Šta treba odlučiti:**

- Kada se sme raditi zahvat nad bazom (kratak prekid ili u niskom saobraćaju).
- Da li se migriraju svi zatečeni zapisi. Danas ih je **1**, pa je posao mali —
  ali `CLAUDE.md` upozorava da ih je bilo više, pa proveriti pred zahvat.

**Predlog koraka**, kad se odobri:

1. `ALTER TABLE announcements ALTER COLUMN text TYPE jsonb USING text::jsonb;`
   — postojeći zapisi su validan JSON, pa `USING` prolazi. Proveriti pre toga
   da nijedan `text` nije prazan string ili neispravan JSON.
2. Raspakivanje u `annoucmentPage.js` **ostaviti** kao mrežu za pad.
3. Isto proveriti za druge kolone koje čuvaju višejezični sadržaj — pregled je
   pokazao da su ostale ispravne (`faq.content`, `faq.name`,
   `faqCategories.name`, `slides.title`, `slides.content`,
   `newsletters.title` su `jsonb`). `newsletters.content` je `text`, ali to je
   **ispravno** — obrazac tamo šalje običan string, ne objekat.

---

## 2. FAQ i FAQ kategorije nemaju način da se sakriju · *zbunjuje korisnika*

**Nalaz:** F-3 i K-2.

Zapis u `faq` ima samo `question`, `answer`, `category`, `position`. Kategorija
ima `name`, `alias`, `position`. **Nema ni zastavice `isVisible`, ni datuma
prikazivanja.** Rute `/faq/all` i `/faqCategories/all` su javne i `/help` ih
crta bez ijednog filtera.

**Posledica:** čim se pritisne „Spremi", pitanje je **odmah javno**. Nema
nacrta, nema pripreme unapred, nema povlačenja bez brisanja. Nedovršen tekst
vidi svaki posetilac.

Zbog ovoga ova dva ekrana **nisu ni testirana do kraja** — probni zapis bi
odmah izašao na sajt, pa je testiran samo obrazac do slanja.

**Šta treba odlučiti:** da li se uvodi stanje „nacrt".

| Mogućnost | Šta traži |
|---|---|
| **A — zastavica `isVisible`** (kao kod kategorija galerija) | kolona u obe tabele, kvačica u oba obrasca, filter u `/faq/all` i `/faqCategories/all`. Najmanje posla, pokriva potrebu. |
| **B — datumi od/do** (kao kod najava) | dve kolone, dva polja, filter po datumu. Više posla; ima smisla samo ako se pitanja objavljuju po rasporedu. |
| **C — ostaviti kako jeste** | ništa, ali onda se svaka izmena piše „uživo" i to treba znati. |

Preporuka: **A**. Datumi ovde nemaju svrhu — pitanje se ne objavljuje na
kampanju.

**Uz to:** ako se uvede filter, proveriti da postojećih 59 pitanja i 11
kategorija dobiju `isVisible = true`, da ne nestanu sa `/help`.

---

## 3. Neispravna „Pozicija" se tiho gubi · *gubi podatke*

**Nalaz:** S-1. Isto važi i za druge ekrane koji imaju „Poziciju".

**Izmereno:** `/account/slides/new`, u polje „Pozicija" upisano `abc`, snimljeno.
Obrazac je poslao `"position":"abc"`, `parseInt` je dao `NaN`, u bazi je ostalo
**`null`**. Nijedna poruka. Administrator ostaje ubeđen da je poziciju postavio.

Uzrok: [admin.js:787](../zipa24062026/api/admin/admin.js:787) —
`position: obj.position ? parseInt(obj.position) : 0`. Isti obrazac stoji i u
`updateFaq`, `updateFaqCategory`, `updateBanner` i `updateCategory`.

**Zašto nije popravljeno:** popravka je jednostavna, ali odgovor na pitanje
„šta uraditi sa neispravnim unosom" je odluka:

| Mogućnost | Ponašanje |
|---|---|
| **A — odbiti unos** | server vraća 400 sa porukom, obrazac se ne snima. Najpoštenije, ali traži i prikaz greške u obrascu (danas ga nema — vidi Z-3). |
| **B — polje `type="number"`** | pregledač ne da da se upiše slovo. Najjeftinije, ali ne štiti od poziva mimo obrasca. |
| **C — tiho na 0** | umesto `null` upisati 0. Ne gubi se red u spisku, ali i dalje ćuti. |

Preporuka: **B + A** — polje kao broj u obrascu, i provera na serveru.

**Napomena:** ovo je vezano za **Z-3** (greška u obrascu je samo crvena boja,
bez ijedne reči). Dok se Z-3 ne reši, mogućnost A nema gde da ispiše razlog.
Vredi ih rešiti zajedno.

---

## 4. Otkazivanje slanja fajla — ostatak · *gubi podatke*

**Nalaz:** Z-8, **delimično popravljen** 2026-08-28.

Popravljeno u `fields/banners.js`, `fields/image.js` i `fields/profilePhoto.js`:
odgovor koji nije 200 se hvata i ispisuje, `.catch` postoji, i uklonjen je
upis **sirovog odgovora servera** u vrednost polja.

**Ostaje `fields/gallery.js`** — isti stari obrazac, nije diran. Koriste ga
`pageForm`, `contactForm`, `blogForm` i četiri obrasca iz mrtvog `store` dela.

**Šta treba odlučiti:** da li se `gallery.js` uopšte popravlja ili se briše.
Od sedam obrazaca koji ga koriste, **četiri su iz `store` dela koji je već
obrisan iz `views/`**, a `blogForm` pripada blogu za koji `CLAUDE.md` kaže da
se izbacuje. Ostaju `pageForm` i `contactForm`.

Ako blog i store idu napolje, `gallery.js` se svodi na dva obrasca i vredi ga
spojiti sa `banners.js`, koji je već popravljen.

---

## 5. Ostalo što traži dogovor

Kratko, ali svako traži nečiju odluku.

### 5.1 Dva mrtva polja u obrascu banera · *zbunjuje korisnika*

**Nalaz:** B-5. `size` (četiri dugmeta „Široki / Uspravni / Kvadratni / Za
telefon") i `mobileOnly` („Samo na telefonu") se **upisuju u bazu, a sajt ih
nigde ne čita**. `size` posebno vara jer izgleda kao izbor koji menja prikaz.

Odluka: ili ih sajt počne poštovati, ili izlaze iz obrasca. Ostaviti ih kako
jesu znači da će neko opet potrošiti vreme na njih.

### 5.2 Probne adrese za newsletter su u izvornom kodu · *zbunjuje korisnika*

**Nalaz:** W-2. [admin.js:1165](../zipa24062026/api/admin/admin.js:1165):

```js
let emails = ['info@zipaphoto.net', 'zipaphoto@gmail.com', 'stanojevic.milan97@gmail.com'];
```

Treća je **lična adresa programera**. Ne može se promeniti iz administracije.

Odluka: da li probno slanje ide na adresu prijavljenog administratora, na
polje u *Podešavanjima sajta*, ili na ručno uneto polje pri slanju.
Najmanje iznenađenja: **adresa prijavljenog administratora**.

### 5.3 Slajder radi samo pod izgledom „trenutni" · *zbunjuje korisnika*

**Nalaz:** S-3. Slajdove crta jedino `views/homePage.js` — zatečena naslovna.
Predlozi A, B i C ih ne crtaju, a trenutno je izabran **Predlog A**. Ceo ekran
„Slajder" danas ne utiče ni na šta, i ništa u administraciji to ne kaže.

Ovo je isto pitanje kao kod `homeRows`/`homeStyle` kod kategorija: vezano je za
to **koja naslovna ostaje**. Vredi rešiti zajedno sa tim izborom — ako ostane
A ili C, ekran „Slajder" se briše.

### 5.4 Prazan spisak ispisuje „0" · *zbunjuje korisnika*

**Nalaz:** Z-1. Pogađa svih šest spiskova. Popravka je mehanička (`? … : null`
umesto `&&`), ali **nije provereno uživo** jer nijedan spisak u produkciji nije
prazan. Vredi popraviti uz prvi sledeći dodir tih fajlova; ovde stoji da se ne
zaboravi.

### 5.5 Kvačice u administraciji nisu dostupne tastaturom · *zbunjuje korisnika*

**Nalaz:** Z-2. `fields/check.js` je `<div onClick>` bez `<input>`, `role` i
`tabIndex`. Na obrascu banera ima **9 takvih kvačica**, a u celoj formi samo
**3 prava polja**. Miš je jedini način.

Popravka dira komponentu koju koristi ceo admin, pa traži svoj prolaz i svoju
proveru — nije stvar za usputnu izmenu uz bezbednosne popravke.

---

## Šta je i dalje neprovereno

Iz istog testa, prepisano da ne ostane samo u prethodnom izveštaju:

- **39 od 47 ekrana administracije** nije otvarano. Provereno je 8.
- **Postavljanje galerije** (`changeGallery.js`) i `/account/preview/:id`.
- **`/checkout` i plaćanje** — PayPal je i dalje u probnom režimu.
- **Uloge `photographer`, `agency`, `legalPerson`** — meren je samo kupac i
  administrator. Fotograf ima svoj meni i svoje ekrane.
- **Stvarno slanje newslettera** — namerno nikad pokrenuto.
- ~~**`/gallery/photos/upload`**~~ — **provereno i pojačano 2026-08-28**, vidi
  nastavak ispod. Nije imala istu rupu kao `/upload`, ali je imala tri manje.

---

## Dodatak — provera ruta koje primaju fajlove (2026-08-28)

Pregledane su **sve četiri** rute koje uzimaju `req.files`. Drugih nema:
pretraga po `req.files` i `.mv(` u celom API-ju vraća samo ova četiri mesta.

| Ruta | Ko sme | Provera | Gde završi |
|---|---|---|---|
| `/upload` | administrator (`*`) | JPG/PNG/WEBP: nastavak + MIME + prvi bajtovi, 5 MB | `uploads/`, statički |
| `/upload/avatar` | svaki prijavljen | ista | `uploads/`, statički |
| `/gallery/photos/upload` | `change-gallery` | JPG: nastavak + MIME + prvi bajtovi, 40 MB | R2, privatno |
| `/gallery/photographer/photos/upload/:uid` | administrator (`*`) | ista (isti kod) | R2, privatno |

### Šta je nađeno na rutama galerije

**Nije bilo iste rupe kao na `/upload`.** Bela lista je postojala (`jpg`/`jpeg`),
prava su bila ispravno postavljena, a rezultat **ne** ide u `express.static` —
originali stoje u privatnom R2 bucketu, a pregledi se ponovo iscrtavaju kroz
`sharp`, pa se sadržaj ne servira onakav kakav je stigao. Provereno i da ime
fajla sa `../../` ne beži iz foldera fotografa — `express-fileupload` ga odseca.

Nađene su tri manje slabosti i sve tri su zatvorene:

1. **Provera je bila samo po IMENU fajla.** Nije bilo ni MIME-a ni sadržaja.
   HTML preimenovan u `.jpg` jeste padao, ali tek na `sharp` — **posle** nego
   što je `exiftool` već pušten preko njega. Sada se prvi bajtovi proveravaju
   pre nego što spoljni program dotakne fajl.
2. **Odbijen fajl je vraćao `500 Error`**, bez razloga. Sada je `400` sa
   porukom („Galerija prima samo JPG fotografije.", „Sadržaj fajla nije JPG
   fotografija.").
3. **Granica veličine je bila 5 MB — i to je bila moja greška** od popravke
   `/upload`: globalni `fileUpload({limits})` važi za sve rute, pa je i original
   galerije bio ograničen na 5 MB. Zatečeni originali su 0,4–1,4 MB pa se ništa
   nije oborilo, ali pun kadar sa današnjeg aparata prelazi 5 MB. Granice su
   sada razdvojene: **5 MB za slike sadržaja, 40 MB za original u galeriji**.

Izmereno posle popravke, nalogom sa pravom `change-gallery`:

```
.svg                   →  400  „Galerija prima samo JPG fotografije."
.txt                   →  400  „Galerija prima samo JPG fotografije."
HTML preimenovan .jpg  →  400  „Sadržaj fajla nije JPG fotografija."
prava JPG              →  200
30 MB JPG              →  200   (ranije bi palo na 5 MB)
kupac                  →  401
bez prijave            →  401
```
