/**
 * Provera i popravka žiga na preglednim fotografijama (350x i 700x).
 *
 *   node popravi-zig.js <galleryId> [<galleryId> ...]            — samo provera
 *   node popravi-zig.js --popravi <galleryId> [<galleryId> ...]  — provera + popravka
 *   node popravi-zig.js --od 2026-05-01 [--popravi]               — sve galerije objavljene od datuma
 *
 * Kako se prepoznaje pregled BEZ žiga: od originala se napravi isti pregled
 * bez žiga i uporedi sa onim u R2, samo u sredini kadra gde žig stoji. Ako se
 * gotovo ne razlikuju, žiga nema. Popravka pravi oba pregleda iznova iz
 * originala, istim kodom kao postavljanje (`zig.js`).
 *
 * Nastalo 2026-10-10, posle galerije „31. Sajam knjige" koja je izašla bez žiga.
 */
require('dotenv').config({ quiet: true });

const sharp = require('sharp');
const { Pool } = require('pg');
const storage = require('./storage');
const zig = require('./zig');

const args = process.argv.slice(2);
const popravi = args.includes('--popravi');
const odIdx = args.indexOf('--od');
const od = odIdx !== -1 ? Math.floor(new Date(args[odIdx + 1]).getTime() / 1000) : null;
const idevi = args.filter((a, i) => !a.startsWith('--') && !(odIdx !== -1 && i === odIdx + 1));

// Srednja apsolutna razlika (0–255) u sredini kadra; ispod praga = nema žiga.
const PRAG = 4;

async function razlikaUSredini(a, b) {
    const meta = await sharp(a).metadata();
    const w = meta.width, h = meta.height;
    const izrez = { left: Math.round(w * 0.25), top: Math.round(h * 0.3), width: Math.round(w * 0.5), height: Math.round(h * 0.4) };
    const [pa, pb] = await Promise.all([a, b].map((x) =>
        sharp(x).resize(w, h).extract(izrez).greyscale().raw().toBuffer()));
    let zbir = 0;
    for (let i = 0; i < pa.length; i++) zbir += Math.abs(pa[i] - pb[i]);
    return zbir / pa.length;
}

(async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

    const podesavanja = await pool.query('select watermark from settings limit 1');
    const zigBuf = await zig.ucitajZig(podesavanja.rows[0] && podesavanja.rows[0].watermark);

    const upit = od
        ? await pool.query(`select _id, name->>'ba' as naziv, photos from gallery where published >= $1 order by published desc`, [od])
        : await pool.query(`select _id, name->>'ba' as naziv, photos from gallery where _id = any($1)`, [idevi]);

    let bez = 0, popravljeno = 0, ukupno = 0;

    for (const g of upit.rows) {
        const fotke = Array.isArray(g.photos) ? g.photos : [];
        let bezUGaleriji = 0;

        for (const f of fotke) {
            if (!f || !f.image) continue;
            ukupno++;
            try {
                const [orig, pregled] = await Promise.all([
                    storage.getBuffer(storage.originalKey(f.image)),
                    storage.getBuffer(storage.previewKey('700x', f.image)),
                ]);
                const cist = await sharp(orig).rotate().resize({ width: 700 }).jpeg({ quality: 100 }).toBuffer();
                const razlika = await razlikaUSredini(cist, pregled);

                if (razlika < PRAG) {
                    bez++; bezUGaleriji++;
                    if (popravi) {
                        const [x350, x700] = await Promise.all([
                            zig.napraviPregled(orig, 350, zigBuf),
                            zig.napraviPregled(orig, 700, zigBuf),
                        ]);
                        await Promise.all([
                            storage.put(storage.previewKey('350x', f.image), x350),
                            storage.put(storage.previewKey('700x', f.image), x700),
                        ]);
                        popravljeno++;
                    }
                }
            } catch (e) {
                console.log(`  ! ${f.image}: ${e.message}`);
            }
        }

        console.log(`${g._id}  ${g.naziv}  — ${fotke.length} fotografija, bez žiga: ${bezUGaleriji}`);
    }

    console.log(`\nUkupno pregledano: ${ukupno}, bez žiga: ${bez}${popravi ? `, popravljeno: ${popravljeno}` : ''}`);
    await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
