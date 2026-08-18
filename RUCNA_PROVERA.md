# Ručna provera sajta — ono što nije moglo automatski

Ovo su provere za koje treba prijava na nalog ili stvarna radnja (slanje pošte,
plaćanje), pa ih nisam mogao odraditi sam.

Uz svaku stavku upiši **RADI** ili **NE RADI**, a ako ne radi — šta se tačno
desilo (poruka, prazan ekran, ništa).

Sajt za probu: `http://localhost:10016`

---

## 1. ADMINISTRACIJA — prijava

- [ ] 1.1 Otvori `/login` i prijavi se administratorskim nalogom
      → očekivano: prebaci te na nalog, gore desno piše tvoje ime
- [ ] 1.2 Osveži stranu (F5)
      → očekivano: i dalje si prijavljen, ne izbacuje te
- [ ] 1.3 Otvori novi jezičak i idi na `/account/profile`
      → očekivano: otvara se bez ponovne prijave

---

## 2. GALERIJA — postavljanje (najvažnije)

- [ ] 2.1 `Nalog → Galerije → Dodaj novu`
- [ ] 2.2 Upiši naziv, opis, izaberi kategoriju i datum
- [ ] 2.3 Postavi **3 do 5 fotografija** iz FotoStation-a
      → očekivano: sve se postave, vidi se napredak, ništa se ne zaglavi
- [ ] 2.4 Proveri da li su se podaci **sami popunili** iz fotografije:
      - naziv galerije
      - opis
      - lokacija (grad)
      - autor
      - datum snimanja
      - **ključne reči** (polje Keywords iz FotoStation-a)
- [ ] 2.5 Upiši nešto u polje **Skriveni tekst za pretragu** kod jedne fotografije
- [ ] 2.6 Sačuvaj galeriju
- [ ] 2.7 Otvori galeriju kao posetilac — da li se vidi, da li su sve slike tu
- [ ] 2.8 Proveri da se **skriveni tekst NIGDE ne vidi** posetiocu
- [ ] 2.9 Pretraži sajt po reči iz skrivenog teksta
      → očekivano: fotografija se pronalazi
- [ ] 2.10 Vrati se u galeriju i **dodaj još 2 fotografije** postojećoj galeriji
      → očekivano: dodaju se na kraj, ne ponavljaju se prve

---

## 3. GALERIJA — izmena i brisanje

- [ ] 3.1 Izmeni naziv galerije i sačuvaj → da li se promenilo na sajtu
- [ ] 3.2 Ugasi galeriju (Status) → da li nestaje sa sajta
- [ ] 3.3 Uključi je nazad → da li se vraća
- [ ] 3.4 Obriši probnu galeriju → da li nestaje i iz pretrage

---

## 4. OBAVEŠTENJE PRETPLATNICIMA

**PAŽNJA:** ovo šalje poštu na 62 prave adrese. Radi samo ako si siguran.
Bezbednije: prvo obriši sve pretplatnike osim svoje adrese, pa vrati posle.

- [ ] 4.1 Pri objavi galerije označi *Obavijesti pretplatnike o ovoj galeriji*
- [ ] 4.2 Sačuvaj → da li ti stiže pošta
- [ ] 4.3 U poruci proveri: naslov, fotografija, opis
- [ ] 4.4 Klikni **Odjavi me sa liste** na dnu poruke
      → očekivano: otvara stranu koja kaže da si odjavljen
- [ ] 4.5 Proveri u `Nalog → Pretplatnici` da te više nema

---

## 5. NEWSLETTER

- [ ] 5.1 `Nalog → Newsletter → Novi`
- [ ] 5.2 Upiši naslov, uvodni tekst, izaberi nekoliko galerija
- [ ] 5.3 Pošalji **probno** sebi → da li stiže i kako izgleda
- [ ] 5.4 Proveri da u poruci postoji veza za odjavu i da radi

---

## 6. PODEŠAVANJA SAJTA

- [ ] 6.1 `Nalog → Podešavanja sajta`
- [ ] 6.2 Promeni **Izgled naslovne strane** na *Predlog B* → sačuvaj
      → otvori naslovnu: da li se promenio izgled
- [ ] 6.3 Uključi **Novi izgled vidim samo ja** → sačuvaj
      → otvori sajt u prozoru bez prijave: mora da vidi STARI izgled
- [ ] 6.4 Probaj i *Predlog A* i *Predlog C*
- [ ] 6.5 Vrati na *Trenutni izgled*
- [ ] 6.6 Uključi **Iskačuću reklamu na telefonu**, označi jedan baner
      → otvori sajt na telefonu: da li iskoči posle par sekundi i da li se zatvara

---

## 7. ŽIG NA FOTOGRAFIJAMA

- [ ] 7.1 `Nalog → Žig na fotografijama`
- [ ] 7.2 Dodaj novi žig (PNG sa providnom pozadinom, oko 1000 tačaka široko)
- [ ] 7.3 Uključi ga
- [ ] 7.4 Postavi novu fotografiju → da li nosi NOVI žig
- [ ] 7.5 Otvori staru galeriju → da li je zadržala STARI žig
- [ ] 7.6 Probaj da obrišeš uključeni žig → mora da odbije
- [ ] 7.7 Vrati stari žig kao uključen

---

## 8. IZDVOJENO I VIDEO

- [ ] 8.1 Dodaj stavku u **Izdvojeno**: naslov, fotografija, veza ka galeriji
- [ ] 8.2 Uključi Predlog B → da li se vidi odeljak „Izdvajamo"
- [ ] 8.3 Klikni na nju → da li otvara pravu galeriju
- [ ] 8.4 Dodaj **video** — nalepi adresu snimka sa YouTube kanala
- [ ] 8.5 Da li se sličica sama preuzela
- [ ] 8.6 Otvori `/video` → da li se snimak vidi i otvara

---

## 9. KATEGORIJE

- [ ] 9.1 Otvori kategoriju, promeni **Poziciju** → da li se pomerila na naslovnoj
- [ ] 9.2 Postavi **Redova na početnoj = Dva** → da li se pojavilo 10 galerija
- [ ] 9.3 Postavi **Način prikaza = Krupni** → prva galerija veća
- [ ] 9.4 Postavi **Način prikaza = Traka** → lista se u stranu
- [ ] 9.5 Vrati na *Redovni* i *Jedan red*

---

## 10. BANERI

- [ ] 10.1 Napravi baner, izaberi **Veličinu** i položaj
- [ ] 10.2 Da li se pojavljuje na sajtu tamo gde treba
- [ ] 10.3 Klikni na njega → proveri u `Statistika bannera` da li je klik zabeležen
- [ ] 10.4 Označi *Samo na telefonu* → da li nestaje sa računara

---

## 11. KUPOVINA — do kraja

**PAŽNJA:** plaćanje je trenutno na PROBNOM PayPal nalogu, pa pravi novac
ne prolazi. Ovo testira tok, ne naplatu.

- [ ] 11.1 Odjavi se i registruj **novi probni nalog**
- [ ] 11.2 Da li ti stiže pošta za potvrdu naloga
- [ ] 11.3 Potvrdi nalog iz poruke → da li se možeš prijaviti
- [ ] 11.4 Otvori galeriju, klikni fotografiju → prozor sa cenama
- [ ] 11.5 Dodaj u korpu, otvori korpu → da li je stavka tu i cena tačna
- [ ] 11.6 Idi na plaćanje → **dokle stigne** i šta piše
- [ ] 11.7 Ako plaćanje prođe: da li se fotografija može preuzeti
- [ ] 11.8 Proveri u `Nalog → Transakcije` da li je zabeleženo

---

## 12. ZABORAVLJENA LOZINKA

- [ ] 12.1 `/login → Zaboravljena lozinka`, upiši svoju adresu
- [ ] 12.2 Da li stiže pošta
- [ ] 12.3 Otvori vezu iz poruke, postavi novu lozinku
- [ ] 12.4 Prijavi se novom lozinkom

---

## 13. KONTAKT

- [ ] 13.1 Popuni obrazac na `/contact` i pošalji
- [ ] 13.2 Da li stiže poruka na `info@zipaphoto.net`

---

## 14. ŠTAMPA I PDF

- [ ] 14.1 Otvori galeriju → Ctrl+P (ili Cmd+P)
- [ ] 14.2 Da li se u pregledu vide samo logotip, naslov, opis i fotografije
      (bez menija, pretrage, banera i podnožja)
- [ ] 14.3 Da li **možeš da biraš format papira** (A4, A3…)
- [ ] 14.4 Sačuvaj kao PDF → da li se fotografije seku na prelazu strana

---

## 15. TELEFON — pravi uređaj

Ne emulator, nego stvarni telefon.

- [ ] 15.1 Naslovna — da li se sve vidi, ima li pomeranja levo-desno
- [ ] 15.2 Pretraga i predlozi dok kucaš
- [ ] 15.3 Otvaranje galerije i fotografije
- [ ] 15.4 Prijava i korpa
- [ ] 15.5 Postavljanje galerije sa telefona (ako ti to treba)

---

## 16. FOTOGRAF (drugi nalog)

- [ ] 16.1 Prijavi se kao fotograf, ne kao administrator
- [ ] 16.2 Da li vidi samo svoje galerije
- [ ] 16.3 Da li može da postavi galeriju
- [ ] 16.4 Da li NE MOŽE da uđe u podešavanja sajta i tuđe galerije

---

## Kad završiš

Pošalji mi spisak sa upisanim odgovorima. Sve što piše **NE RADI** ide na
spisak za popravku, zajedno sa onim što sam već našao.
