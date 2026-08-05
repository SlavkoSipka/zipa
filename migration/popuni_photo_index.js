/*
 * Popunjava `photo_index` u serijama po galerijama.
 *
 * Jedan upit nad svih 202.411 fotografija Supabase prekine po isteku vremena,
 * pa se ide galerija po galerija — sporije, ali prolazi i može da se nastavi
 * ako pukne veza.
 */
require('dotenv').config({ quiet: true });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 0,
});

const SERIJA = 100;

(async () => {
    const k = await pool.connect();
    await k.query('set default_transaction_read_only = off');
    await k.query('set statement_timeout = 0');

    const { rows: sve } = await k.query('select "_id" from gallery order by "_id"');
    console.log(`galerija: ${sve.length}`);

    const pocetak = Date.now();
    let obradjeno = 0;

    for (let i = 0; i < sve.length; i += SERIJA) {
        const grupa = sve.slice(i, i + SERIJA).map((g) => g._id);

        await k.query('begin');
        await k.query('delete from photo_index where "galleryId" = any($1)', [grupa]);
        await k.query(
            `insert into photo_index
                 ("galleryId", idx, image, name, location, date, "isActive", tsv)
             select r.* from gallery g, photo_index_rows(g) r where g."_id" = any($1)`,
            [grupa]
        );
        await k.query('commit');

        obradjeno += grupa.length;
        if (obradjeno % 1000 === 0 || obradjeno === sve.length) {
            const proteklo = (Date.now() - pocetak) / 1000;
            const brzina = obradjeno / proteklo;
            const preostalo = Math.round((sve.length - obradjeno) / brzina);
            console.log(
                `  ${obradjeno}/${sve.length} · ${proteklo.toFixed(0)}s · još ~${preostalo}s`
            );
        }
    }

    // Indeksi se prave tek sada — nad punom tabelom je brže nego održavati ih
    // kroz 202.411 pojedinačnih upisa.
    console.log('pravim indekse…');
    await k.query('create index if not exists photo_index_fts_idx on photo_index using gin (tsv)');
    await k.query('create index if not exists photo_index_date_idx on photo_index (date desc nulls last)');
    await k.query('create index if not exists photo_index_gallery_idx on photo_index ("galleryId")');

    await k.query('analyze photo_index');

    const { rows } = await k.query(
        `select count(*) as fotografija,
                pg_size_pretty(pg_total_relation_size('photo_index')) as tabela_sa_indeksima,
                pg_size_pretty(pg_database_size(current_database())) as cela_baza
           from photo_index`
    );
    console.table(rows);
    k.release();
    await pool.end();
    console.log('gotovo');
})().catch((e) => {
    console.error('GREŠKA:', e.message);
    process.exit(1);
});
