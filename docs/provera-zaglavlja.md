# Provera zaglavlja u pregledaču

Šta sam izmerio sam stoji u odgovoru. Ovde je ono što tražim da pogledaš —
uglavnom stvari koje ne mogu da proverim bez prijave na nalog, i one gde je
sud o izgledu tvoj.

Sajt: `http://localhost:10016`. Radi u temi A: *Podešavanja sajta → Izgled
naslovne strane → Predlog A*, pa uključi **„Novi izgled vidim samo ja"**.

---

## 1. Prijavljen korisnik — ovo nisam mogao da proverim

Nisam pravio nalog niti se prijavljivao. Sve ispod je jedini deo zaglavlja
koji nije prošao kroz stvarnu proveru:

- [ ] Prijavi se kao **kupac**. Umesto „Uloguj se / Registruj se" desno stoji
      **tvoje ime** sa strelicom.
- [ ] Klik na ime otvara panel: **Profil · Preuzimanja · Korpa · Izloguj se**,
      a iznad njih tvoja adresa e-pošte.
- [ ] Sve četiri veze vode gde treba. „Izloguj se" te vraća na naslovnu i
      pokaže poruku „Hvala vam što ste koristili foto servis."
- [ ] Prijavi se kao **fotograf**. Korpe **nema** — ni u traci ni u panelu
      (fotografi ne kupuju).
- [ ] Kao fotograf otvori `/account/galleries`: nalozni meni ispod zaglavlja
      izgleda kao i pre. Njega nisam menjao, samo prenosio.
- [ ] Kao **administrator** otvori `/account/settings`: administratorski meni
      sa svim padajućim spiskovima radi kao i pre.

## 2. Kapija za pretpregled

- [ ] Sa uključenim „Novi izgled vidim samo ja" otvori sajt u prozoru bez
      prijave (privatni prozor). Posetilac mora da dobije temu **trenutni** —
      Poppins i stare boje.
- [ ] Isključi kvačicu: posetilac dobija temu A.

**Reci mi da li je ovo ono što si hteo:** zaglavlje je sada **jedno** za sve
četiri teme. Pod temom „trenutni" ono je novo zaglavlje sa starim bojama, a
ne staro zaglavlje. Tražio si da radi u sve četiri teme, pa sam tako i uradio
— ali to znači da „trenutni" više nije potpuna mreža za pad za zaglavlje.
Ako želiš staro zaglavlje netaknuto pod tom temom, reci pa vraćam.

## 3. Pretraga

- [ ] Ukucaj `protest` u polje u zaglavlju i pritisni **Enter** — vodi na
      `/galerije?search=protest`.
- [ ] Isto to preko plavog dugmeta sa lupom.
- [ ] Dok kucaš, ispod polja iskaču predlozi. Strelicama gore/dole biraš,
      Enter potvrđuje, klik miša radi.
- [ ] Dugme desno od lupe otvara **Naprednu pretragu**.

**Napomena:** tražio si `/galerije?q=...`. Ostavio sam **`?search=`** jer
`views/categoryPage.js` čita isključivo `search`; `q` je ime parametra na
API-ju za predloge i strana ga ne čita. Sa `?q=` bi pretraga iz zaglavlja
tiho prestala da radi. Ako baš hoćeš `q`, treba menjati i stranu — reci.

## 4. Kategorije i Agencija

- [ ] „Kategorije" otvara panel sa **43 kategorije u tri stuba**, uz broj
      fotografija pored svake. To je isti spisak koji hrani `/galerije`.
- [ ] Klik na bilo koju vodi na `/galerije?category=…&detailSearch=true`.
- [ ] „Agencija" otvara panel sa tri grupe: **Agencija**, **Usluge**,
      **Fotografi (62)**. „Usluge" je naslov grupe, ne dugme — nema više
      podmenija u podmeniju.
- [ ] Otvoren je uvek samo jedan panel; drugi zatvara prvi.
- [ ] **Escape** zatvara. Klik van zatvara. Klik unutar panela ne zatvara.

## 5. Tastatura

- [ ] Iz adresne trake pritisni **Tab** nekoliko puta. Svaka stavka mora da
      dobije **vidljiv plavi okvir**. Nijedna ne sme da se preskoči ni da
      ostane bez okvira.
- [ ] Miš ne sme da izaziva okvir — samo tastatura.

## 6. Telefon

Suzi prozor ispod 1024px, ili otvori na telefonu.

- [ ] Meni se otvara **klizeći sa leve strane**. Zavesa zatamni stranu.
- [ ] **Escape** zatvara. Klik na zavesu zatvara.
- [ ] Dok je otvoren, **strana ispod se ne pomera** pri skrolovanju.
- [ ] Unutar fioke „Kategorije" i „Agencija" se otvaraju **na mestu**, kao
      harmonika — ne kao padajući prozor.
- [ ] Polje za pretragu je **u svom redu, punom širinom** i vidi se odmah.
- [ ] Prelazak na novu stranu sam zatvara fioku.

## 7. Skrolovanje

- [ ] Skroluj naniže: tanka gornja traka nestaje, zaglavlje se stanjuje sa
      **137px na 87px**, logo se smanjuje, pojavi se blaga senka.
- [ ] **Pretraga ostaje vidljiva i dok je zaglavlje stanjeno.**
- [ ] Sadržaj strane pri tome **ne poskakuje** ni gore ni dole.
- [ ] Vrati se na vrh: tanka traka se vraća.

## 8. Teme

Na `/stilovi` preklopnik menja sve četiri teme bez diranja podešavanja.

- [ ] Prođi **trenutni → A → B → C**. Zaglavlje u svakoj:
      pismo se menja (Poppins ↔ Archivo Narrow), radijus se menja
      (10px ↔ 2px ↔ 4px), plava se menja (`#3c59b9` ↔ `#2f4fcc` ↔ `#3a5296`).
- [ ] Ni u jednoj temi ništa ne iskače iz reda i nema vodoravnog klizača.

## 9. Ono što ti je sud

- [ ] Da li je tekst u meniju dovoljno krupan? Sada je **18px** (bio je 14–16).
- [ ] Da li „Dan Republike Srpske" dobro stoji u gornjoj traci? Premestio sam
      ga tamo iz glavnog menija — sa 189px bio je širi od svake prave stavke i
      gurao pretragu na 173px. Sada pretraga ima 414px.
- [ ] Da li ti smeta što se **pretraga iz zaglavlja i velika pretraga na
      naslovnoj** sada vide jedna ispod druge? Naslovnu nisam dirao.

---

## Šta nisam dirao, a vredi da znaš

- **Logo.** `settings.logo` ne iscrtava nikakav SVG — natpis `ZIPAPHOTO.NET`
  je jedini logo, i stiže iz administracije kao `<h6>`. Zato ga na telefonu
  nisam sakrio: bez njega ne bi bilo puta nazad na naslovnu.
- **Tri mrtva CSS pravila.** `header .traka-vrh` i `.logo-b > .natpis-b` u
  `_naslovnaB.scss`, `ul.meni-a` u `_naslovnaA.scss` — služila su starim
  varijantama zaglavlja za predloge A i B, kojih više nema jer je zaglavlje
  sada jedno. Ne smetaju; brišu se kad budeš hteo.
- **Iskačuća reklama na telefonu** stoji na `z-index: 3000` i pokrije i
  zaglavlje i fioku. Zatečeno ponašanje, nisam ga menjao.
