/**
 * Provera žiga na SVAKOJ fotografiji (ne uzorak) u galerijama sa originalom.
 *
 *   node proveri-sve-zig.js <od> <do> [--popravi]
 *
 * Svaki 350x pregled se brzo oceni šablonima (`zig-bez-originala.js`). Ispod
 * praga — što su uglavnom vrlo svetle ili ravne fotografije — ide TAČNA
 * provera sa originalom (`razlikaUZigu`, kao `popravi-zig.js`). Ako žiga
 * stvarno nema, uz `--popravi` se oba pregleda prave iznova iz originala.
 *
 * Nastalo 2026-10-11: provera po uzorku (prva/srednja/poslednja) ne vidi
 * galeriju u kojoj žig fali samo na delu fotografija.
 */
require('dotenv').config({ quiet: true });

const sharp = require('sharp');
const { Pool } = require('pg');
const storage = require('./storage');
const zig = require('./zig');
const { znakZiga } = require('./zig-bez-originala');
const { razlikaUZigu } = require('./zig-detektor');

const [odArg, doArg] = process.argv.slice(2);
const popravi = process.argv.includes('--popravi');
const od = Math.floor(new Date(odArg).getTime() / 1000);
const doD = Math.floor(new Date(doArg).getTime() / 1000);
const PRAG_BRZI = 0.45;
const PRAG_TACNI = 15;
const ISTOVREMENO = 6;

(async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const pod = await pool.query('select watermark from settings limit 1');
    const zigBuf = await zig.ucitajZig(pod.rows[0] && pod.rows[0].watermark);
    const r = await pool.query(`select g._id, g.name->>'ba' as naziv, ph->>'image' as image
                                  from gallery g, jsonb_array_elements(coalesce(g.photos, '[]'::jsonb)) ph
                                 where g.published >= $1 and g.published < $2 and ph->>'image' is not null
                                 order by g.published desc`, [od, doD]);
    const stavke = r.rows;
    console.log(`fotografija: ${stavke.length}`);

    let i = 0, gotovo = 0, sumnjivih = 0, bez = 0, popravljeno = 0, gresaka = 0;
    await Promise.all(Array.from({ length: ISTOVREMENO }, async () => {
        while (i < stavke.length) {
            const s = stavke[i++];
            try {
                const brzi = await znakZiga(await storage.getBuffer(storage.previewKey('350x', s.image)));
                if (brzi.najbolja < PRAG_BRZI) {
                    sumnjivih++;
                    const [orig, pregled] = await Promise.all([
                        storage.getBuffer(storage.originalKey(s.image)),
                        storage.getBuffer(storage.previewKey('700x', s.image)),
                    ]);
                    const cist = await sharp(orig).rotate().resize({ width: 700 }).jpeg({ quality: 100 }).toBuffer();
                    if ((await razlikaUZigu(cist, pregled, zigBuf)) < PRAG_TACNI) {
                        bez++;
                        console.log(`BEZ ŽIGA  ${s._id}  ${s.naziv}  ${s.image}`);
                        if (popravi) {
                            const [x350, x700] = await Promise.all([
                                zig.napraviPregled(orig, 350, zigBuf),
                                zig.napraviPregled(orig, 700, zigBuf),
                            ]);
                            await Promise.all([
                                storage.put(storage.previewKey('350x', s.image), x350),
                                storage.put(storage.previewKey('700x', s.image), x700),
                            ]);
                            popravljeno++;
                        }
                    }
                }
            } catch (e) {
                gresaka++;
                console.log(`greška    ${s._id}  ${s.image}: ${e.message}`);
            }
            if (++gotovo % 2500 === 0) console.log(`provereno ${gotovo}/${stavke.length}, sumnjivih ${sumnjivih}, bez žiga ${bez}, popravljeno ${popravljeno}, grešaka ${gresaka}`);
        }
    }));
    console.log(`GOTOVO: ${stavke.length} fotografija, sumnjivih ${sumnjivih}, bez žiga ${bez}, popravljeno ${popravljeno}, grešaka ${gresaka}`);
    await pool.end();
})().catch((e) => { console.error('PAD', e); process.exit(1); });
