/**
 * Tačna provera žiga PO GALERIJI (2026-10-11): za svaku galeriju objavljenu
 * od zadatog datuma uzima se nekoliko fotografija (prva, srednja, poslednja),
 * pregled 700x se poredi sa originalom (kao `popravi-zig.js`). Galerija u
 * kojoj ijedna nema žig upisuje se u izlaz; njih onda popravlja
 * `node popravi-zig.js --popravi <id> ...`.
 *
 *   node proveri-galerije-zig.js 2025-01-01 <izlazni.json>
 *
 * Radi sa malo istovremenih zahteva, da ne zagusi vezu.
 */
require('dotenv').config({ quiet: true });

const fs = require('fs');
const sharp = require('sharp');
const { Pool } = require('pg');
const storage = require('./storage');
const zig = require('./zig');
const { razlikaUZigu } = require('./zig-detektor');

const od = Math.floor(new Date(process.argv[2]).getTime() / 1000);
const izlaz = process.argv[3];
const ISTOVREMENO = 3;
const PRAG = 15;   // razlika na pikselima žiga: sa žigom 40+, bez 1–3

async function razlikaUSredini(a, b) {
    const meta = await sharp(a).metadata();
    const w = meta.width, h = meta.height;
    const izrez = { left: Math.round(w * 0.25), top: Math.round(h * 0.3), width: Math.round(w * 0.5), height: Math.round(h * 0.4) };
    const [pa, pb] = await Promise.all([a, b].map((x) => sharp(x).resize(w, h).extract(izrez).greyscale().raw().toBuffer()));
    let zbir = 0;
    for (let k = 0; k < pa.length; k++) zbir += Math.abs(pa[k] - pb[k]);
    return zbir / pa.length;
}

let zigBuf = null;

async function bezZiga(image) {
    const [orig, pregled] = await Promise.all([
        storage.getBuffer(storage.originalKey(image)),
        storage.getBuffer(storage.previewKey('700x', image)),
    ]);
    const cist = await sharp(orig).rotate().resize({ width: 700 }).jpeg({ quality: 100 }).toBuffer();
    return (await razlikaUZigu(cist, pregled, zigBuf)) < PRAG;
}

(async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const pod = await pool.query('select watermark from settings limit 1');
    zigBuf = await zig.ucitajZig(pod.rows[0] && pod.rows[0].watermark);
    const r = await pool.query(`select _id, name->>'ba' as naziv, published, photos from gallery
                                 where published >= $1 order by published desc`, [od]);
    const galerije = r.rows;
    console.log(`galerija od ${process.argv[2]}: ${galerije.length}`);

    const lose = [];
    let i = 0, gotovo = 0;
    const radnici = Array.from({ length: ISTOVREMENO }, async () => {
        while (i < galerije.length) {
            const g = galerije[i++];
            const f = (g.photos || []).filter((x) => x && x.image);
            if (!f.length) { gotovo++; continue; }
            const uzorak = [...new Set([f[0], f[Math.floor(f.length / 2)], f[f.length - 1]])];
            let bez = 0, greske = 0;
            for (const x of uzorak) {
                try { if (await bezZiga(x.image)) bez++; } catch (e) { greske++; }
            }
            if (bez) {
                lose.push({ id: g._id, naziv: g.naziv, fotografija: f.length, bezZigaUUzorku: bez, uzorak: uzorak.length });
                console.log(`BEZ ŽIGA  ${g._id}  ${g.naziv}  (${bez}/${uzorak.length})`);
            }
            if (greske) console.log(`greška    ${g._id}  ${g.naziv}  (${greske} bez originala ili pregleda)`);
            if (++gotovo % 50 === 0) console.log(`provereno ${gotovo}/${galerije.length}`);
        }
    });
    await Promise.all(radnici);
    fs.writeFileSync(izlaz, JSON.stringify(lose, null, 1));
    console.log(`GOTOVO: ${galerije.length} galerija, bez žiga ${lose.length}`);
    await pool.end();
})().catch((e) => { console.error('PAD', e); process.exit(1); });
