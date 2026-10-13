/**
 * Žig (watermark) na preglednim fotografijama — 350x i 700x.
 *
 * ZAŠTO OVAJ FAJL POSTOJI (2026-10-10):
 * Žig se ranije čitao samo sa lokalnog diska (`./uploads/<ime>`). Render taj
 * disk briše pri svakom deployu i restartu, pa je fajl nestajao, a
 * postavljanje je TIHO nastavljalo bez žiga — galerija „31. Sajam knjige"
 * je tako javno izašla bez žiga.
 *
 * Sada se žig traži redom:
 *   1. lokalno, `./uploads/<ime>` (žig izabran u administraciji),
 *   2. u R2, `zig/<ime>` (tamo ga kopira uključivanje žiga),
 *   3. podrazumevani žig iz repozitorijuma, `zig/zig-zipa.png`.
 * Ako nema nijednog, postavljanje PUCA — nikad se ne objavljuje bez žiga.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const storage = require('./storage');

const PODRAZUMEVANI = path.join(__dirname, 'zig', 'zig-zipa.png');
// Ime pod kojim administracija vidi i bira žig iz repozitorijuma.
const PODRAZUMEVANO_IME = 'podrazumevani';
const kljucR2 = (ime) => `zig/${ime}`;
const imeIzAdrese = (adresa) => (adresa ? String(adresa).split('/').pop() : null);

async function ucitajZig(adresa) {
    const ime = imeIzAdrese(adresa);

    if (ime) {
        const lokalno = path.join(__dirname, 'uploads', ime);
        if (fs.existsSync(lokalno)) return fs.readFileSync(lokalno);

        try {
            return await storage.getBuffer(kljucR2(ime));
        } catch (e) {
            // nema ga u R2 — ide podrazumevani
        }
    }

    if (fs.existsSync(PODRAZUMEVANI)) return fs.readFileSync(PODRAZUMEVANI);

    throw new Error('Žig nije pronađen — fotografija se ne objavljuje bez žiga.');
}

/*
 * Žig za PRIKAZ u administraciji (`GET /zig/:ime`): isti redosled kao
 * `ucitajZig` — lokalno, pa R2 — ali bez tihog pada na podrazumevani, da se
 * u spisku ne bi pojavila tuđa slika. `podrazumevani` je žig iz repozitorijuma.
 */
async function zigZaPrikaz(ime) {
    if (ime === PODRAZUMEVANO_IME) return fs.readFileSync(PODRAZUMEVANI);
    const lokalno = path.join(__dirname, 'uploads', ime);
    if (fs.existsSync(lokalno)) return fs.readFileSync(lokalno);
    return storage.getBuffer(kljucR2(ime));
}

// Kopira žig u R2, da preživi deploy. Zove se pri postavljanju i pri
// uključivanju žiga (2026-10-13: i pri postavljanju — fajl je tada svež).
async function sacuvajZigUR2(adresa) {
    const ime = imeIzAdrese(adresa);
    if (!ime) return;
    const lokalno = path.join(__dirname, 'uploads', ime);
    if (!fs.existsSync(lokalno)) return;
    await storage.put(kljucR2(ime), fs.readFileSync(lokalno), 'image/png');
}

/*
 * Pregled: smanji na zadatu širinu pa nalepi žig preko sredine, širine 50%
 * slike — identično starom rasporedu (logoX 88/350, 175/700).
 */
async function napraviPregled(original, sirina, zig) {
    const smanjena = await sharp(original).rotate().resize({ width: sirina }).jpeg({ quality: 100 }).toBuffer();
    const meta = await sharp(smanjena).metadata();
    const z = await sharp(zig).resize({ width: Math.round(meta.width / 2) }).toBuffer();
    return sharp(smanjena).composite([{ input: z, gravity: 'center' }]).jpeg({ quality: 100 }).toBuffer();
}

module.exports = { ucitajZig, sacuvajZigUR2, napraviPregled, zigZaPrikaz, PODRAZUMEVANO_IME };
