/**
 * IZVEŠTAJI SAJTA — A4 PDF (2026-10-27).
 *
 * Za svaki završeni mesec sistem sam napravi jedan izveštaj i sačuva ga u
 * R2 (`izvestaji/2026-09.pdf`), pa administrator na nadzornoj ploči može da
 * preuzme bilo koji raniji. Isti generator pravi i izveštaj za proizvoljan
 * period (od–do) na zahtev, bez čuvanja.
 *
 * Mesečni se prave „lenjo" i redovno: kad se otvori spisak izveštaja i na
 * svakih šest sati (`app.js`) — što god stigne prvo. Napravljen izveštaj se
 * više ne dira, pa ostaje isti i kad se podaci kasnije promene.
 *
 * IZVORI (svi u bazi):
 *   posete            → `logs` (adresa i vreme svakog otvaranja strane);
 *                        strane administracije i prijave se NE računaju
 *   pregledi fotogr.  → `photoVisits`
 *   nove galerije     → `gallery."published"`, samo galerije na sajtu
 *   korisnici         → `users."registerTimestamp"`
 *   newsletter        → `subscribers` (prijave i odjave)
 *   preuzimanja       → `downloads`; upiti za licence → `upiti`
 *   baneri            → `bannerClicks`
 * Evidencija poseta postoji od 13.07.2026 — ranije istorije nema.
 */
const PdfPrinter = require('pdfmake');
const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
const storage = require('./storage');
const dbConnect = require('./db');

const MESECI = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
const CRVENA = '#C8102E';
const SIVA = '#5E636B';
const LINIJA = '#E3E5E8';

// Strane administracije i naloga nisu posete sajtu.
const NIJE_JAVNO = `(doc->>'url' like '/account%' or doc->>'url' like '/login%' or doc->>'url' like '/register%'
                     or doc->>'url' like '/reset-password%' or doc->>'url' like '/stilovi%')`;
// Posete sa lokalnog (razvojnog) sajta se ne broje nigde (`users.js`, `logVisit`).
const PRAVE = `coalesce(doc->>'lokalno', '') <> 'true'`;

const datum = (t) => {
    const d = new Date(t * 1000);
    return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}.`;
};
const broj = (n) => Number(n || 0).toLocaleString('sr-RS');
// Adresa strane → naziv koji administrator prepoznaje.
const NAZIVI_STRANA = { '/': 'Početna', '/galerije': 'Galerije', '/cart': 'Korpa', '/video': 'Video', '/contact': 'Kontakt',
    '/help': 'Pomoć', '/odjava': 'Odjava sa newslettera', '/checkout': 'Plaćanje' };
const nazivStrane = (s) => NAZIVI_STRANA[s]
    || (s.indexOf('/page/') === 0 ? 'Strana: ' + s.slice(6)
    : s.indexOf('/fotograf/') === 0 ? 'Fotograf: ' + s.slice(10)
    : s.indexOf('/najave/') === 0 ? 'Najava'
    : s.indexOf('/faq/') === 0 ? 'Pitanja: ' + s.slice(5)
    : s);
const dekodiraj = (s) => { try { return decodeURIComponent(String(s).replace(/\+/g, ' ')); } catch (e) { return String(s); } };

// ── podaci za period [od, do) — unix sekunde, UTC ─────────────────────────
async function podaciZaPeriod(od, dokle) {
    const db = await dbConnect();
    const q = async (sql, p) => (await db.query(sql, p || [od, dokle])).rows;
    const uPeriodu = `(doc->>'timestamp')::bigint >= $1 and (doc->>'timestamp')::bigint < $2 and ${PRAVE}`;

    const [ukupno] = await q(
        `select count(*) filter (where not ${NIJE_JAVNO})::int as javne,
                count(*)::int                                   as sve
           from logs where ${uPeriodu}`);

    const poDanima = await q(
        `select to_char(to_timestamp((doc->>'timestamp')::bigint), 'YYYY-MM-DD') as dan, count(*)::int as broj
           from logs where ${uPeriodu} and not ${NIJE_JAVNO}
          group by 1 order by 1`);

    const strane = await q(
        `select split_part(doc->>'url', '?', 1) as strana, count(*)::int as broj
           from logs where ${uPeriodu} and not ${NIJE_JAVNO}
            and doc->>'url' not like '/galerija/%'
          group by 1 order by broj desc limit 10`);

    const galerije = await q(
        `select x.id, coalesce(g.name->>'ba', g.name->>'en', '—') as naziv, x.broj
           from (select split_part(split_part(doc->>'url', '?', 1), '/', 4) as id, count(*)::int as broj
                   from logs where ${uPeriodu} and doc->>'url' like '/galerija/%'
                  group by 1) x
           left join gallery g on g."_id" = x.id
          where x.id <> ''
          order by x.broj desc limit 10`);

    const kategorije = await q(
        `select x.alias, coalesce(c.name->>'ba', x.alias) as naziv, x.broj
           from (select substring(doc->>'url' from 'category=([^&]+)') as alias, count(*)::int as broj
                   from logs where ${uPeriodu} and doc->>'url' like '%category=%'
                  group by 1) x
           left join categories c on c.alias->>'ba' = x.alias
          where x.alias is not null
          order by x.broj desc limit 10`);

    const pretrage = await q(
        `select pojam, count(*)::int as broj
           from (select lower(substring(doc->>'url' from '[?&]search=([^&]+)')) as pojam
                   from logs where ${uPeriodu} and doc->>'url' like '%search=%') x
          where pojam is not null and pojam <> ''
          group by 1 order by broj desc limit 10`);

    const [foto] = await q(`select count(*)::int as broj from "photoVisits" where ${uPeriodu}`);

    const naSajtu = `"isActive" and coalesce("userDisabled", false) = false`;
    const [noveGalerije] = await q(
        `select count(*)::int as galerija,
                coalesce(sum(jsonb_array_length(coalesce("photos", '[]'::jsonb))), 0)::int as fotografija
           from gallery where "published" >= $1 and "published" < $2 and ${naSajtu}`);
    const fotografi = await q(
        `select "user" as ime, count(*)::int as galerija,
                coalesce(sum(jsonb_array_length(coalesce("photos", '[]'::jsonb))), 0)::int as fotografija
           from gallery where "published" >= $1 and "published" < $2 and ${naSajtu}
            and "user" is not null and "user" <> ''
          group by 1 order by fotografija desc limit 10`);

    const [korisnici] = await q(
        `select count(*)::int as ukupno,
                count(*) filter (where "userRole" = 'agency')::int as mediji
           from public.users where "registerTimestamp" >= $1 and "registerTimestamp" < $2`);
    const [newsletter] = await q(
        `select count(*) filter (where "timestamp" >= $1 and "timestamp" < $2 and "unsubscribedAt" is null)::int as prijave,
                count(*) filter (where "unsubscribedAt" >= $1 and "unsubscribedAt" < $2)::int as odjave
           from subscribers`);
    const [preuzimanja] = await q(`select count(*)::int as broj from downloads where "timestamp" >= $1 and "timestamp" < $2`);
    const [upiti] = await q(`select count(*)::int as broj from upiti where (doc->>'published')::bigint >= $1 and (doc->>'published')::bigint < $2`);
    const baneri = await q(
        `select url, count(*)::int as broj from "bannerClicks"
          where "timestamp"::bigint >= $1 and "timestamp"::bigint < $2
          group by 1 order by broj desc limit 8`);
    const [klikovi] = await q(`select count(*)::int as broj from "bannerClicks" where "timestamp"::bigint >= $1 and "timestamp"::bigint < $2`);

    // Svaki dan perioda, i oni bez ijedne posete (nula, ne rupa).
    const poDanu = {};
    poDanima.forEach((d) => { poDanu[d.dan] = d.broj; });
    const dani = [];
    for (let t = od; t < dokle; t += 86400) {
        const kljuc = new Date(t * 1000).toISOString().slice(0, 10);
        dani.push({ dan: kljuc, broj: poDanu[kljuc] || 0 });
    }
    const najvise = dani.reduce((m, d) => (d.broj > m.broj ? d : m), { dan: null, broj: 0 });

    return {
        od, dokle, dani,
        posete: { javne: ukupno.javne, sve: ukupno.sve, prosek: dani.length ? Math.round(ukupno.javne / dani.length) : 0, najvise },
        strane, galerije, kategorije,
        pretrage: pretrage.map((p) => ({ pojam: dekodiraj(p.pojam), broj: p.broj })),
        pregledaFotografija: foto.broj,
        noveGalerije, fotografi, korisnici, newsletter,
        preuzimanja: preuzimanja.broj, upiti: upiti.broj, klikovi: klikovi.broj, baneri,
    };
}

// ── PDF ────────────────────────────────────────────────────────────────────
let stampac = null;
function printer() {
    if (stampac) return stampac;
    const v = require('pdfmake/build/vfs_fonts');
    const vfs = (v.pdfMake && v.pdfMake.vfs) || v.vfs || v;
    const f = (ime) => Buffer.from(vfs[ime], 'base64');
    stampac = new PdfPrinter({
        Roboto: { normal: f('Roboto-Regular.ttf'), bold: f('Roboto-Medium.ttf'), italics: f('Roboto-Italic.ttf'), bolditalics: f('Roboto-MediumItalic.ttf') },
    });
    return stampac;
}

const kartica = (naziv, vrednost, uz) => ({
    stack: [
        { text: naziv, fontSize: 8, color: SIVA },
        { text: vrednost, fontSize: String(vrednost).length > 9 ? 12 : 16, bold: true, margin: [0, 2, 0, 0] },
        uz ? { text: uz, fontSize: 7.5, color: SIVA, margin: [0, 1, 0, 0] } : '',
    ],
    margin: [6, 6, 6, 6],
});

function tabela(naslov, kolone, redovi, prazno) {
    return [
        { text: naslov, style: 'naslov2' },
        redovi.length ? {
            table: {
                headerRows: 1,
                widths: ['*', 60],
                body: [
                    kolone.map((k, i) => ({ text: k, bold: true, fontSize: 8, color: SIVA, alignment: i ? 'right' : 'left' })),
                    ...redovi.map((r) => [{ text: r[0], fontSize: 9 }, { text: r[1], fontSize: 9, alignment: 'right' }]),
                ],
            },
            layout: { hLineWidth: (i) => (i === 0 ? 0 : 0.5), vLineWidth: () => 0, hLineColor: () => LINIJA, paddingTop: () => 3, paddingBottom: () => 3 },
        } : { text: prazno || 'Nema zabeleženih podataka u ovom periodu.', fontSize: 9, color: SIVA, italics: true },
    ];
}

// Posete po danima — stubići (pdfmake `canvas`), bez dodatnih biblioteka.
function grafikon(dani) {
    const sirina = 515, visina = 120;
    const max = Math.max(1, ...dani.map((d) => d.broj));
    const korak = sirina / Math.max(1, dani.length);
    const stub = Math.max(1, korak * 0.7);
    const oblici = [{ type: 'line', x1: 0, y1: visina, x2: sirina, y2: visina, lineWidth: 0.5, lineColor: LINIJA }];
    dani.forEach((d, i) => {
        const h = Math.round((d.broj / max) * (visina - 4));
        if (h > 0) oblici.push({ type: 'rect', x: i * korak + (korak - stub) / 2, y: visina - h, w: stub, h, color: CRVENA });
    });
    const svakih = dani.length > 40 ? 30 : (dani.length > 14 ? 5 : 1);
    const oznake = dani.map((d, i) => (i % svakih === 0 ? `${Number(d.dan.slice(8))}.${Number(d.dan.slice(5, 7))}.` : ''));
    return [
        { canvas: oblici },
        {
            columns: oznake.map((o) => ({ text: o, fontSize: 6, color: SIVA, width: korak })),
            columnGap: 0, margin: [0, 2, 0, 0],
        },
        { text: `Najviše u jednom danu: ${broj(max)}`, fontSize: 7.5, color: SIVA, margin: [0, 4, 0, 0] },
    ];
}

function napraviPdf(p, naslov) {
    const najvise = p.posete.najvise.dan ? `${datum(Date.parse(p.posete.najvise.dan) / 1000)} (${broj(p.posete.najvise.broj)})` : '—';
    const dokument = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 50],
        defaultStyle: { font: 'Roboto', fontSize: 9, color: '#1B1E24' },
        styles: {
            naslov2: { fontSize: 11, bold: true, margin: [0, 14, 0, 6] },
        },
        footer: (strana, ukupno) => ({
            columns: [
                { text: 'ZIPA PHOTO — izvještaj sajta', fontSize: 7, color: SIVA },
                { text: `${strana} / ${ukupno}`, fontSize: 7, color: SIVA, alignment: 'right' },
            ],
            margin: [40, 20, 40, 0],
        }),
        content: [
            { text: 'ZIPA PHOTO', color: CRVENA, bold: true, fontSize: 10, characterSpacing: 1 },
            { text: naslov, fontSize: 20, bold: true, margin: [0, 2, 0, 2] },
            { text: `Period: ${datum(p.od)} – ${datum(p.dokle - 1)}   ·   Napravljeno: ${datum(Math.floor(Date.now() / 1000))}`, fontSize: 8.5, color: SIVA },
            { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 515, y2: 8, lineWidth: 1, lineColor: CRVENA }], margin: [0, 0, 0, 10] },

            {
                table: {
                    widths: ['*', '*', '*', '*'],
                    body: [
                        [
                            kartica('Posjete sajtu', broj(p.posete.javne), `prosječno ${broj(p.posete.prosek)} dnevno`),
                            kartica('Najposjećeniji dan', najvise),
                            kartica('Pregledi fotografija', broj(p.pregledaFotografija)),
                            kartica('Nove galerije', broj(p.noveGalerije.galerija), `${broj(p.noveGalerije.fotografija)} fotografija`),
                        ],
                        [
                            kartica('Novi korisnici', broj(p.korisnici.ukupno), p.korisnici.mediji ? `od toga mediji: ${broj(p.korisnici.mediji)}` : ''),
                            kartica('Newsletter', `+${broj(p.newsletter.prijave)}`, `odjava: ${broj(p.newsletter.odjave)}`),
                            kartica('Preuzimanja / upiti', `${broj(p.preuzimanja)} / ${broj(p.upiti)}`, 'preuzimanja · upiti za licence'),
                            kartica('Klikovi na banere', broj(p.klikovi)),
                        ],
                    ],
                },
                layout: { hLineColor: () => LINIJA, vLineColor: () => LINIJA, hLineWidth: () => 0.5, vLineWidth: () => 0.5 },
            },

            { text: 'Posjete po danima', style: 'naslov2' },
            ...grafikon(p.dani),

            {
                columns: [
                    { width: '*', stack: tabela('Najposjećenije galerije', ['Galerija', 'Posjete'], p.galerije.map((g) => [g.naziv, broj(g.broj)])) },
                    { width: '*', stack: tabela('Najposjećenije strane', ['Strana', 'Posjete'], p.strane.map((s) => [nazivStrane(s.strana), broj(s.broj)])) },
                ],
                columnGap: 20,
            },
            {
                columns: [
                    { width: '*', stack: tabela('Najtraženije kategorije', ['Kategorija', 'Posjete'], p.kategorije.map((k) => [dekodiraj(k.naziv), broj(k.broj)])) },
                    { width: '*', stack: tabela('Najčešće pretrage', ['Pojam', 'Puta'], p.pretrage.map((s) => [s.pojam, broj(s.broj)])) },
                ],
                columnGap: 20,
            },
            {
                columns: [
                    { width: '*', stack: tabela('Fotografi — nove fotografije', ['Fotograf', 'Fotografija'], p.fotografi.map((f) => [f.ime, broj(f.fotografija)])) },
                    { width: '*', stack: tabela('Baneri — klikovi', ['Adresa', 'Klikova'], p.baneri.map((b) => [String(b.url || '—').replace(/^https?:\/\//, ''), broj(b.broj)])) },
                ],
                columnGap: 20,
            },

            {
                text: 'Izvor: evidencija posjeta sajta (vodi se od 13.07.2026), arhiva galerija, korisnici, newsletter, preuzimanja i klikovi na banere. '
                    + `Posjete su otvaranja javnih strana; strane administracije i prijave nisu uračunate (sa njima ukupno ${broj(p.posete.sve)}).`,
                fontSize: 7, color: SIVA, margin: [0, 16, 0, 0],
            },
        ],
    };

    return new Promise((resolve, reject) => {
        const doc = printer().createPdfKitDocument(dokument);
        const delovi = [];
        doc.on('data', (d) => delovi.push(d));
        doc.on('end', () => resolve(Buffer.concat(delovi)));
        doc.on('error', reject);
        doc.end();
    });
}

// ── mesečni, sačuvani u R2 ──────────────────────────────────────────────────
const kljucMeseca = (mesec) => `izvestaji/${mesec}.pdf`;
const nazivMeseca = (mesec) => `${MESECI[Number(mesec.slice(5, 7)) - 1]} ${mesec.slice(0, 4)}`;
const granice = (mesec) => {
    const g = Number(mesec.slice(0, 4)), m = Number(mesec.slice(5, 7)) - 1;
    return [Date.UTC(g, m, 1) / 1000, Date.UTC(g, m + 1, 1) / 1000];
};

async function spisak() {
    const r = await storage.client.send(new ListObjectsV2Command({ Bucket: storage.R2.bucket, Prefix: 'izvestaji/' }));
    return (r.Contents || [])
        .map((o) => ({ mesec: o.Key.replace(/^izvestaji\/|\.pdf$/g, ''), velicina: o.Size, napravljen: o.LastModified }))
        .filter((o) => /^\d{4}-\d{2}$/.test(o.mesec))
        .map((o) => Object.assign(o, { naziv: nazivMeseca(o.mesec) }))
        .sort((a, b) => (a.mesec < b.mesec ? 1 : -1));
}

let uToku = null;
// Napravi izveštaj za svaki završeni mesec koji još nema svoj PDF.
function osigurajMesecne() {
    if (uToku) return uToku;
    uToku = (async () => {
        const db = await dbConnect();
        const [prvi] = (await db.query(`select min((doc->>'timestamp')::bigint) as t from logs`)).rows;
        if (!prvi || !prvi.t) return;
        const postoje = {};
        (await spisak()).forEach((o) => { postoje[o.mesec] = 1; });

        const d = new Date(Number(prvi.t) * 1000);
        let g = d.getUTCFullYear(), m = d.getUTCMonth();
        const sada = new Date();
        while (Date.UTC(g, m + 1, 1) <= Date.UTC(sada.getUTCFullYear(), sada.getUTCMonth(), 1)) {
            const mesec = `${g}-${String(m + 1).padStart(2, '0')}`;
            if (!postoje[mesec]) {
                const [od, dokle] = granice(mesec);
                const pdf = await napraviPdf(await podaciZaPeriod(od, dokle), `Mjesečni izvještaj — ${nazivMeseca(mesec)}`);
                await storage.put(kljucMeseca(mesec), pdf, 'application/pdf');
                console.log('[izvestaji] napravljen', mesec);
            }
            m++; if (m > 11) { m = 0; g++; }
        }
    })().catch((e) => console.error('[izvestaji] greška:', e.message)).finally(() => { uToku = null; });
    return uToku;
}

async function mesecni(mesec) {
    if (!/^\d{4}-\d{2}$/.test(mesec)) throw new Error('neispravan mesec');
    return storage.getBuffer(kljucMeseca(mesec));
}

// Proizvoljan period (YYYY-MM-DD, oba dana uključena) — pravi se na zahtev, ne čuva se.
async function zaPeriod(odDan, doDan) {
    const od = Date.parse(odDan + 'T00:00:00Z') / 1000;
    const dokle = Date.parse(doDan + 'T00:00:00Z') / 1000 + 86400;
    if (!od || !dokle || dokle <= od || dokle - od > 400 * 86400) throw new Error('neispravan period');
    return napraviPdf(await podaciZaPeriod(od, dokle), `Izvještaj za period`);
}

module.exports = { podaciZaPeriod, napraviPdf, spisak, osigurajMesecne, mesecni, zaPeriod };
