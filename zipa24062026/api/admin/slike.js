/*
 * PROVERA POSTAVLJENE SLIKE
 *
 * Do 2026-08-28 je `/upload` primao bilo šta: ekstenzija se uzimala iz imena
 * fajla i snimala kakva jeste, uz IZRIČIT izuzetak za `.svg`. Pošto se
 * `uploads/` servira statički (`express.static`), postavljen `.svg` ili
 * `.html` sa skriptom postajao je trajni XSS na domenu API-ja.
 *
 * Ovde se ime fajla više ne veruje. Proveravaju se tri stvari i sve tri
 * moraju da prođu:
 *
 *   1. ekstenzija iz imena       — bela lista
 *   2. MIME koji je poslao klijent — bela lista
 *   3. PRVI BAJTOVI sadržaja      — jedino što se ne može lagati
 *
 * Treća je ta koja stvarno štiti: klijent može da nazove fajl `slika.png` i
 * pošalje `image/png`, ali ne može da natera HTML da počne sa `\x89PNG`.
 *
 * Ekstenzija koja se snima IZVODI SE IZ SADRŽAJA, ne iz imena — tako
 * `zlo.html` nazvan `zlo.png` završi kao `.png` i servira se kao slika.
 */

// Dozvoljeno je samo ovo. `svg` NIJE slika u ovom smislu — to je dokument
// koji sme da nosi skriptu — i namerno ga nema.
const DOZVOLJENE = {
    jpg:  { mime: ['image/jpeg'],  ext: '.jpg'  },
    jpeg: { mime: ['image/jpeg'],  ext: '.jpg'  },
    png:  { mime: ['image/png'],   ext: '.png'  },
    webp: { mime: ['image/webp'],  ext: '.webp' },
};

/*
 * Dve granice, jer se radi o dve različite stvari:
 *
 *   NAJVECA          — slike SADRŽAJA (baneri, slajdovi, logo, slika profila).
 *                      To su ukrasi i 5 MB je i više nego dovoljno.
 *   NAJVECA_ORIGINAL — original fotografije koji fotograf šalje u galeriju.
 *                      To je roba koja se prodaje i ne sme da se seče.
 *                      Zatečeni originali u arhivi su 0,4–1,4 MB, ali pun
 *                      kadar sa današnjeg aparata ume i preko 20 MB.
 *
 * `app.js` globalnu granicu postavlja na veću od dve; manja se proverava u
 * `proveri()` i vraća jasnu poruku.
 */
const NAJVECA = 5 * 1024 * 1024;             // 5 MB  — slike sadržaja
const NAJVECA_ORIGINAL = 40 * 1024 * 1024;   // 40 MB — original u galeriji

/*
 * Prepoznavanje po prvim bajtovima.
 *   JPEG  FF D8 FF
 *   PNG   89 50 4E 47 0D 0A 1A 0A
 *   WEBP  "RIFF" .... "WEBP"
 */
function vrstaIzSadrzaja(buf) {
    if (!buf || buf.length < 12) return null;

    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpg';

    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
        buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A) return 'png';

    if (buf.slice(0, 4).toString('ascii') === 'RIFF' &&
        buf.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';

    return null;
}

/*
 * Vraća `{ greska }` ako fajl ne prolazi, ili `{ ext }` sa ekstenzijom koju
 * treba snimiti. Poruke su na srpskom jer idu pravo u administraciju.
 */
function proveri(file) {
    if (!file) {
        return { greska: 'Nije poslat nijedan fajl.' };
    }

    const velicina = file.size != null ? file.size : (file.data ? file.data.length : 0);
    if (velicina > NAJVECA) {
        return { greska: `Fajl je prevelik (${(velicina / 1048576).toFixed(1)} MB). Najviše 5 MB.` };
    }
    if (!velicina) {
        return { greska: 'Fajl je prazan.' };
    }

    const imeExt = String(file.name || '').split('.').pop().toLowerCase();
    const pravilo = DOZVOLJENE[imeExt];
    if (!pravilo) {
        return { greska: 'Dozvoljene su samo slike: JPG, PNG ili WEBP.' };
    }

    const mime = String(file.mimetype || '').toLowerCase();
    if (pravilo.mime.indexOf(mime) === -1) {
        return { greska: 'Vrsta fajla ne odgovara njegovom nastavku.' };
    }

    // Jedina provera koja se ne može zaobići preimenovanjem.
    const stvarna = vrstaIzSadrzaja(file.data);
    if (!stvarna) {
        return { greska: 'Sadržaj fajla nije slika. Dozvoljeni su JPG, PNG i WEBP.' };
    }
    if (stvarna === 'jpg' && imeExt !== 'jpg' && imeExt !== 'jpeg') {
        return { greska: 'Sadržaj fajla ne odgovara nastavku.' };
    }
    if (stvarna !== 'jpg' && stvarna !== imeExt) {
        return { greska: 'Sadržaj fajla ne odgovara nastavku.' };
    }

    return { ext: DOZVOLJENE[stvarna === 'jpg' ? 'jpg' : stvarna].ext };
}

module.exports = { proveri, vrstaIzSadrzaja, NAJVECA, NAJVECA_ORIGINAL, DOZVOLJENE };
