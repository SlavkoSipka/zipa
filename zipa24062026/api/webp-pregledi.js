/**
 * WebP uz postojeće preglede (350x i 700x) — 2026-10-27.
 *
 * Novi pregledi dobijaju WebP sami (`storage.put`). Ova skripta pravi WebP
 * za one koji su postavljeni ranije: pročita JPG pregled iz R2, napravi
 * `<isti ključ>.webp` i upiše ga pored. JPG se NE dira.
 *
 *   node webp-pregledi.js --naslovna                — galerije sa početne strane
 *   node webp-pregledi.js --od 2026-01-01           — galerije objavljene od datuma
 *   node webp-pregledi.js --galerije <id>,<id>      — tačno ove galerije
 *   node webp-pregledi.js --sve                     — cela arhiva, najnovije prvo
 *
 *   --paralelno 16   koliko fotografija odjednom (podrazumevano 16)
 *   --proba          samo prebroji, ništa ne upisuje
 *
 * Može da se prekine (Ctrl+C) i pokrene ponovo: WebP koji već postoji se
 * preskače, pa se nastavlja tamo gde je stalo. Greška na jednoj fotografiji
 * ne zaustavlja ostale — na kraju se ispiše koliko ih je bilo.
 */
require('dotenv').config({ quiet: true });

const { Pool } = require('pg');
const { HeadObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const storage = require('./storage');

const args = process.argv.slice(2);
const vrednost = (ime) => { const i = args.indexOf(ime); return i !== -1 ? args[i + 1] : null; };
const PARALELNO = parseInt(vrednost('--paralelno'), 10) || 16;
const PROBA = args.includes('--proba');
const API = (process.env.API_URL || 'http://localhost:10015').replace(/\/+$/, '');
const VELICINE = ['350x', '700x'];

const postoji = async (key) => {
    try {
        await storage.client.send(new HeadObjectCommand({ Bucket: storage.R2.bucket, Key: key }));
        return true;
    } catch (e) {
        return false;
    }
};

// Galerije koje početna strana prikazuje — isti pozivi kao sajt (`routesList.js`).
async function galerijeSaNaslovne() {
    const idevi = {};
    const pokupi = (x) => {
        if (!x || typeof x !== 'object') return;
        if (Array.isArray(x)) { x.forEach(pokupi); return; }
        if (x._id && Array.isArray(x.photos)) idevi[x._id] = 1;
        if (typeof x.link === 'string') {
            const m = x.link.match(/\/galerija\/[^/]+\/([0-9a-f]{24})/);
            if (m) idevi[m[1]] = 1;
        }
        Object.keys(x).forEach((k) => pokupi(x[k]));
    };
    for (const putanja of ['/gallery/latest', '/categories/home', '/featured/all', '/products/latest']) {
        try {
            const r = await fetch(API + putanja);
            if (r.ok) pokupi(await r.json());
        } catch (e) {
            console.error('Ne mogu da pročitam', API + putanja, '-', e.message);
        }
    }
    return Object.keys(idevi);
}

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

    let upit;
    if (args.includes('--naslovna')) {
        const idevi = await galerijeSaNaslovne();
        console.log('Galerija sa početne strane:', idevi.length);
        upit = await pool.query('select _id, photos from gallery where _id = any($1)', [idevi]);
    } else if (vrednost('--od')) {
        const od = Math.floor(new Date(vrednost('--od')).getTime() / 1000);
        upit = await pool.query('select _id, photos from gallery where published >= $1 order by published desc', [od]);
    } else if (vrednost('--galerije')) {
        upit = await pool.query('select _id, photos from gallery where _id = any($1)', [vrednost('--galerije').split(',')]);
    } else if (args.includes('--sve')) {
        upit = await pool.query('select _id, photos from gallery order by published desc nulls last');
    } else {
        console.log('Izaberite: --naslovna | --od <datum> | --galerije <id,id> | --sve   (vidi vrh fajla)');
        await pool.end();
        return;
    }
    await pool.end();

    // Svaka fotografija jednom, u obe veličine.
    const slike = {};
    upit.rows.forEach((g) => {
        const fotke = typeof g.photos === 'string' ? JSON.parse(g.photos) : (g.photos || []);
        fotke.forEach((f) => { if (f && f.image) slike[f.image] = 1; });
    });
    const poslovi = [];
    Object.keys(slike).forEach((image) => VELICINE.forEach((v) => poslovi.push(storage.previewKey(v, image))));
    console.log(`Galerija: ${upit.rows.length}, fotografija: ${Object.keys(slike).length}, pregleda: ${poslovi.length}`);
    if (PROBA) return;

    const st = { napravljeno: 0, vec: 0, nemaJpg: 0, greske: 0, ustedaJpg: 0, ustedaWebp: 0 };
    const pocetak = Date.now();
    let sledeci = 0;

    const radnik = async () => {
        while (sledeci < poslovi.length) {
            const key = poslovi[sledeci++];
            try {
                if (await postoji(storage.webpKey(key))) { st.vec++; continue; }
                let jpg;
                try { jpg = await storage.getBuffer(key); } catch (e) { st.nemaJpg++; continue; }
                const webp = await storage.napraviWebp(jpg);
                await storage.client.send(new PutObjectCommand({
                    Bucket: storage.R2.bucket, Key: storage.webpKey(key), Body: webp, ContentType: 'image/webp',
                }));
                st.napravljeno++;
                st.ustedaJpg += jpg.length;
                st.ustedaWebp += webp.length;
            } catch (e) {
                st.greske++;
                if (st.greske <= 20) console.error('Greška:', key, '-', e.message);
            }
            const gotovo = st.napravljeno + st.vec + st.nemaJpg + st.greske;
            if (gotovo % 500 === 0) {
                const sek = (Date.now() - pocetak) / 1000;
                const ostalo = Math.round(((poslovi.length - gotovo) / (gotovo / sek)) / 60);
                console.log(`${gotovo}/${poslovi.length} — napravljeno ${st.napravljeno}, već postoji ${st.vec}, ` +
                    `bez JPG ${st.nemaJpg}, greške ${st.greske} — još oko ${ostalo} min`);
            }
        }
    };

    await Promise.all(Array.from({ length: PARALELNO }, radnik));

    const mb = (b) => (b / 1024 / 1024).toFixed(1) + ' MB';
    console.log('\nGOTOVO za', Math.round((Date.now() - pocetak) / 1000), 's');
    console.log(`Napravljeno ${st.napravljeno}, već postojalo ${st.vec}, bez JPG pregleda ${st.nemaJpg}, greške ${st.greske}`);
    if (st.napravljeno) {
        console.log(`Ti pregledi: JPG ${mb(st.ustedaJpg)} → WebP ${mb(st.ustedaWebp)} ` +
            `(${Math.round((1 - st.ustedaWebp / st.ustedaJpg) * 100)}% manje)`);
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
