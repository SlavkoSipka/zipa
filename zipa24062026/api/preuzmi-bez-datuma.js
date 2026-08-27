/*
 * Jednokratni ispis: galerije bez datuma snimanja.
 *
 * Kataloški broj se sastavlja iz datuma, pa galerije bez njega ne mogu da ga
 * dobiju. Dogovoreno je da se ne izmišlja zamena — umesto toga se pravi
 * spisak koji agencija ručno dopunjava. Ovo je taj spisak.
 */
require('dotenv').config();
const { Pool } = require('pg');
const dbAuth = require('./constants').dbAuth || {};

const p = new Pool({
    connectionString: process.env.DATABASE_URL || dbAuth.pgConnectionString,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    // Kontrolno pitanje: da li ijedna VIDLJIVA galerija nema datum?
    const kontrola = await p.query(`
        SELECT
          COUNT(*) FILTER (WHERE nema_datum)                              AS bez_datuma,
          COUNT(*) FILTER (WHERE nema_datum AND "isActive" IS TRUE)       AS bez_datuma_vidljive,
          COUNT(*) FILTER (WHERE nema_datum AND broj > 0)                 AS bez_datuma_sa_slikama,
          COUNT(*)                                                        AS sve
        FROM (
          SELECT "isActive",
                 jsonb_array_length(COALESCE(photos, '[]'::jsonb)) AS broj,
                 ((date IS NULL OR date::text = '' OR date::text = '0')
                  AND (published IS NULL OR published::text = '' OR published::text = '0')) AS nema_datum
          FROM gallery
        ) t
    `);
    console.log('KONTROLA|' + JSON.stringify(kontrola.rows[0]));

    const r = await p.query(`
        SELECT _id, name, alias, "categoryName", "userAlias", "isActive",
               jsonb_array_length(COALESCE(photos, '[]'::jsonb)) AS broj
        FROM gallery
        WHERE (date IS NULL OR date::text = '' OR date::text = '0')
          AND (published IS NULL OR published::text = '' OR published::text = '0')
        ORDER BY name
    `);
    console.log(JSON.stringify(r.rows));
    await p.end();
})().catch((e) => { console.error('GRESKA:', e.message); process.exit(1); });
