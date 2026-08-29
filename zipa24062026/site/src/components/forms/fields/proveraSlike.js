/*
 * Provera slike PRE slanja na server.
 *
 * Server ima svoju, jaču proveru (`api/admin/slike.js`) i ona je ta koja
 * stvarno štiti — ova je zbog korisnika: da pogrešan fajl dobije odmah jasnu
 * poruku umesto da putuje gore pa se vrati kao greška.
 *
 * Iste vrste i ista granica kao na serveru; ako se tamo promeni, i ovde mora.
 */

export const DOZVOLJENI_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const DOZVOLJENE_EXT  = ['jpg', 'jpeg', 'png', 'webp'];
export const NAJVECA_BAJTOVA = 5 * 1024 * 1024;

// Za `accept` atribut na `<input type=file>` i na Dropzone.
export const ACCEPT = 'image/jpeg,image/png,image/webp';

/*
 * Vraća poruku o grešci, ili `null` ako fajl prolazi.
 */
export function proveriSliku(file, lang) {
    if (!file) return null;

    const ext = String(file.name || '').split('.').pop().toLowerCase();

    if (DOZVOLJENI_MIME.indexOf(file.type) === -1 || DOZVOLJENE_EXT.indexOf(ext) === -1) {
        return 'Dozvoljene su samo slike: JPG, PNG ili WEBP.'.translate(lang);
    }

    if (file.size > NAJVECA_BAJTOVA) {
        const mb = (file.size / 1048576).toFixed(1);
        return ('Slika je prevelika (' + mb + ' MB). Najviše 5 MB.').translate(lang);
    }

    return null;
}
