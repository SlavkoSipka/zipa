/**
 * Brza provera ŽIGA samo iz preglednog snimka (350x), bez originala.
 *
 * Žig se ugrađuje u sredinu, širine pola slike (`zig.js`). Ovde se na istom
 * mestu napravi očekivani obris žiga i uporedi sa ivicama na samom pregledu
 * (normalizovana korelacija jačine ivica). Sa žigom se ivice slova poklapaju
 * i ocena je visoka; bez žiga je blizu nule. Proverava se i nekoliko
 * susednih položaja (±2px), jer zaokruživanje pri smanjivanju pomera žig.
 *
 * Koristi ga `popravi-zig.js --sve` za proveru cele arhive (2026-10-11).
 */
const sharp = require('sharp');

async function ivice(gray, w, h) {
    // Jačina ivice (Sobel) u jednom kanalu sivih tonova.
    const out = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const i = y * w + x;
            const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1]
                     + gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1];
            const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1]
                     + gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1];
            out[i] = Math.sqrt(gx * gx + gy * gy);
        }
    }
    return out;
}

const kes = new Map();

// Obris žiga za datu širinu pregleda: ivice žiga postavljenog na sivu podlogu.
async function obrisZiga(zigBuf, sirinaZiga) {
    if (kes.has(sirinaZiga)) return kes.get(sirinaZiga);
    const z = await sharp(zigBuf).resize({ width: sirinaZiga }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = z.info;
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
        const r = z.data[i * 4], g = z.data[i * 4 + 1], b = z.data[i * 4 + 2], a = z.data[i * 4 + 3] / 255;
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        gray[i] = a * l + (1 - a) * 128;
    }
    const e = await ivice(gray, w, h);
    const rez = { w, h, e };
    kes.set(sirinaZiga, rez);
    return rez;
}

function ncc(a, b) {
    let sa = 0, sb = 0;
    const n = a.length;
    for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; }
    const ma = sa / n, mb = sb / n;
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) {
        const x = a[i] - ma, y = b[i] - mb;
        num += x * y; da += x * x; db += y * y;
    }
    return da && db ? num / Math.sqrt(da * db) : 0;
}

/*
 * STARI ŽIG (plavi „ZIPA" + „PHOTO AGENCY" u okviru) — galerije iz starog
 * sistema (do ~2020) ga nose umesto današnjeg. Šablon je izveden iz proseka
 * 150 takvih pregleda (`zig/zig-stari-prosek.png`); stoji u sredini, širine
 * ~70% slike (490 od 700).
 */
const path = require('path');
const STARI = path.join(__dirname, 'zig', 'zig-stari-prosek.png');
const STARI_UDEO = 490 / 700;
const kesStari = new Map();

async function obrisStarog(sirina) {
    if (kesStari.has(sirina)) return kesStari.get(sirina);
    const z = await sharp(STARI).resize({ width: sirina }).greyscale().raw().toBuffer({ resolveWithObject: true });
    const e = await ivice(Float32Array.from(z.data), z.info.width, z.info.height);
    const rez = { w: z.info.width, h: z.info.height, e };
    kesStari.set(sirina, rez);
    return rez;
}

// Najbolje poklapanje šablona ivica oko sredine slike (±2px).
function najboljePoklapanje(ePregled, W, H, z) {
    const x0 = Math.round((W - z.w) / 2), y0 = Math.round((H - z.h) / 2);
    let najbolja = -1;
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const isecak = new Float32Array(z.w * z.h);
            for (let y = 0; y < z.h; y++) {
                const py = y0 + dy + y;
                if (py < 0 || py >= H) continue;
                for (let x = 0; x < z.w; x++) {
                    const px = x0 + dx + x;
                    if (px < 0 || px >= W) continue;
                    isecak[y * z.w + x] = ePregled[py * W + px];
                }
            }
            const s = ncc(isecak, z.e);
            if (s > najbolja) najbolja = s;
        }
    }
    return najbolja;
}

/** Ocena prisustva žiga, novog ILI starog (0 = nema, ~0,2+ = ima). */
async function ocenaZiga(pregledBuf, zigBuf) {
    const { data, info } = await sharp(pregledBuf).greyscale().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const ePregled = await ivice(Float32Array.from(data), W, H);
    const novi = najboljePoklapanje(ePregled, W, H, await obrisZiga(zigBuf, Math.round(W / 2)));
    const stari = najboljePoklapanje(ePregled, W, H, await obrisStarog(Math.round(W * STARI_UDEO)));
    return Math.max(novi, stari);
}

/** Stara verzija — samo današnji žig (ostavljena radi poređenja). */
async function ocenaNovogZiga(pregledBuf, zigBuf) {
    const { data, info } = await sharp(pregledBuf).greyscale().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const gray = Float32Array.from(data);
    const ePregled = await ivice(gray, W, H);
    const z = await obrisZiga(zigBuf, Math.round(W / 2));

    const x0 = Math.round((W - z.w) / 2), y0 = Math.round((H - z.h) / 2);
    let najbolja = -1;
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const isecak = new Float32Array(z.w * z.h);
            for (let y = 0; y < z.h; y++) {
                const py = y0 + dy + y;
                if (py < 0 || py >= H) continue;
                for (let x = 0; x < z.w; x++) {
                    const px = x0 + dx + x;
                    if (px < 0 || px >= W) continue;
                    isecak[y * z.w + x] = ePregled[py * W + px];
                }
            }
            const s = ncc(isecak, z.e);
            if (s > najbolja) najbolja = s;
        }
    }
    return najbolja;
}

module.exports = { ocenaZiga, ocenaNovogZiga };

/*
 * TAČNA provera (sa originalom): srednja razlika između čistog pregleda
 * napravljenog iz originala i pregleda u skladištu, SAMO na pikselima na
 * kojima žig stoji (obris današnjeg žiga, proširen). Sa žigom je razlika
 * velika i na svetloj slici; bez žiga je na nivou šuma JPEG-a.
 */
const kesMaske = new Map();
async function maskaZiga(zigBuf, W, H) {
    const kljuc = W + 'x' + H;
    if (kesMaske.has(kljuc)) return kesMaske.get(kljuc);
    const zw = Math.round(W / 2);
    const z = await sharp(zigBuf).resize({ width: zw }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const zh = z.info.height;
    const x0 = Math.round((W - zw) / 2), y0 = Math.round((H - zh) / 2);
    const idx = [];
    for (let y = 0; y < zh; y++) {
        for (let x = 0; x < zw; x++) {
            if (z.data[(y * zw + x) * 4 + 3] > 64) {
                const px = x0 + x, py = y0 + y;
                if (px >= 0 && px < W && py >= 0 && py < H) idx.push(py * W + px);
            }
        }
    }
    kesMaske.set(kljuc, idx);
    return idx;
}

async function razlikaUZigu(cist, pregled, zigBuf) {
    const m = await sharp(pregled).metadata();
    const W = m.width, H = m.height;
    const [a, b] = await Promise.all([cist, pregled].map((x) => sharp(x).resize(W, H).greyscale().raw().toBuffer()));
    const idx = await maskaZiga(zigBuf, W, H);
    let z = 0;
    for (const i of idx) z += Math.abs(a[i] - b[i]);
    return idx.length ? z / idx.length : 0;
}

module.exports.razlikaUZigu = razlikaUZigu;
