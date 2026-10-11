/**
 * Provera ŽIGA na celoj arhivi i popravka (2026-10-11).
 *
 *   node skeniraj-zig.js <izlazni-folder>            — korak 1: brza ocena svih 350x pregleda
 *   node skeniraj-zig.js <izlazni-folder> --popravi  — korak 2: sumnjive proveri originalom i popravi
 *
 * Korak 1 ocenjuje svaki pregled bez skidanja originala (`zig-detektor.js`)
 * i u `sumnjive.json` upisuje sve sa ocenom ispod PRAG_SUMNJE. Korak 2 za
 * svaku sumnjivu skida original, uporedi ga sa pregledom tačno (kao
 * `popravi-zig.js`) i — ako žiga stvarno nema — pravi oba pregleda iznova.
 *
 * Napredak se upisuje u `napredak.txt`, pa posao može da se prati i ponovi.
 */
require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Pool } = require('pg');
const storage = require('./storage');
const zig = require('./zig');
const { ocenaZiga, razlikaUZigu } = require('./zig-detektor');

const izlaz = process.argv[2];
const popravi = process.argv.includes('--popravi');
const PRAG_SUMNJE = 0.15;     // ispod ovoga se proverava originalom
const PRAG_RAZLIKE = 15;      // razlika na pikselima žiga: sa žigom 40+, bez 1–3
const ISTOVREMENO = 24;

const zapis = (t) => fs.appendFileSync(path.join(izlaz, 'napredak.txt'), `[${new Date().toISOString()}] ${t}\n`);

async function paralelno(stavke, fn) {
    let i = 0;
    const radnici = Array.from({ length: ISTOVREMENO }, async () => {
        while (i < stavke.length) { const s = stavke[i++]; await fn(s); }
    });
    await Promise.all(radnici);
}

async function razlikaUSredini(a, b) {
    const meta = await sharp(a).metadata();
    const w = meta.width, h = meta.height;
    const izrez = { left: Math.round(w * 0.25), top: Math.round(h * 0.3), width: Math.round(w * 0.5), height: Math.round(h * 0.4) };
    const [pa, pb] = await Promise.all([a, b].map((x) => sharp(x).resize(w, h).extract(izrez).greyscale().raw().toBuffer()));
    let zbir = 0;
    for (let k = 0; k < pa.length; k++) zbir += Math.abs(pa[k] - pb[k]);
    return zbir / pa.length;
}

(async () => {
    fs.mkdirSync(izlaz, { recursive: true });
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const podesavanja = await pool.query('select watermark from settings limit 1');
    const zigBuf = await zig.ucitajZig(podesavanja.rows[0] && podesavanja.rows[0].watermark);

    if (!popravi) {
        const r = await pool.query(`select g._id as gid, ph->>'image' as image
                                      from gallery g, jsonb_array_elements(coalesce(g.photos,'[]'::jsonb)) ph
                                     where ph->>'image' is not null`);
        const stavke = r.rows;
        zapis(`korak 1: ${stavke.length} fotografija`);
        const sumnjive = [];
        let gotovo = 0, greske = 0;
        await paralelno(stavke, async (s) => {
            try {
                const b = await storage.getBuffer(storage.previewKey('350x', s.image));
                const o = await ocenaZiga(b, zigBuf);
                if (o < PRAG_SUMNJE) sumnjive.push({ gid: s.gid, image: s.image, ocena: Math.round(o * 1000) / 1000 });
            } catch (e) {
                greske++;
                sumnjive.push({ gid: s.gid, image: s.image, greska: e.name || e.message });
            }
            if (++gotovo % 2000 === 0) {
                zapis(`ocenjeno ${gotovo}/${stavke.length}, sumnjivih ${sumnjive.length}, grešaka ${greske}`);
                fs.writeFileSync(path.join(izlaz, 'sumnjive.json'), JSON.stringify(sumnjive));
            }
        });
        fs.writeFileSync(path.join(izlaz, 'sumnjive.json'), JSON.stringify(sumnjive));
        zapis(`KORAK 1 GOTOV: ${gotovo} ocenjeno, sumnjivih ${sumnjive.length}, grešaka ${greske}`);
    } else {
        const sumnjive = JSON.parse(fs.readFileSync(path.join(izlaz, 'sumnjive.json'), 'utf8'));
        zapis(`korak 2: ${sumnjive.length} sumnjivih`);
        const ishod = { popravljeno: [], imaZig: 0, bezOriginala: [], greske: [] };
        let gotovo = 0;
        await paralelno(sumnjive, async (s) => {
            try {
                let orig;
                try { orig = await storage.getBuffer(storage.originalKey(s.image)); }
                catch (e) { ishod.bezOriginala.push(s); return; }

                let bezZiga = true;
                try {
                    const pregled = await storage.getBuffer(storage.previewKey('700x', s.image));
                    const cist = await sharp(orig).rotate().resize({ width: 700 }).jpeg({ quality: 100 }).toBuffer();
                    bezZiga = (await razlikaUZigu(cist, pregled, zigBuf)) < PRAG_RAZLIKE;
                } catch (e) { bezZiga = true; }   // nema pregleda — pravi se iznova

                if (!bezZiga) { ishod.imaZig++; return; }

                const [x350, x700] = await Promise.all([
                    zig.napraviPregled(orig, 350, zigBuf),
                    zig.napraviPregled(orig, 700, zigBuf),
                ]);
                await Promise.all([
                    storage.put(storage.previewKey('350x', s.image), x350),
                    storage.put(storage.previewKey('700x', s.image), x700),
                ]);
                ishod.popravljeno.push(s);
            } catch (e) {
                ishod.greske.push(Object.assign({}, s, { greska: e.message }));
            }
            if (++gotovo % 200 === 0) {
                zapis(`provereno ${gotovo}/${sumnjive.length}, popravljeno ${ishod.popravljeno.length}, ima žig ${ishod.imaZig}`);
                fs.writeFileSync(path.join(izlaz, 'ishod.json'), JSON.stringify(ishod));
            }
        });
        fs.writeFileSync(path.join(izlaz, 'ishod.json'), JSON.stringify(ishod));
        zapis(`KORAK 2 GOTOV: popravljeno ${ishod.popravljeno.length}, već imalo žig ${ishod.imaZig}, bez originala ${ishod.bezOriginala.length}, grešaka ${ishod.greske.length}`);
    }

    await pool.end();
})().catch((e) => { zapis('PAD: ' + (e.stack || e.message)); process.exit(1); });
