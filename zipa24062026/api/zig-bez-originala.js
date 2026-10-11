/**
 * Provera ŽIGA kad ORIGINALA NEMA (2026-10-11).
 *
 * Galerije pre ~2024 nemaju original u R2, pa `proveri-galerije-zig.js` (koji
 * pregled poredi sa originalom) za njih ne može da radi. Ovde se pregled
 * poredi sa ŠABLONOM žiga.
 *
 * U arhivi postoji pet izgleda žiga:
 *
 *   plavi     2015 – mart 2016     plavo „ZIPA", tamno „PHOTO AGENCY", okvir
 *   srednjiA  2016 – 2020          sivo puno „ZIPA" u okviru, crvena crtica gore
 *   srednjiB  2016 – 2020          isto, niže postavljeno
 *   srednjiC  2016 – 2020          obris „ZIPA", bela pločica „PHOTO AGENCY", ©
 *   danasnji  od nov 2020          beli obris „ZIPA" + „PHOTO AGENCY" (`zig-zipa.png`)
 *
 * Šabloni `zig/prosek-*-{350,700}.png` su prosek nekoliko stotina pregleda
 * svake vrste: fotografije se u proseku razliju u sivo, a žig — uvek na istom
 * mestu — ostane oštar. Stari sistem nije pravio 350x prostim smanjenjem 700x,
 * pa postoji šablon za svaku veličinu.
 *
 * ZNAKOVNI TEST — gleda se vodoravni drugi izvod L(x) = 2·S(x) − S(x−1) −
 * S(x+1) u tačkama gde je u šablonu najjači (ivice i linije žiga) i poredi se
 * samo ZNAK. Vodoravni izvod ne vidi vodoravne pruge koje stari pregledi (pa i
 * njihov prosek) imaju po redovima, a znak ne zavisi od jačine slike.
 *
 * Poluprovidan žig je na tamnoj pozadini SVETLIJI od okoline, a na svetloj
 * TAMNIJI — znak se okreće od mesta do mesta. Zato se znak sabira po delovima
 * okvira (DEO×DEO px) i broji se apsolutna vrednost svakog dela: deo u kome se
 * znak dosledno poklapa (ili dosledno okreće) nosi žig; slučajni delovi daju
 * malo. Ravna tačka (bez detalja) ne glasa, pa skoro crna slika bez žiga ne
 * dobija visoku ocenu.
 *
 * Ocena je 0..1; uzima se najveća od svih šablona, uz pomeranje ±3px.
 */
const path = require('path');
const sharp = require('sharp');

// Okvir žiga u koordinatama 700×467 (x0, y0, x1, y1).
const SABLONI = {
    plavi: { fajl: 'prosek-plavi', okvir: [100, 110, 600, 355] },
    // Isti plavi žig, ali u kanalu „plavo minus crveno": plava slova su u
    // sivim tonovima tamna, pa na tamnoj fotografiji skoro nestanu; razlika
    // plave i crvene ih pokazuje bez obzira na svetlinu. Šablon je u boji.
    plaviBoja: { fajl: 'prosek-plavi', okvir: [100, 110, 600, 355], kanal: 'plavo' },
    srednjiA: { fajl: 'prosek-srednjiA', okvir: [95, 85, 600, 335] },
    srednjiB: { fajl: 'prosek-srednjiB', okvir: [100, 115, 600, 355] },
    srednjiC: { fajl: 'prosek-srednjiC', okvir: [145, 125, 610, 360] },
    danasnji: { fajl: 'prosek-danasnji', okvir: [165, 170, 530, 340] },
};
const SW = 700, SH = 467;
const UDEO_TACAKA = 0.04;   // najjačih 4% tačaka šablona u okviru
const DEO = 24;             // veličina dela za sabiranje znaka (px)

async function sivaSlika(ulaz, W, H, kanal) {
    if (kanal !== 'plavo') return sharp(ulaz).resize(W, H, { fit: 'fill' }).greyscale().raw().toBuffer();
    const px = await sharp(ulaz).resize(W, H, { fit: 'fill' }).removeAlpha().raw().toBuffer();
    const out = Buffer.alloc(W * H);
    for (let i = 0; i < W * H; i++) out[i] = Math.max(0, Math.min(255, 128 + (px[i * 3 + 2] - px[i * 3]) / 2));
    return out;
}

const kes = new Map();
// Tačke šablona za pregled širine W: razmera 700×467, u sredini po visini.
async function tackeSablona(ime, W) {
    const kljuc = ime + W;
    if (kes.has(kljuc)) return kes.get(kljuc);
    const s = SABLONI[ime];
    const k = W / SW, Hs = Math.round(SH * k);
    const T = await sivaSlika(path.join(__dirname, 'zig', `${s.fajl}-${W <= 500 ? 350 : 700}.png`), W, Hs, s.kanal);
    const [x0, y0, x1, y1] = s.okvir.map((v) => Math.round(v * k));
    const sve = [];
    for (let y = y0; y < y1; y++) {
        for (let x = Math.max(1, x0); x < Math.min(W - 1, x1); x++) {
            const i = y * W + x;
            sve.push([x, y, 2 * T[i] - T[i - 1] - T[i + 1]]);
        }
    }
    sve.sort((a, b) => Math.abs(b[2]) - Math.abs(a[2]));
    const rez = { Hs, tacke: sve.slice(0, Math.round(sve.length * UDEO_TACAKA)) };
    kes.set(kljuc, rez);
    return rez;
}

/** Ocene za svaki šablon i najveća: { plavi, …, najbolja, koji }. */
async function znakZiga(pregledBuf) {
    const m = await sharp(pregledBuf).metadata();
    const W = m.width, H = m.height;
    const slike = {
        siva: await sivaSlika(pregledBuf, W, H),
        plavo: await sivaSlika(pregledBuf, W, H, 'plavo'),
    };
    const opseg = Math.max(2, Math.round(3 * W / SW));
    const rez = {};
    for (const ime of Object.keys(SABLONI)) {
        const t = await tackeSablona(ime, W);
        const P = slike[SABLONI[ime].kanal || 'siva'];
        const pomakY = Math.round((H - t.Hs) / 2);
        let najbolja = 0;
        for (let dy = -opseg; dy <= opseg; dy++) {
            for (let dx = -opseg; dx <= opseg; dx++) {
                const delovi = new Map();
                let sve = 0;
                for (const [x0, y0, lt] of t.tacke) {
                    const x = x0 + dx, y = y0 + pomakY + dy;
                    if (x < 1 || y < 0 || x >= W - 1 || y >= H) continue;
                    sve++;
                    const i = y * W + x;
                    const lp = 2 * P[i] - P[i - 1] - P[i + 1];
                    if (Math.abs(lp) < 2) continue;
                    const d = ((y / DEO) | 0) * 1000 + ((x / DEO) | 0);
                    delovi.set(d, (delovi.get(d) || 0) + ((lp > 0) === (lt > 0) ? 1 : -1));
                }
                let zbir = 0;
                for (const v of delovi.values()) zbir += Math.abs(v);
                const v = sve ? zbir / sve : 0;
                if (v > najbolja) najbolja = v;
            }
        }
        rez[ime] = najbolja;
    }
    const koji = Object.keys(SABLONI).reduce((a, b) => (rez[a] >= rez[b] ? a : b));
    return Object.assign(rez, { najbolja: rez[koji], koji });
}

module.exports = { znakZiga };
