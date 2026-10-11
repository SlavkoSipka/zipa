/**
 * Utiskivanje žiga u POSTOJEĆI pregled — za galerije bez originala u R2,
 * gde `popravi-zig.js` ne može da napravi pregled iznova (2026-10-11).
 *
 *   node utisni-zig.js <galleryId> [...]             — samo provera
 *   node utisni-zig.js --utisni <galleryId> [...]    — provera + utiskivanje
 *
 * Svaka fotografija (350x i 700x posebno) se prvo oceni šablonima
 * (`zig-bez-originala.js`); žig se utiskuje SAMO na pregled ispod praga, da
 * se ne bi utisnuo dvaput. Utiskuje se današnji žig, isto kao pri
 * postavljanju (`zig.js`): širine pola slike, u sredini.
 */
require('dotenv').config({ quiet: true });

const sharp = require('sharp');
const { Pool } = require('pg');
const storage = require('./storage');
const zig = require('./zig');
const { znakZiga } = require('./zig-bez-originala');

const args = process.argv.slice(2);
const utisni = args.includes('--utisni');
const idevi = args.filter((a) => !a.startsWith('--'));
const PRAG = 0.45;

async function sazigom(pregled, zigBuf) {
    const meta = await sharp(pregled).metadata();
    const z = await sharp(zigBuf).resize({ width: Math.round(meta.width / 2) }).toBuffer();
    return sharp(pregled).composite([{ input: z, gravity: 'center' }]).jpeg({ quality: 95 }).toBuffer();
}

(async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const pod = await pool.query('select watermark from settings limit 1');
    const zigBuf = await zig.ucitajZig(pod.rows[0] && pod.rows[0].watermark);
    const r = await pool.query(`select _id, name->>'ba' as naziv, photos from gallery where _id = any($1)`, [idevi]);

    let ukupno = 0, bez = 0, utisnuto = 0;
    for (const g of r.rows) {
        let bezUGaleriji = 0;
        for (const f of (g.photos || []).filter((x) => x && x.image)) {
            for (const vel of ['350x', '700x']) {
                ukupno++;
                try {
                    const kljuc = storage.previewKey(vel, f.image);
                    const b = await storage.getBuffer(kljuc);
                    const o = await znakZiga(b);
                    if (o.najbolja >= PRAG) continue;
                    bez++; bezUGaleriji++;
                    if (utisni) {
                        await storage.put(kljuc, await sazigom(b, zigBuf));
                        utisnuto++;
                    }
                } catch (e) {
                    console.log(`  ! ${vel} ${f.image}: ${e.message}`);
                }
            }
        }
        console.log(`${g._id}  ${g.naziv}  — pregleda bez žiga: ${bezUGaleriji}`);
    }
    console.log(`\nUkupno pregleda: ${ukupno}, bez žiga: ${bez}${utisni ? `, utisnuto: ${utisnuto}` : ''}`);
    await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
