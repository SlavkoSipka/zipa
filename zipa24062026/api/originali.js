/**
 * ČUVANJE ORIGINALA (2026-11-06).
 *
 * Da skladište ne raste bez kraja, agencija bira koliko meseci se originali
 * (puna rezolucija, `originals/` u R2) čuvaju na sajtu. Starijim galerijama
 * se originali brišu; pregledi sa žigom (350x, 700x) OSTAJU, pa se galerija
 * i dalje vidi. Kupac na takvoj fotografiji ne dobija „Dodaj u korpu" nego
 * poruku da kontaktira agenciju, koja fotografiju dostavlja iz svoje arhive
 * po uplati — to sajt već radi kad originala nema (`originalIsOnServer`).
 *
 * BRISANJE JE NEPOVRATNO. Zato:
 *   - brisanje radi samo kad je administrator postavio broj meseci I potvrdio
 *     (`settings.originaliPotvrda`); promena broja meseci traži novu potvrdu;
 *   - galerija sa oznakom „Uvek čuvaj original" (`zadrziOriginal`) se preskače;
 *   - starost se meri datumom galerije (`date`), a bez njega datumom objave;
 *   - obrađena galerija dobija `originaliObrisani` (vreme), pa se ne obrađuje
 *     ponovo;
 *   - jedan prolaz obradi najviše `PO_PROLAZU` galerija, ostale u sledećem.
 * Prolaz pokreće `app.js` dva minuta posle pokretanja i zatim jednom dnevno.
 */
const { DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const storage = require('./storage');
const dbConnect = require('./db');

const DAN = 86400;
const PO_PROLAZU = 300;

const granica = (meseci) => Math.floor(Date.now() / 1000) - Math.round(Number(meseci) * 30.44 * DAN);

const USLOV = `coalesce(nullif("date", 0), "published") < $1
               and coalesce("zadrziOriginal", false) = false
               and "originaliObrisani" is null`;

// Koliko bi se galerija i fotografija obradilo za dati broj meseci.
async function pregled(meseci) {
    const db = await dbConnect();
    if (!(Number(meseci) > 0)) return { galerija: 0, fotografija: 0, starijeOd: null };
    const g = granica(meseci);
    const r = await db.query(
        `select count(*)::int as galerija,
                coalesce(sum(jsonb_array_length(coalesce(photos, '[]'::jsonb))), 0)::int as fotografija
           from gallery where ${USLOV}`, [g]);
    const zasticeno = await db.query(`select count(*)::int as n from gallery where coalesce("zadrziOriginal", false)`);
    const vec = await db.query(`select count(*)::int as n from gallery where "originaliObrisani" is not null`);
    return Object.assign(r.rows[0], { starijeOd: g, zasticeno: zasticeno.rows[0].n, vecObrisano: vec.rows[0].n });
}

// Obriši originale jedne galerije (pregledi ostaju) i označi je.
async function obrisiZaGaleriju(galerija) {
    const db = await dbConnect();
    const fotke = (typeof galerija.photos === 'string' ? JSON.parse(galerija.photos) : galerija.photos) || [];
    const kljucevi = fotke.filter((f) => f && f.image).map((f) => ({ Key: storage.originalKey(f.image) }));
    for (let i = 0; i < kljucevi.length; i += 1000) {
        await storage.client.send(new DeleteObjectsCommand({
            Bucket: storage.R2.bucket,
            Delete: { Objects: kljucevi.slice(i, i + 1000), Quiet: true },
        }));
    }
    await db.query(`update gallery set "originaliObrisani" = $1 where "_id" = $2`, [Math.floor(Date.now() / 1000), galerija._id]);
    return kljucevi.length;
}

let uToku = null;
function prolaz() {
    if (uToku) return uToku;
    uToku = (async () => {
        const db = await dbConnect();
        const [s] = (await db.query(`select "originaliMeseci", "originaliPotvrda" from settings limit 1`)).rows;
        if (!s || !(Number(s.originaliMeseci) > 0) || !s.originaliPotvrda) return { obradjeno: 0 };
        const galerije = (await db.query(
            `select "_id", photos from gallery where ${USLOV} order by coalesce(nullif("date", 0), "published") asc limit ${PO_PROLAZU}`,
            [granica(s.originaliMeseci)])).rows;
        let fotografija = 0;
        for (const g of galerije) {
            try {
                fotografija += await obrisiZaGaleriju(g);
            } catch (e) {
                console.error('[originali] galerija', g._id, '-', e.message);
            }
        }
        if (galerije.length) console.log(`[originali] obrisani originali: ${galerije.length} galerija, ${fotografija} fotografija`);
        return { obradjeno: galerije.length, fotografija };
    })().catch((e) => { console.error('[originali] greška:', e.message); return { obradjeno: 0 }; })
        .finally(() => { uToku = null; });
    return uToku;
}

module.exports = { pregled, prolaz, obrisiZaGaleriju, granica };
