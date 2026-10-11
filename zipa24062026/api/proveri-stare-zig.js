/**
 * Provera žiga na galerijama BEZ ORIGINALA (pre ~2024), samo iz pregleda.
 * Za galerije sa originalom tačnija je `proveri-galerije-zig.js`.
 *
 *   node proveri-stare-zig.js <od> <do> <izlazni-folder>
 *
 * Za svaku galeriju uzima prvu, srednju i poslednju fotografiju, skida 350x
 * pregled i ocenjuje ga šablonima (`zig-bez-originala.js`). Uzorak ispod
 * PRAGA se čuva u `<izlaz>/sumnjive/` i upisuje u `sumnjive.tsv` — te se
 * pregledaju okom (kontakt list), jer ocena na vrlo svetloj ili ravnoj slici
 * ume da bude niska i kad žig postoji.
 *
 * Kalibrisano 2026-10-11 na 200 + 200 uzoraka po vrsti žiga: slike bez žiga
 * najviše 0,34, sa žigom gotovo sve iznad 0,45.
 */
require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const storage = require('./storage');
const { znakZiga } = require('./zig-bez-originala');

const [odArg, doArg, izlaz] = process.argv.slice(2);
const od = Math.floor(new Date(odArg).getTime() / 1000);
const doD = Math.floor(new Date(doArg).getTime() / 1000);
const PRAG = 0.45;
const ISTOVREMENO = 6;

(async () => {
    fs.mkdirSync(path.join(izlaz, 'sumnjive'), { recursive: true });
    const tsv = path.join(izlaz, 'sumnjive.tsv');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const r = await pool.query(`select _id, name->>'ba' as naziv, to_timestamp(published)::date as datum, photos from gallery
                                 where published >= $1 and published < $2 order by published desc`, [od, doD]);
    const galerije = r.rows;
    console.log(`galerija: ${galerije.length}`);

    let i = 0, gotovo = 0, sumnjivih = 0, bezPregleda = 0;
    await Promise.all(Array.from({ length: ISTOVREMENO }, async () => {
        while (i < galerije.length) {
            const g = galerije[i++];
            const f = (g.photos || []).filter((x) => x && x.image);
            const uzorak = [...new Set([0, Math.floor(f.length / 2), f.length - 1])].filter((n) => n >= 0 && n < f.length);
            for (const n of uzorak) {
                let b;
                try { b = await storage.getBuffer(storage.previewKey('350x', f[n].image)); }
                catch (e) { bezPregleda++; fs.appendFileSync(tsv, `NEMA\t${g._id}\t${n}\t\t${g.naziv}\t${f[n].image}\n`); continue; }
                try {
                    const o = await znakZiga(b);
                    if (o.najbolja < PRAG) {
                        sumnjivih++;
                        const ime = `${g._id}_${n}.jpg`;
                        fs.writeFileSync(path.join(izlaz, 'sumnjive', ime), b);
                        fs.appendFileSync(tsv, `SUMNJA\t${g._id}\t${n}\t${o.najbolja.toFixed(3)}\t${g.naziv}\t${f[n].image}\n`);
                    }
                } catch (e) {
                    fs.appendFileSync(tsv, `GRESKA\t${g._id}\t${n}\t\t${g.naziv}\t${e.message}\n`);
                }
            }
            if (++gotovo % 250 === 0) console.log(`provereno ${gotovo}/${galerije.length}, sumnjivih uzoraka ${sumnjivih}, bez pregleda ${bezPregleda}`);
        }
    }));
    console.log(`GOTOVO: ${galerije.length} galerija, sumnjivih uzoraka ${sumnjivih}, bez pregleda ${bezPregleda}`);
    await pool.end();
})().catch((e) => { console.error('PAD', e); process.exit(1); });
