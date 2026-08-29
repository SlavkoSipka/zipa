# Pošta — prelazak na Resend (2026-08-28)

Sva pošta sa sajta ide kroz **jedan fajl**, `api/sendMail.js`. On je prepisan sa
SMTP-a na Resend. Ostalih **13 poziva u kodu nije dirano** — potpis funkcije je
i dalje `(to, subject, html)`.

## Zašto se menjalo

| Šta je smetalo | Kako je bilo | Sada |
|---|---|---|
| **Port 25** | Render blokira odlazni port 25. Provereno: veza se otvori, server nikad ne pošalje pozdrav, istekne. Na produkciji bi slanje viselo pa palo. | HTTPS API — nema porta koji neko blokira. |
| **Greške se nisu videle** | `sendMail` je koristio callback i **nije vraćao `Promise`**. `await sendMail(...)` u petlji newslettera prolazio je odmah, a `try/catch` oko njega bio je mrtav kod. Newsletter se označavao „Poslato" i kad nijedna poruka nije otišla. | Vraća `Promise` koji se **odbija** na grešci. Petlja broji šta je stvarno prošlo. |
| **Isporuka** | Nema DKIM ni DMARC; SPF se završava sa `?all` (neutralno). Deljeni hosting (`include:hostmonster.com`) uz to ograničava masovno slanje. | Resend potpisuje svojim DKIM-om nad proverenim domenom. |

## Šta je urađeno

- `api/sendMail.js` — prepisan na Resend, vraća `Promise`, ispisuje `id`
  poslate poruke ili razlog neuspeha.
- `api/admin/admin.js` — `sendNewsletter` sada broji uspele i neuspele. Ako
  **nijedna** poruka ne prođe, status se vraća na „Na čekanju" umesto da ostane
  „Poslato". `sentCount` je stvarni broj, ne pretpostavka; dodat `failedCount`.
- `render.yaml` — `RESEND_API_KEY` (tajna), `MAIL_FROM`, i `SITE_URL`.
- Ključ je upisan u `zipa24062026/api/.env`, koji je u `.gitignore`.
  **Provereno da ga nema ni u jednom praćenom fajlu.**

## Provereno

```
from: noreply@zipaphoto.net   →  403  „domain is not verified"   ← čeka DNS
from: onboarding@resend.dev   →  200  poslato, id dobijen        ← kod radi
sendMail() na grešci          →  Promise se ODBIJA               ← petlja to hvata
sendMail() kad prolazi        →  Promise se razrešava sa id-om
```

Slanje je probano na `delivered@resend.dev` — Resend-ov simulator. **Nijedna
poruka nije otišla nijednom čoveku**, a lista od 62 pretplatnika nije dirana.

## Slike i veze u porukama — popravljeno 2026-08-28

Uz prelazak na Resend popravljeno je i ovo, jer bi inače svaka poruka stizala
polomljena bez obzira na to koji servis šalje.

**Host sa slikama je bio mrtav.** Svi šabloni su vukli logo i ikone sa
`zipa-mail-assets.novamedia.agency`. DNS pokazuje na `94.130.217.122`, ali ni
HTTPS ni HTTP ne odgovaraju (`000`). Znači **nijedna poslata poruka nije imala
logotip** — 12 mesta u 6 šablona.

| Šta | Kako je rešeno |
|---|---|
| **Logo** (12 mesta) | Servira ga sam API iz `api/mail-assets/`, preko `%%SLIKE%%` oznake koju popunjava `sendMail.js`. Fajl je agencijski logo iz `settings.logo`. |
| **Ikone društvenih mreža** (30 mesta) | Izbačene. Slike nisu postojale, a `href` im je bio `#` — nisu vodile nikuda. |
| **Ukrasne ikone** `cart/email/lock` (5) | Izbačene, iz istog razloga. |
| **Veza ka galeriji u newsletteru** | Vodila je na `zipa-mail-assets.novamedia.agency/{alias}/{id}` — mrtav host i pogrešna putanja. Sada `%%SAJT%%/galerija/{alias}/{id}`. |

Uz to: `admin.js` je imao **zakucano** `https://zipa.novamedia.agency/account/verify/…`
u poruci koju šalje kad administrator promeni nekome adresu. Sada čita
`SITE_URL`, kao i sve ostale poruke.

Provereno: `/mail-assets/logo.png` i `logo-footer.png` vraćaju 200 `image/png`;
u sva tri proverena šablona ostalo je **0 oznaka** i **0 pomena mrtvog hosta**;
poruka poslata kroz pravi `sendMail` prošla je (na Resend simulator).

**Ako agencija želi ikone mreža nazad**, treba da pošalje fajlove — stavljaju se
u `api/mail-assets/` i vrate u šablone. Bez pravih adresa profila (`settings`
ih već ima: facebook, instagram, twitter…) nemaju svrhu jer nisu ni vodile nikuda.

---

## Ostalo je na tebi — dva koraka

### 1. Proveri domen `zipaphoto.net` u Resend-u

Ovo je jedino što još stoji između sadašnjeg stanja i ispravnog slanja.

1. Na `resend.com/domains` dodaj **zipaphoto.net**.
2. Resend daje tri DNS zapisa — dodaj ih kod registrara domena:
   - **MX** i **TXT (SPF)** za poddomen za slanje
   - **TXT (DKIM)** — ovaj daje potpis, bez njega pošta ide u spam
3. Klikni „Verify". Obično prođe za nekoliko minuta.

Dok se to ne uradi, `MAIL_FROM=noreply@zipaphoto.net` vraća **403** i pošta se
**ne šalje uopšte** — ni potvrde registracije, ni zaboravljena lozinka.

> Ako ti treba da sajt šalje poštu **odmah**, pre nego što DNS bude gotov,
> privremeno postavi `MAIL_FROM=onboarding@resend.dev`. Upozorenje: sa tom
> adresom Resend šalje **samo na adresu vlasnika naloga**, pa je to dobro za
> probu, a ne za posetioce.

### 2. Dodaj DMARC (preporuka, nije obavezno)

Kad DKIM proradi, dodaj i:

```
_dmarc.zipaphoto.net   TXT   "v=DMARC1; p=none; rua=mailto:info@zipaphoto.net"
```

`p=none` samo posmatra i šalje izveštaje — ništa ne odbija. Kad vidiš da je
sve čisto, prelazi se na `p=quarantine`.

Vredi i **SPF** promeniti sa `?all` na `~all` — `?all` znači „ne tvrdim ništa",
što danas skoro ništa i ne vredi.

### Kad postavljaš na Render

U nadzornoj ploči servisa `zipa-api` postavi tri promenljive:

| Ključ | Vrednost |
|---|---|
| `RESEND_API_KEY` | ključ iz Resend-a |
| `MAIL_FROM` | `ZIPA PHOTO <noreply@zipaphoto.net>` |
| `SITE_URL` | pravi URL sajta, npr. `https://zipa.novamedia.agency` |

`SITE_URL` je važan: ulazi u **svaku** poruku — veza za potvrdu e-pošte, za
novu lozinku i za odjavu sa newslettera. Bez njega `constants.js` pada na
`http://localhost:10016` i primaoci dobijaju veze koje nikuda ne vode.

`SMTP_*` promenljive su ostavljene u `render.yaml` dok se ne potvrdi da Resend
radi u produkciji. Ništa ih više ne čita i mogu se obrisati posle toga.

---

## Kad ćeš prvi put slati newsletter

Redosled koji preporučujem:

1. Proveri domen (korak 1 gore).
2. U administraciji, na newsletteru u stanju „Na čekanju", pritisni
   **„POŠALJI TEST"** — ide na tri adrese iz koda. *(Te tri adrese su i dalje
   zakucane, među njima i lična adresa programera — vidi `ceka-odluku.md`,
   tačka 5.2.)*
3. Pogledaj kako je stigla poruka — da li je u prijemnom sandučetu ili u spamu,
   i da li veza za odjavu radi.
4. Tek onda **„POŠALJI NEWSLETTER"**. Traži potvrdu sa brojem primalaca.
   Šalje jedno po jedno, sa pauzom od pola sekunde — 62 adrese traju oko pola
   minuta.
5. Posle slanja spisak pokazuje **stvaran** broj poslatih. Ako piše manje nego
   što ima pretplatnika, razlog je u logu API-ja (`[newsletter] neuspelo
   slanje na …`).

## Ograničenja Resend-a koja vredi znati

- Besplatni nivo: **3.000 poruka mesečno, 100 dnevno**. Za 62 pretplatnika i
  transakcionu poštu je dovoljno; ako lista naraste preko ~90, jedan newsletter
  pojede dnevnu kvotu.
- Resend je prvenstveno za **transakcionu** poštu. Za listu pretplatnika imaju
  **Broadcasts**, sa upravljanjem listom i odjavom. Za sada nije potrebno, ali
  je pravi put ako lista poraste.
- Ključ koji je dat je **ograničen na slanje** — ne može da čita ni da menja
  domene. To je dobro; znači da ni u slučaju curenja ne može da promeni
  postavke naloga.
