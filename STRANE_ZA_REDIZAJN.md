# Spisak strana za redizajn

Naslovna je posebna — ima tri izgleda (A, B, C) koji se menjaju iz
administracije. Ovde su **sve ostale strane**, poređane po tome koliko ih
posetioci stvarno koriste.

Uz svaku stoji adresa za probu i fajl u kome se menja izgled.

---

# PRVI KRUG — ovo posetioci najviše vide

Ovih pet nosi gotovo sav promet. Ako se redizajnira samo ovo, sajt već
izgleda kao nov.

### 1. Spisak galerija (pretraga i filteri)
`/galerije`
Fajl: `views/categoryPage.js` · stil: `scss/_category.scss`

Najvažnija strana posle naslovne. Sadrži pretragu, filtere (datum, grad,
kategorija, orijentacija), izbor broja po strani (36/96/200), prekidač
*Galerije / Fotografije*, tri načina prikaza i podelu na strane.
Ovde se dolazi iz svakog menija i iz svake pretrage.

### 2. Galerija — pregled fotografija
`/galerija/100-godina-fk-borac-banja-luka/6a0b8f908e954649f94ee134`
Fajl: `views/detailPage.js` · stil: `scss/_detail.scss`

Mreža fotografija u galeriji, naslov, opis, autor, deljenje, štampa.
Uz nove izglede nosi natpis preko snimka, redni broj i biranje redosleda.

### 3. Prozor sa fotografijom i cenama
Otvara se klikom na fotografiju u galeriji
Fajl: `views/detailPage.js` (deo `Modal`) · stil: `scss/_photoModal.scss`

Uvećana fotografija, cene po rezolucijama, dugme za kupovinu, kretanje
kroz galeriju strelicama. **Ovde se donosi odluka o kupovini** — vredi
mu posvetiti isto toliko pažnje kao naslovnoj.

### 4. Prijava
`/login`
Fajl: `views/account/loginPage.js` · stil: `scss/_login.scss`

Već ima tri varijante boja vezane za izgled naslovne (A, B, C), ali sam
raspored je ostao stari.

### 5. Registracija
`/register`
Fajl: `views/account/registerPage.js` · stil: `scss/_login.scss`

Dug obrazac. Ovde se najviše ljudi odustane, pa vredi skratiti i razbiti
na korake.

---

# DRUGI KRUG — prodaja i nalog

### 6. Korpa
`/cart`
Fajl: `views/cart/cartPage.js` · stil: `scss/_cart.scss`

### 7. Profil / nalog korisnika
`/account/profile`
Fajl: `views/account/profilePage.js` · stil: `scss/_account.scss`

Ovo je i strana koju vidi administrator sa statistikom — ona sa tvoje
slike. Vredi je razdvojiti: posetilac i administrator ne treba da vide
isti raspored.

### 8. Moja preuzimanja
`/account/downloads`
Fajl: `views/account/downloadsPage.js`

### 9. Izmena podataka o nalogu
`/account/edit`
Fajl: `views/account/editAccountPage.js`

### 10. Promena lozinke
`/account/change-password`
Fajl: `views/account/changePassword.js`

### 11. Zaboravljena lozinka
`/reset-password`
Fajl: `views/account/resetPasswordPage.js`

### 12. Nova lozinka iz veze u pošti
`/reset-password/x/y`
Fajl: `views/account/changePasswordPage.js`

---

# TREĆI KRUG — sadržaj i informacije

### 13. Stranica fotografa
`/fotograf/borislav-zdrinja`
Fajl: `views/photographerPage.js` · stil: `scss/_photographer.scss`

Javni profil fotografa sa njegovim galerijama i izdvojenim fotografijama.

### 14. Pomoć
`/help`
Fajl: `views/helpPage.js`

### 15. Pitanje iz pomoći
`/faq/opste`
Fajl: `views/faqPage.js`

### 16. Kontakt
`/contact`
Fajl: `views/contactPage.js` · stil: `scss/_contact.scss`

### 17. Sadržajne strane (o nama, uslovi, impresum…)
`/page/o-nama` · `/page/uslovi-koriscenja` · `/page/impresum`
`/page/fotografisanje` · `/page/prijatelji-sajta`
Fajl: `views/dynamicPage.js`

**Jedan izgled služi svima** — kako se ovo uredi, tako izgledaju sve
sadržajne strane. Napomena: *saradnja* i *ugovori* su prazne.

### 18. Najava
`/najave/:id`
Fajl: `views/annoucmentPage.js`

Otvara se klikom na crvenu traku iznad naslovne.

### 19. Video
`/video`
Fajl: `views/videoPage.js` · stil: `scss/_naslovnaA.scss`

Nova strana, napravljena u ovom radu. Prazna je dok ne dodate snimke.

### 20. Fotografija na svojoj strani
`/galerija/:alias/:id/:photo`
Fajl: `views/photoPage.js`

Otvara jednu fotografiju na zasebnoj adresi — koristi se za deljenje.

---

# ČETVRTI KRUG — sitne, ali se vide

### 21. Odjava sa liste za obaveštenja
`/odjava?email=x&k=y`
Fajl: `views/odjavaPage.js`

Ovde stiže svako ko klikne na odjavu u newsletteru.

### 22. Potvrda mejla
`/account/verify/:uid/:kod`
Fajl: `views/account/emailVerifyPage.js`

Prva strana koju novi korisnik vidi posle registracije.

### 23. Strana greške
`/404`
Fajl: `views/404.js`

---

# ZAJEDNIČKI DELOVI — menjaju se na svim stranama odjednom

Ovo nisu strane nego delovi koji stoje svuda. Kad se promene, promene se
svuda — pa ih vredi uraditi **pre** pojedinačnih strana.

### Zaglavlje i meni
Fajl: `components/header.js` · stil: `scss/_global.scss`
Uz izgled B nosi plavu traku, uz A preoblikovan meni.

### Podnožje
Fajl: `components/footer.js`

### Kartica galerije
Fajl: `components/articles/article.js`
Pojavljuje se na spisku galerija, kod fotografa i u pretrazi.

### Napredna pretraga (prozor)
Fajl: `components/forms/detailSearchForm.js`

---

# NE TREBA DIRATI

### Blog
`/blog` i `/blog/:alias`
Ostatak iz šablona: nema veza ka njemu, nema sadržaja u bazi, nema ruta u
API-ju. Predlažem da se izbaci umesto da se redizajnira.

---

# Predlog redosleda

1. **Zaglavlje, podnožje i kartica galerije** — jer se vide svuda
2. **Spisak galerija** (#1) i **galerija** (#2)
3. **Prozor sa cenama** (#3) — tu se prodaje
4. **Prijava i registracija** (#4, #5)
5. **Korpa i profil** (#6, #7)
6. Ostalo redom

Kad odabereš stranu, javi — pripremiću ti nekoliko predloga izgleda sa
pravim podacima iz arhive, kao što je bilo za naslovnu, pa da bira klijent.
