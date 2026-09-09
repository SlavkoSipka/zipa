const fs = require('fs');
const constants = require('./constants');
const ObjectID = require('../objectid');
const slike = require('./slike');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const fetch = require('node-fetch');
var webp = require('webp-converter');
var easyimage = require('easyimage');
const archiver = require('archiver');

let db;
const dbConnect = require('../db');
const exec = require('child_process').exec;
const { lstatSync, readdirSync } = require('fs')
const { join } = require('path')
const sendMail = require('../sendMail');
const { API_ENDPOINT, SITE_URL } = require('../constants');


function generateAlias(str) {
    str = str.toLowerCase();
    str = str.replace(/ä/g, 'a');
    str = str.replace(/ö/g, 'o');
    str = str.replace(/ü/g, 'u');
    str = str.replace(/ß/g, 'b');
    str = str.replace(/č/g, 'c');
    str = str.replace(/ć/g, 'c');
    str = str.replace(/ž/g, 'z');
    str = str.replace(/đ/g, 'dj');
    str = str.replace(/š/g, 's');

    str = str.replace(/[^a-zA-Z0-9]/gi, '-').toLowerCase()
    str = str.replace(/-+/g, '-');

    return str;
}


const isDirectory = source => lstatSync(source).isDirectory()
const getDirectories = source =>
    readdirSync(source).map(name => join(source, name)).filter(isDirectory)

function zipDirectory(source, out) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(out);

    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on('error', err => reject(err))
            .pipe(stream)
            ;

        stream.on('close', () => resolve());
        archive.finalize();
    });
}

function mongoDump(filename) {

    return new Promise((resolve) => {
        exec(`mongodump --db zipa_db --gzip --archive=/zipa-data/backend/${filename}`, (err, stdout, stderr) => {
            console.log(stdout);

            console.log(stderr);
            resolve();
        })
    })
}


dbConnect()
    .then((conn) => {
        db = conn;
    })
    .catch((e) => {
        console.log('DB error')
    })
class Admin {
    constructor(props) {

    }

    /**
     * Broj postavljenih galerija i fotografija po fotografu, poređano od
     * najviše postavljenih.
     *
     * Radi se jednim upitom nad bazom: kroz Mongo-stil agregaciju bi se za
     * svakog fotografa učitale sve njegove galerije zajedno sa `photos`
     * nizovima (kod najplodnijih preko 150.000 fotografija) samo da bi se
     * prebrojale — zbog toga je statistika ranije znala da traje minutima.
     *
     * @param {number} [from] početak perioda (unix), opciono
     * @param {number} [to]   kraj perioda (unix), opciono
     */
    async photographerUploadStats(from = null, to = null) {
        const params = [];
        let periodCondition = '';
        if (from !== null && to !== null) {
            params.push(from, to);
            periodCondition = ' and g."published" >= $1 and g."published" < $2';
        }

        const result = await db.query(`
            select u."_id", u."userAlias", u."name",
                   count(g."_id")::int as "uploadedGalleryCount",
                   coalesce(sum(jsonb_array_length(g."photos")), 0)::int as "uploadedPhotosCount"
              from users u
              left join gallery g
                     on g."uid" = u."_id" and g."photos" is not null${periodCondition}
             where u."userRole" = 'photographer'
             group by u."_id", u."userAlias", u."name"
             order by "uploadedPhotosCount" desc, u."name" asc
        `, params);

        return result.rows;
    }

    async bannerClick(url, bannerId = null) {
        await db.collection('bannerClicks').insertOne({
            url: url,
            bannerId: bannerId,
            timestamp: Math.floor(new Date().getTime() / 1000)
        });
        return;
    }

    /**
     * Pregledi fotografija po galerijama za zadati period.
     *
     * Vraća galerije poređane od najgledanije, a unutar svake fotografije
     * takođe od najgledanije. Uz svaku fotografiju ide i putanja do slike,
     * da bi se u izveštaju videla sličica — ranije je nedostajala, pa su
     * u tabeli stajali prazni okviri. Naziv galerije se uzima iz same
     * galerije; ranije se čitao sa pogrešnog mesta pa je ostajao prazan.
     */
    async galleryVisitStats(from, to) {
        const result = await db.query(`
            with pregledi as (
                select v."doc"->>'galleryId'      as gallery_id,
                       v."doc"->'photo'->>'name'  as photo_name,
                       v."doc"->'photo'->>'image' as photo_image,
                       count(*)::int              as visits
                  from "photoVisits" v
                 where (v."doc"->>'timestamp')::bigint between $1 and $2
                   and v."doc"->>'galleryId' is not null
                 group by 1, 2, 3
            )
            select p.gallery_id as "_id",
                   coalesce(g."name"->>'ba', g."name"->>'en') as name,
                   sum(p.visits)::int as visits,
                   jsonb_agg(
                       jsonb_build_object('name', p.photo_name, 'image', p.photo_image, 'visits', p.visits)
                       order by p.visits desc
                   ) as photos
              from pregledi p
              left join gallery g on g."_id" = p.gallery_id
             group by p.gallery_id, g."name"
             order by visits desc
        `, [from, to]);

        return result.rows;
    }

    /**
     * Klikovi na banere za zadati period.
     *
     * Ista adresa je beležena u više oblika — sa i bez `www`, sa `http` i
     * `https`, sa završnom kosom crtom i bez nje — pa se jedan te isti baner
     * pojavljivao kao nekoliko zasebnih stavki sa manjim brojem klikova.
     * Zato se adrese ovde svode na isti oblik i sabiraju.
     *
     * Broji se svaki klik (ne jedinstveni posetilac), jer se posetilac ne
     * beleži. Klikovi na banere bez linka grupišu se posebno.
     */
    async bannerClickStats(from, to) {
        const result = await db.query(`
            select case
                     when coalesce(nullif(trim("url"), ''), '') = '' then '(baner bez linka)'
                     else regexp_replace(
                            regexp_replace(lower(trim("url")), '^(https?://)?(www\\.)?', ''),
                            '/+$', '')
                   end as url,
                   count(*)::int as count
              from "bannerClicks"
             where "timestamp" >= $1 and "timestamp" <= $2
             group by 1
             order by count desc
        `, [from, to]);

        return result.rows;
    }

    async statistics(from = null, to = null) {
        let res = {
            photosCount: 0,
            photographersCount: 0,
            todayEarnings: 0,
            yesterdayEarnings: 0,
            prevMonthEarnings: 0,
            currentMonthEarnings: 0,
            totalDownloads: await db.collection('downloads').countDocuments(),
            todayDownloads: 0,
            visitsPerDay: [],
            todayVisits: [],
            lastTransactions: [],
            photographers: [],
            bannerClicks: [],
            galleryVisits: []
        };

        let startTimestamp = from;
        let endTimestamp = to;

        /*
         * Do sada je `photosCount` bio BROJ GALERIJA, a ploča ga je prikazivala
         * kao „Fotografija u arhivi" — 9.694 umesto 202.411, dvadeset puta manje.
         * Sada se vraćaju oba broja, svaki pod svojim imenom.
         */
        const arhivaBrojevi = await db.query(
            `select count(*)::int                                        as galerija,
                    coalesce(sum(jsonb_array_length(
                        coalesce("photos", '[]'::jsonb)))::int, 0)       as fotografija
               from gallery
              where "isActive" = true and coalesce("userDisabled", false) = false`
        );
        res.galleriesCount = arhivaBrojevi.rows[0].galerija;
        res.photosCount    = arhivaBrojevi.rows[0].fotografija;

        res.photographersCount = await db.collection('users').countDocuments({ userRole: 'photographer', accountEnabled: true });

        let today = new Date();
        let todayTimestamp = new Date();
        todayTimestamp.setHours(0, 0, 0, 0);
        todayTimestamp = Math.floor(todayTimestamp.getTime() / 1000);

        let todayDownloads = await db.collection('downloads').countDocuments({ timestamp: { $gte: todayTimestamp, $lt: todayTimestamp + 24 * 60 * 60 } });
        res.todayDownloads = todayDownloads;

        res.todayEarnings = await this.calculateEarnings(todayTimestamp, todayTimestamp + 24 * 60 * 60);

        let yesterdayTimestamp = todayTimestamp - 24 * 60 * 60;
        res.yesterdayEarnings = await this.calculateEarnings(yesterdayTimestamp, todayTimestamp);

        let startOfMonth = new Date(todayTimestamp * 1000);
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        let startOfMonthTimestamp = Math.floor(startOfMonth.getTime() / 1000);
        res.currentMonthEarnings = await this.calculateEarnings(startOfMonthTimestamp, todayTimestamp + 24 * 60 * 60);

        let startOfPrevMonth = new Date(startOfMonth);
        startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
        let startOfPrevMonthTimestamp = Math.floor(startOfPrevMonth.getTime() / 1000);
        let endOfPrevMonthTimestamp = startOfMonthTimestamp;
        res.prevMonthEarnings = await this.calculateEarnings(startOfPrevMonthTimestamp, endOfPrevMonthTimestamp);

        let pipeline = [
            {
                $match: {
                    timestamp: { $gte: startTimestamp, $lte: endTimestamp }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: { $multiply: ["$timestamp", 1000] } } } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ];

        if (!from && !to) {
            const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const tenDaysAgo = new Date(todayMidnight);
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 9);

            pipeline[0].$match.timestamp = { $gte: tenDaysAgo.getTime() / 1000, $lt: todayMidnight.getTime() / 1000 + 24 * 60 * 60 };
        }

        const visitsPerDay = await db.collection("logs").aggregate(pipeline).toArray();

        res.visitsPerDay = visitsPerDay.map(({ _id, count }) => ({ timestamp: new Date(_id).getTime() / 1000, count }));

        let todayVisits = await db.collection('logs').aggregate([
            { $match: { timestamp: { $gte: todayTimestamp, $lt: todayTimestamp + 24 * 60 * 60 } } },
            { $group: { _id: "$url", count: { $sum: 1 } } }
        ]).toArray();
        res.todayVisits = todayVisits.map(item => ({ url: item._id, count: item.count }));
        res.todayVisitsCount = todayVisits.reduce((acc, curr) => acc + curr.count, 0);

        let lastDownloads = await db.collection('downloads').find({ transactionId: { $ne: null } }).sort({ timestamp: -1 }).limit(4).toArray();
        for (let download of lastDownloads) {
            let transaction = await db.collection('transactions').findOne({ _id: ObjectID(download.transactionId) });
            let user = await db.collection('users').findOne({ _id: ObjectID(download.uid) });
            if (transaction && user) {
                res.lastTransactions.push({
                    transaction: transaction,
                    user: {
                        _id: user._id,
                        name: user.name,
                        userAlias: user.userAlias,
                        userRole: user.userRole,
                        profilePhoto: user.profilePhoto
                    }
                });
            }
        }

        res.photographers = await this.photographerUploadStats();

        if (from && to) {
            res.bannerClicks = await this.bannerClickStats(from, to);
        }

        if (!startTimestamp || !endTimestamp) {
            const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
            startTimestamp = Math.floor(fiveDaysAgo.getTime() / 1000);

            endTimestamp = Math.floor(Date.now() / 1000);
        }

        res.galleryVisits = await this.galleryVisitStats(startTimestamp, endTimestamp);

        return res;
    }


    /**
     * Pregled arhive od početka rada do danas, po godinama.
     *
     * Klijent je tražio uvid „od postavljanja sajta do danas, posebno za
     * posete". Evidencija poseta nije stigla u bazi koju smo preuzeli od
     * dosadašnjeg izvođača — došle su galerije, korisnici, kategorije i
     * klikovi na banere, ali ne i istorija poseta; beleženje radi tek od
     * preuzimanja sajta nadalje.
     *
     * Ono što jeste dostupno od prvog dana jeste rast same arhive: kada je
     * koja galerija snimljena, koliko nosi fotografija i koji ih je fotograf
     * napravio. Za foto-agenciju je to i korisniji podatak od broja poseta.
     */
    /*
     * NADZORNA PLOČA — /admin/dashboard
     *
     * Zasebna, LAGANA ruta. Namerno se ne zove `statistics()`: taj poziv traje
     * 1,6–2,4 s, radi desetak upita i vraća paket od kog ploča koristi mali
     * deo (vidi `docs/admin-popis.md`, 3.2 i 5.9).
     *
     * Svaki podatak ovde ima naveden izvor. Ničega izmišljenog nema — ako
     * izvor ne postoji, polje se ne vraća i ploča crta prazno stanje.
     *
     * `dana` bira period: 7, 30 ili 365.
     */
    async dashboard(dana = 30) {
        const raspon = [7, 30, 365].indexOf(Number(dana)) !== -1 ? Number(dana) : 30;
        const sada = Math.floor(Date.now() / 1000);
        const od = sada - raspon * 86400;
        const odPrethodnog = od - raspon * 86400;   // isti tako dug period pre ovog

        /* ── ključni brojevi ──────────────────────────────────────────────
         * Izvor: tabela `gallery` (9.965 redova) i `users`. Dva `count`-a i
         * jedan `sum` nad `jsonb_array_length` — isti upit koji već radi
         * `archiveStats()`, pa je poznato da traje ispod sekunde.
         */
        const arhiva = await db.query(
            `select count(*)::int                                        as galerija,
                    coalesce(sum(jsonb_array_length(
                        coalesce("photos", '[]'::jsonb)))::int, 0)       as fotografija
               from gallery`
        );

        const korisnici = await db.query(
            `select count(*)::int as ukupno,
                    count(*) filter (where "userRole" = 'photographer')::int as fotografa
               from users`
        );

        /* ── posete po danima ─────────────────────────────────────────────
         * Izvor: tabela `logs` (doc-mode, `doc->>'timestamp'`). Beleženje radi
         * tek od 13.07.2026 — starije istorije NEMA, i to ploča i kaže.
         */
        const posete = await db.query(
            `select to_char(to_timestamp((doc->>'timestamp')::bigint), 'YYYY-MM-DD') as dan,
                    count(*)::int                                                    as broj
               from logs
              where (doc->>'timestamp')::bigint >= $1
              group by 1
              order by 1`,
            [od]
        );

        // Za poređenje sa prethodnim jednako dugim periodom.
        const posetePoredjenje = await db.query(
            `select count(*) filter (where (doc->>'timestamp')::bigint >= $1)::int                                as sada,
                    count(*) filter (where (doc->>'timestamp')::bigint >= $2
                                       and (doc->>'timestamp')::bigint <  $1)::int                                as prethodno,
                    min((doc->>'timestamp')::bigint)::bigint                                                      as najstarije
               from logs`,
            [od, odPrethodnog]
        );

        // Posete danas — od ponoći po serverskom vremenu.
        const ponoc = Math.floor(new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 1000);
        const danas = await db.query(
            `select count(*)::int as broj from logs where (doc->>'timestamp')::bigint >= $1`,
            [ponoc]
        );

        /* ── preuzimanja ──────────────────────────────────────────────────
         * Izvor: tabela `downloads`. UPOZORENJE: ima svega 10 redova, poslednji
         * iz 2024. Vraća se i `najnovije`, da ploča može da kaže koliko je
         * podatak star umesto da prikaže nulu bez objašnjenja.
         */
        const preuzimanja = await db.query(
            `select count(*)::int                                                   as ukupno,
                    count(*) filter (where "timestamp" >= $1)::int                  as "uPeriodu",
                    count(*) filter (where "timestamp" >= $2 and "timestamp" < $1)::int as prethodno,
                    max("timestamp")::bigint                                        as najnovije
               from downloads`,
            [od, odPrethodnog]
        );

        /* ── kategorije po posetama ───────────────────────────────────────
         * Izvor: `logs`, adrese sa `category=`. Danas ih ima svega 12 u 45
         * dana, pa se uz podatak vraća i UKUPAN broj — ploča sama odlučuje da
         * li ga uopšte ima smisla crtati.
         */
        const kategorije = await db.query(
            `select substring(doc->>'url' from 'category=([^&]+)') as alias,
                    count(*)::int                                  as broj
               from logs
              where doc->>'url' like '%category=%'
                and (doc->>'timestamp')::bigint >= $1
              group by 1
              having substring(doc->>'url' from 'category=([^&]+)') is not null
              order by broj desc
              limit 8`,
            [od]
        );

        /* ── najaktivniji fotografi ───────────────────────────────────────
         * Izvor: `gallery."user"` — isti upit koji već koristi `archiveStats()`.
         * Meri VELIČINU DOPRINOSA arhivi, ne posete.
         */
        const fotografi = await db.query(
            `select g."user"                                             as ime,
                    count(*)::int                                        as galerija,
                    coalesce(sum(jsonb_array_length(
                        coalesce(g."photos", '[]'::jsonb)))::int, 0)     as fotografija
               from gallery g
              where g."user" is not null and g."user" <> ''
              group by 1
              order by fotografija desc
              limit 8`
        );

        /* ── poslednje dodate galerije ────────────────────────────────────
         * Izvor: `gallery."published"`. Poslednja u arhivi je iz maja 2026.
         */
        const poslednje = await db.query(
            `select "_id", "name", "user", "published",
                    jsonb_array_length(coalesce("photos", '[]'::jsonb))::int as fotografija
               from gallery
              where "published" is not null
              order by "published" desc
              limit 6`
        );

        return {
            raspon,
            ukupno: {
                galerija:    arhiva.rows[0].galerija,
                fotografija: arhiva.rows[0].fotografija,
                korisnika:   korisnici.rows[0].ukupno,
                fotografa:   korisnici.rows[0].fotografa,
            },
            posete: {
                poDanima:   posete.rows,
                uPeriodu:   posetePoredjenje.rows[0].sada,
                prethodno:  posetePoredjenje.rows[0].prethodno,
                najstarije: posetePoredjenje.rows[0].najstarije,
                danas:      danas.rows[0].broj,

                /*
                 * Da li poređenje sa prethodnim periodom UOPŠTE nešto znači.
                 *
                 * Beleženje poseta radi tek od 13.07.2026 — starije istorije
                 * nema. Za period od 30 dana prethodni prozor pada pre tog
                 * datuma, pa bi „porast" ispao +4.600%, što nije rast nego
                 * početak merenja. Ploča zato prikazuje promenu SAMO kad je
                 * ceo prethodni prozor pokriven podacima.
                 */
                poredjenjeMoguce: posetePoredjenje.rows[0].najstarije != null
                    && Number(posetePoredjenje.rows[0].najstarije) <= odPrethodnog,
            },
            preuzimanja: preuzimanja.rows[0],
            kategorije:  kategorije.rows,
            fotografi:   fotografi.rows,
            poslednje:   poslednje.rows,
        };
    }

    async archiveStats() {
        const godine = await db.query(
            `select extract(year from to_timestamp(g."date"))::int   as godina,
                    count(*)::int                                    as galerija,
                    coalesce(sum(jsonb_array_length(
                        coalesce(g."photos", '[]'::jsonb)))::int, 0) as fotografija,
                    count(distinct g."user")::int                    as fotografa
               from gallery g
              where g."date" is not null and g."date" > 0
                and to_timestamp(g."date") <= now()
              group by 1
              order by 1`
        );

        const ukupno = await db.query(
            `select count(*)::int                                    as galerija,
                    coalesce(sum(jsonb_array_length(
                        coalesce("photos", '[]'::jsonb)))::int, 0)   as fotografija,
                    count(distinct "user")::int                      as fotografa,
                    to_char(to_timestamp(min("date")), 'DD.MM.YYYY.') as prva,
                    to_char(to_timestamp(max("date")), 'DD.MM.YYYY.') as poslednja
               from gallery
              where "date" is not null and "date" > 0`
        );

        const fotografi = await db.query(
            `select g."user"                                         as ime,
                    count(*)::int                                    as galerija,
                    coalesce(sum(jsonb_array_length(
                        coalesce(g."photos", '[]'::jsonb)))::int, 0) as fotografija
               from gallery g
              where g."user" is not null and g."user" <> ''
              group by 1
              order by fotografija desc
              limit 15`
        );

        return {
            godine: godine.rows,
            ukupno: ukupno.rows[0] || {},
            fotografi: fotografi.rows
        };
    }

    async statisticsFromDateRange(from, to) {
        if (!to) {
            to = Math.floor(Date.now() / 1000);
        }

        let res = {
            photosCount: 0,
            photographersCount: 0,
            todayEarnings: 0,
            yesterdayEarnings: 0,
            prevMonthEarnings: 0,
            currentMonthEarnings: 0,
            totalDownloads: await db.collection('downloads').countDocuments(),
            todayDownloads: 0,
            visitsPerDay: [],
            todayVisits: [],
            lastTransactions: [],
            photographers: [],
            bannerClicks: [],
            galleryVisits: []
        };

        const startTimestamp = from || (to - 5 * 24 * 60 * 60);
        const endTimestamp = to;

        /*
         * Do sada je `photosCount` bio BROJ GALERIJA, a ploča ga je prikazivala
         * kao „Fotografija u arhivi" — 9.694 umesto 202.411, dvadeset puta manje.
         * Sada se vraćaju oba broja, svaki pod svojim imenom.
         */
        const arhivaBrojevi = await db.query(
            `select count(*)::int                                        as galerija,
                    coalesce(sum(jsonb_array_length(
                        coalesce("photos", '[]'::jsonb)))::int, 0)       as fotografija
               from gallery
              where "isActive" = true and coalesce("userDisabled", false) = false`
        );
        res.galleriesCount = arhivaBrojevi.rows[0].galerija;
        res.photosCount    = arhivaBrojevi.rows[0].fotografija;

        res.photographersCount = await db.collection('users').countDocuments({ userRole: 'photographer', accountEnabled: true });

        res.todayDownloads = await db.collection('downloads').countDocuments({ timestamp: { $gte: startTimestamp, $lt: endTimestamp } });

        res.todayEarnings = await this.calculateEarnings(startTimestamp, endTimestamp);

        const fromDate = new Date(startTimestamp * 1000);
        const toDate = new Date(endTimestamp * 1000);
        const oneDayDifference = (toDate - fromDate) / (1000 * 60 * 60 * 24) === 1;

        if (oneDayDifference) {
            const logs = await db.collection('logs').find({ timestamp: { $gte: startTimestamp, $lt: endTimestamp } }).toArray();

            const timeIncrement = 3600; // 1 hour in seconds
            const visitsPerTimeIncrement = {};
            for (let log of logs) {
                const timestamp = Math.floor(log.timestamp / timeIncrement) * timeIncrement;
                if (!visitsPerTimeIncrement[timestamp]) {
                    visitsPerTimeIncrement[timestamp] = 1;
                } else {
                    visitsPerTimeIncrement[timestamp]++;
                }
            }

            res.visitsPerDay = Object.entries(visitsPerTimeIncrement).map(([timestamp, count]) => ({ timestamp: parseInt(timestamp), count }));

            res.todayVisits = Object.entries(visitsPerTimeIncrement).map(([timestamp, count]) => ({ timestamp: parseInt(timestamp), count }));
            res.todayVisitsCount = Object.values(visitsPerTimeIncrement).reduce((acc, curr) => acc + curr, 0);
        } else {
            let pipeline = [
                {
                    $match: {
                        timestamp: { $gte: startTimestamp, $lte: endTimestamp }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: { $multiply: ["$timestamp", 1000] } } } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ];

            const visitsPerDay = await db.collection("logs").aggregate(pipeline).toArray();
            res.visitsPerDay = visitsPerDay.map(({ _id, count }) => ({ timestamp: new Date(_id).getTime() / 1000, count }));

            let todayVisits = await db.collection('logs').aggregate([
                { $match: { timestamp: { $gte: startTimestamp, $lt: endTimestamp } } },
                { $group: { _id: "$url", count: { $sum: 1 } } }
            ]).toArray();
            res.todayVisits = todayVisits.map(item => ({ url: item._id, count: item.count }));
            res.todayVisitsCount = todayVisits.reduce((acc, curr) => acc + curr.count, 0);
        }

        let lastDownloads = await db.collection('downloads').find({ transactionId: { $ne: null } }).sort({ timestamp: -1 }).limit(4).toArray();
        for (let download of lastDownloads) {
            let transaction = await db.collection('transactions').findOne({ _id: ObjectID(download.transactionId) });
            let user = await db.collection('users').findOne({ _id: ObjectID(download.uid) });
            if (transaction && user) {
                res.lastTransactions.push({
                    transaction: transaction,
                    user: {
                        _id: user._id,
                        name: user.name,
                        userAlias: user.userAlias,
                        userRole: user.userRole,
                        profilePhoto: user.profilePhoto
                    }
                });
            }
        }

        res.photographers = await this.photographerUploadStats(startTimestamp, endTimestamp);

        if (from && to) {
            res.bannerClicks = await this.bannerClickStats(from, to);
        }

        res.galleryVisits = await this.galleryVisitStats(startTimestamp, endTimestamp);

        return res;
    }

    async statisticsExportWithDate(from, to) {
        if (!to) {
            to = Math.floor(Date.now() / 1000);
        }

        let res = {
            photosCount: 0,
            photographersCount: 0,
            todayEarnings: 0,
            yesterdayEarnings: 0,
            prevMonthEarnings: 0,
            currentMonthEarnings: 0,
            totalDownloads: await db.collection('downloads').countDocuments(),
            todayDownloads: 0,
            visitsPerDay: [],
            todayVisits: [],
            lastTransactions: [],
            photographers: [],
            bannerClicks: [],
            galleryVisits: []
        };

        const startTimestamp = from || (to - 5 * 24 * 60 * 60);
        const endTimestamp = to;

        /*
         * Do sada je `photosCount` bio BROJ GALERIJA, a ploča ga je prikazivala
         * kao „Fotografija u arhivi" — 9.694 umesto 202.411, dvadeset puta manje.
         * Sada se vraćaju oba broja, svaki pod svojim imenom.
         */
        const arhivaBrojevi = await db.query(
            `select count(*)::int                                        as galerija,
                    coalesce(sum(jsonb_array_length(
                        coalesce("photos", '[]'::jsonb)))::int, 0)       as fotografija
               from gallery
              where "isActive" = true and coalesce("userDisabled", false) = false`
        );
        res.galleriesCount = arhivaBrojevi.rows[0].galerija;
        res.photosCount    = arhivaBrojevi.rows[0].fotografija;

        res.photographersCount = await db.collection('users').countDocuments({ userRole: 'photographer', accountEnabled: true });

        res.todayDownloads = await db.collection('downloads').countDocuments({ timestamp: { $gte: startTimestamp, $lt: endTimestamp } });

        res.todayEarnings = await this.calculateEarnings(startTimestamp, endTimestamp);

        const fromDate = new Date(startTimestamp * 1000);
        const toDate = new Date(endTimestamp * 1000);
        const oneDayDifference = (toDate - fromDate) / (1000 * 60 * 60 * 24) === 1;

        if (oneDayDifference) {
            const logs = await db.collection('logs').find({ timestamp: { $gte: startTimestamp, $lt: endTimestamp } }).toArray();

            const timeIncrement = 3600; // 1 hour in seconds
            const visitsPerTimeIncrement = {};
            for (let log of logs) {
                const timestamp = Math.floor(log.timestamp / timeIncrement) * timeIncrement;
                if (!visitsPerTimeIncrement[timestamp]) {
                    visitsPerTimeIncrement[timestamp] = 1;
                } else {
                    visitsPerTimeIncrement[timestamp]++;
                }
            }

            res.visitsPerDay = Object.entries(visitsPerTimeIncrement).map(([timestamp, count]) => ({ timestamp: parseInt(timestamp), count }));

            res.todayVisits = Object.entries(visitsPerTimeIncrement).map(([timestamp, count]) => ({ timestamp: parseInt(timestamp), count }));
            res.todayVisitsCount = Object.values(visitsPerTimeIncrement).reduce((acc, curr) => acc + curr, 0);
        } else {
            let pipeline = [
                {
                    $match: {
                        timestamp: { $gte: startTimestamp, $lte: endTimestamp }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: { $multiply: ["$timestamp", 1000] } } } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ];

            const visitsPerDay = await db.collection("logs").aggregate(pipeline).toArray();
            res.visitsPerDay = visitsPerDay.map(({ _id, count }) => ({ timestamp: new Date(_id).getTime() / 1000, count }));

            let todayVisits = await db.collection('logs').aggregate([
                { $match: { timestamp: { $gte: startTimestamp, $lt: endTimestamp } } },
                { $group: { _id: "$url", count: { $sum: 1 } } }
            ]).toArray();
            res.todayVisits = todayVisits.map(item => ({ url: item._id, count: item.count }));
            res.todayVisitsCount = todayVisits.reduce((acc, curr) => acc + curr.count, 0);
        }

        let lastDownloads = await db.collection('downloads').find({ transactionId: { $ne: null } }).sort({ timestamp: -1 }).limit(4).toArray();
        for (let download of lastDownloads) {
            let transaction = await db.collection('transactions').findOne({ _id: ObjectID(download.transactionId) });
            let user = await db.collection('users').findOne({ _id: ObjectID(download.uid) });
            if (transaction && user) {
                res.lastTransactions.push({
                    transaction: transaction,
                    user: {
                        _id: user._id,
                        name: user.name,
                        userAlias: user.userAlias,
                        userRole: user.userRole,
                        profilePhoto: user.profilePhoto
                    }
                });
            }
        }

        res.photographers = await this.photographerUploadStats(startTimestamp, endTimestamp);

        if (from && to) {
            res.bannerClicks = await this.bannerClickStats(from, to);
        }

        res.galleryVisits = await this.galleryVisitStats(startTimestamp, endTimestamp);
        console.log('RESPONSE : ', res)

        return res;
    }

    async calculateEarnings(startTime, endTime) {
        let downloads = await db.collection('downloads').find({ timestamp: { $gte: startTime, $lt: endTime }, transactionId: { $ne: null } }).toArray();
        let totalEarnings = 0;
        for (let download of downloads) {
            let transaction = await db.collection('transactions').findOne({ _id: ObjectID(download.transactionId) });
            if (transaction) {
                totalEarnings += parseFloat(transaction.transaction.purchase_units[0].amount.total);
            }
        }
        return totalEarnings;
    }

    async deleteOriginals(from, to) {

        let gallery = await db.collection('gallery').find({
            date: { $gte: from, $lte: to }
        }).toArray();

        for (let i = 0; i < gallery.length; i++) {
            try {
                if (gallery[i] && gallery[i].photos) {
                    for (let j = 0; j < gallery[i].photos.length; j++) {
                        fs.unlink(`./photos-store/originals/${gallery[i].photos[j].image}`);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }

        /*const dirs = getDirectories('./photos-store/originals');
        for (let i = 0; i < dirs.length; i++) {
            let directory = dirs[i];
            console.log(directory);
            fs.readdir(directory, (err, files) => {
                if (err) throw err;

                for (const file of files) {
                    fs.unlink(join(directory, file), err => {
                        if (err) throw err;
                    });
                }
            });
        }*/

        return {};

    }

    async downloadBackup(from, to) {
        const rnd = 'd31ixyFCevGK7zvPFrZvQtPucHqtKguEkPmJWz_SjWZOjMW2cz';
        let photosFilename = `/uploads/originals-backup-${rnd}.zip`;
        const mongoFilename = `/uploads/mongo-backup-${rnd}.gz`;
        //await zipDirectory('./photos-store/originals', '.' + photosFilename);
        await mongoDump(mongoFilename);

        var output = fs.createWriteStream('.' + photosFilename);
        var archive = archiver('zip', {
            gzip: true,
            zlib: { level: 9 } // Sets the compression level.
        });

        archive.on('error', function (err) {
            throw err;
        });

        // pipe archive data to the output file
        archive.pipe(output);

        // append files

        let gallery = await db.collection('gallery').find({
            date: { $gte: from, $lte: to }
        }).toArray();

        for (let i = 0; i < gallery.length; i++) {
            try {
                if (gallery[i] && gallery[i].photos) {
                    for (let j = 0; j < gallery[i].photos.length; j++) {
                        archive.file(`./photos-store/originals/${gallery[i].photos[j].image}`, { name: `./photos-store/originals/${gallery[i].photos[j].image}` });
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }



        //
        archive.finalize();




        return {
            photos: photosFilename,
            mongo: mongoFilename
        }
    }

    async setEmailVerified(uid, val) {

        await db.collection('users').updateOne({ _id: ObjectID(uid) }, {
            $set: {
                emailVerified: val == '0' ? false : true
            }
        });

        return {
            response: {
                error: null,
            },
            status: 200
        }

    }
    async setAccountEnabled(uid, val) {
        await db.collection('users').updateOne({ _id: ObjectID(uid) }, {
            $set: {
                accountEnabled: val == '0' ? false : true
            }
        });

        await db.collection('gallery').updateMany({
            uid: ObjectID(uid)

        }, {
            $set: {
                userDisabled: val == '0' ? true : false
            }
        })

        return {
            response: {
                error: null,
            },
            status: 200
        }
    }


    async importSubscribers(subscribers) {
        let arr = subscribers.split('\n');

        for (let i = 0; i < arr.length; i++) {
            await db.collection('subscribers').insertOne({ email: arr[i].trim() });
        }

        return {};
    }


    async fetchSettings() {
        let cat = await db.collection('settings').find({}).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    /*
     * Čuvanje podešavanja sajta.
     *
     * Do 2026-08-28 je ovde stajalo `deleteMany({})` pa `insertOne(data)` —
     * dakle ceo zapis se ZAMENJIVAO onim što obrazac pošalje. Sve što obrazac
     * ne prikazuje tiho je nestajalo pri svakom čuvanju:
     *
     *   priceOnRequestBefore — granica ispod koje galerija ide na „cijena na
     *                          upit" (`products.js`, `isPriceOnRequest`).
     *                          Brisanjem su SVE starije galerije odjednom
     *                          dobijale direktnu cenu.
     *   izdvojenoNaslov      — naslov odeljka „Izdvajamo" na sve tri naslovne.
     *
     * Dovoljno je bilo promeniti telefon da se to desi.
     *
     * Sada se postojeći zapis spaja sa novim — isti obrazac koji dva reda
     * niže već koristi prebacivanje žiga (`setWatermark`). Polja koja obrazac
     * ne šalje ostaju netaknuta.
     */
    async updateSettings(data) {
        const postojeca = await db.collection('settings').find({}).toArray();
        const staro = postojeca.length ? postojeca[0] : {};

        // `_id` se ne prenosi — novi zapis dobija svoj.
        const { _id, ...bezId } = staro;
        const spojeno = Object.assign({}, bezId, data);

        await db.collection('settings').deleteMany({});
        await db.collection('settings').insertOne(spojeno);

        return {
            response: {},
            status: 200
        }
    }

    async fetchSlide(id) {
        let cat = await db.collection('slides').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updateSlide(id, data) {
        let obj = data;

        if (id == 'new') {
            await db.collection('slides').insertOne({
                title: obj.title,
                content: obj.content,
                image: obj.image,
                position: obj.position ? parseInt(obj.position) : 0,
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('slides').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    title: obj.title,
                    content: obj.content,
                    image: obj.image,
                    position: obj.position ? parseInt(obj.position) : 0,
                }
            })
        }

        return {
            response: {},
            status: 200
        }

    }

    async allSlides() {
        let items = await db.collection('slides').find().sort({ position: 1 }).toArray();
        return items;
    }


    async deleteSlide(id) {
        await db.collection('slides').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }


    /* ── Izdvojeno na naslovnoj ───────────────────────────────────────────
     *
     * Odeljak „Izdvajamo": naslov i fotografija se biraju ručno, a klik vodi
     * na galeriju ili kategoriju koju agencija odredi. Zato ovo nije izvedeno
     * iz galerija nego se vodi zasebno, kao i slajdovi.
     */
    async fetchFeatured(id) {
        let red = await db.collection('featured').find({ _id: ObjectID(id) }).toArray();
        return red.length ? red[0] : {};
    }

    /*
     * Fotografija se cuva BEZ domacina.
     *
     * Ekran za unos salje punu adresu, onakvu kakvu vidi u trenutku unosa —
     * a to je adresa okoline u kojoj se radi. Nekoliko redova je tako upisano
     * dok se radilo lokalno i nose `http://localhost:10015`, pa se na
     * produkciji ne vide. Domacin se zato sece i cuva se samo `/photos/...`;
     * strana ga lepi na tekuci izvor slika. Adrese koje nisu iz naseg
     * skladista (nemaju `/photos/`) ostaju kakve jesu.
     */
    static beDomacina(adresa) {
        if (typeof adresa !== 'string') return adresa;
        const mesto = adresa.indexOf('/photos/');
        return mesto === -1 ? adresa : adresa.slice(mesto);
    }

    async updateFeatured(id, data) {
        const obj = data;
        const polja = {
            title: obj.title,
            image: Admin.beDomacina(obj.image),
            link: obj.link,
            position: obj.position ? parseInt(obj.position) : 0,
            isActive: obj.isActive === undefined ? true : !!obj.isActive
        };

        if (id == 'new') {
            await db.collection('featured').insertOne(
                Object.assign({}, polja, { published: Math.floor(new Date().getTime() / 1000) })
            );
        } else {
            await db.collection('featured').updateOne({ _id: ObjectID(id) }, { $set: polja });
        }

        return { response: {}, status: 200 };
    }

    // Za naslovnu — samo uključene stavke, redom koji je zadat.
    async allFeatured(samoAktivne = false) {
        const uslov = samoAktivne ? { isActive: true } : {};
        return await db.collection('featured').find(uslov).sort({ position: 1 }).toArray();
    }

    async deleteFeatured(id) {
        await db.collection('featured').deleteOne({ _id: ObjectID(id) });
        return { response: {}, status: 200 };
    }


    /* ── Video odeljak ────────────────────────────────────────────────────
     *
     * Snimci se ne postavljaju na naš server nego se povlače sa YouTube
     * kanala agencije — tako je dogovoreno. Ovde se čuva samo adresa i
     * naslov; sličicu YouTube nudi sam, pa se ne mora postavljati.
     */
    async fetchVideo(id) {
        let red = await db.collection('videos').find({ _id: ObjectID(id) }).toArray();
        return red.length ? red[0] : {};
    }

    // Iz adrese izvlači oznaku snimka, pa iz nje sličicu.
    slicicaSaYouTube(link) {
        if (!link) return null;
        const m = String(link).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
        return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : null;
    }

    async updateVideo(id, data) {
        const obj = data;
        const polja = {
            title: obj.title,
            link: obj.link,
            thumbnail: obj.thumbnail || this.slicicaSaYouTube(obj.link),
            position: obj.position ? parseInt(obj.position) : 0,
            isActive: obj.isActive === undefined ? true : !!obj.isActive
        };

        if (id == 'new') {
            await db.collection('videos').insertOne(
                Object.assign({}, polja, { published: Math.floor(new Date().getTime() / 1000) })
            );
        } else {
            await db.collection('videos').updateOne({ _id: ObjectID(id) }, { $set: polja });
        }

        return { response: {}, status: 200 };
    }

    async allVideos(samoAktivne = false) {
        const uslov = samoAktivne ? { isActive: true } : {};
        return await db.collection('videos').find(uslov).sort({ position: 1 }).toArray();
    }

    async deleteVideo(id) {
        await db.collection('videos').deleteOne({ _id: ObjectID(id) });
        return { response: {}, status: 200 };
    }


    /* ── Zbirka žigova ────────────────────────────────────────────────────
     *
     * Klijent je pitao može li sam povremeno menjati logotip na preglednim
     * fotografijama. Do sada je postojao samo jedan, u Podešavanjima sajta —
     * da bi ga promenio i vratio, morao bi svaki put ponovo da postavlja fajl.
     *
     * Ovde se čuva više žigova, a „uključi" samo prepisuje adresu izabranog u
     * `settings.watermark`. Time kod za postavljanje fotografija ostaje
     * netaknut — on i dalje čita jedno te isto polje.
     *
     * Važno: žig se ugrađuje u preglednu fotografiju u trenutku postavljanja,
     * pa promena važi za galerije postavljene od tada nadalje.
     */
    /*
     * Spisak zigova, uz onaj koji je STVARNO u upotrebi.
     *
     * Ukljucen zig ne stoji u `watermarks` nego u `settings.watermark` — a ta
     * vrednost je tu i pre nego sto je ova strana napravljena, jos iz starog
     * sajta. Kako u `watermarks` nema nijednog zapisa, strana je izgledala
     * prazno iako se fotografije uredno zigosu. Zato se zatecени zig dodaje
     * u spisak kao zapis, oznacen da nije sacuvan.
     *
     * Adresa se preslaguje na TEKUCI API: u podesavanjima stoji puna adresa
     * starog hosta (`zipa-api.novamedia.agency`), pa bi se pregled gasio cim
     * taj host padne. Sam fajl se ionako cita lokalno, iz `./uploads/`.
     */
    async allWatermarks() {
        const spisak = await db.collection('watermarks').find({}).sort({ published: -1 }).toArray();
        const podesavanja = await db.collection('settings').find({}).toArray();
        const trenutni = podesavanja.length ? podesavanja[0].watermark : null;

        const naNasAPI = (adresa) => {
            if (!adresa) return adresa;
            const ime = String(adresa).split('/').pop();
            return `${API_ENDPOINT}/uploads/${ime}`;
        };

        const rezultat = spisak.map((z) => Object.assign({}, z, {
            ukljucen: !!trenutni && z.image === trenutni,
            image: naNasAPI(z.image),
        }));

        if (trenutni && !rezultat.some((z) => z.ukljucen)) {
            const ime = String(trenutni).split('/').pop();
            rezultat.unshift({
                _id: 'zatecen',
                name: 'Žig koji je u upotrebi',
                image: naNasAPI(trenutni),
                ukljucen: true,
                zatecen: true,
                // Da li fajl uopste postoji na serveru — bez njega se
                // fotografije postavljaju BEZ ziga, tiho.
                fajlPostoji: fs.existsSync(`./uploads/${ime}`),
            });
        }

        return rezultat;
    }

    async updateWatermark(id, data) {
        const polja = { name: data.name, image: data.image };

        if (id == 'new') {
            await db.collection('watermarks').insertOne(
                Object.assign({}, polja, { published: Math.floor(new Date().getTime() / 1000) })
            );
        } else {
            await db.collection('watermarks').updateOne({ _id: ObjectID(id) }, { $set: polja });
        }
        return { response: {}, status: 200 };
    }

    // Uključi izabrani žig — prepisuje se u podešavanja, odakle ga čita
    // postavljanje fotografija.
    async activateWatermark(id) {
        const red = await db.collection('watermarks').find({ _id: ObjectID(id) }).toArray();
        if (!red.length || !red[0].image) {
            return { response: { error: 'nije nadjen' }, status: 404 };
        }

        const podesavanja = await db.collection('settings').find({}).toArray();
        if (!podesavanja.length) {
            return { response: { error: 'nema podesavanja' }, status: 400 };
        }

        const novo = Object.assign({}, podesavanja[0], { watermark: red[0].image });
        await db.collection('settings').deleteMany({});
        await db.collection('settings').insertOne(novo);

        return { response: {}, status: 200 };
    }

    async deleteWatermark(id) {
        // Onaj koji je trenutno uključen se ne briše — inače bi nove galerije
        // ostale bez žiga a da niko ne primeti.
        const red = await db.collection('watermarks').find({ _id: ObjectID(id) }).toArray();
        const podesavanja = await db.collection('settings').find({}).toArray();
        const trenutni = podesavanja.length ? podesavanja[0].watermark : null;

        if (red.length && trenutni && red[0].image === trenutni) {
            return {
                response: { error: 'Ovaj žig je trenutno uključen. Prvo uključite drugi, pa ga onda obrišite.' },
                status: 400
            };
        }

        await db.collection('watermarks').deleteOne({ _id: ObjectID(id) });
        return { response: {}, status: 200 };
    }





    async fetchFaqCategory(id) {
        let cat = await db.collection('faqCategories').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updateFaqCategory(id, data) {
        let obj = data;
        if (obj.name) {
            obj.alias = {};

            for (var key in obj.name) {
                if (obj.name.hasOwnProperty(key)) {
                    obj.alias[key] = generateAlias(obj.name[key]);
                }
            }
        }

        if (id == 'new') {
            await db.collection('faqCategories').insertOne({
                name: obj.name,
                alias: obj.alias,
                position: obj.position ? parseInt(obj.position) : 0,
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('faqCategories').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    name: obj.name,
                    alias: obj.alias,
                    position: obj.position ? parseInt(obj.position) : 0,
                }
            })
        }

        return {
            response: {},
            status: 200
        }
    }

    async allFaqCategories() {
        let items = await db.collection('faqCategories').find().sort({ position: 1 }).toArray();
        return items;
    }


    async deleteFaqCategory(id) {
        await db.collection('faqCategories').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }
    async allSubscribers() {
        let items = await db.collection('subscribers').find().toArray();
        return items;
    }


    async deleteSubscriber(id) {
        await db.collection('subscribers').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }


    async fetchFaq(id) {
        let cat = await db.collection('faq').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async faq(alias) {
        let query = {}
        query[`alias.ba`] = alias;
        let cat = await db.collection('faqCategories').findOne(query);

        if (cat) {
            cat.items = await db.collection('faq').find({ category: cat._id.toString() }).toArray();
            return cat;
        } else {
            return {
                items: []
            }
        }
    }


    async updateFaq(id, data) {
        let obj = data;
        if (obj.name) {
            obj.alias = {};

            for (var key in obj.name) {
                if (obj.name.hasOwnProperty(key)) {
                    obj.alias[key] = generateAlias(obj.name[key]);
                }
            }
        }

        if (id == 'new') {
            await db.collection('faq').insertOne({
                name: obj.name,
                alias: obj.alias,
                content: obj.content,
                category: obj.category,
                position: obj.position ? parseInt(obj.position) : 0,
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('faq').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    name: obj.name,
                    alias: obj.alias,
                    content: obj.content,
                    category: obj.category,
                    position: obj.position ? parseInt(obj.position) : 0,
                }
            })
        }

        return {
            response: {},
            status: 200
        }
    }

    async allFaq() {
        let items = await db.collection('faq').find().sort({ position: 1 }).toArray();
        return items;
    }


    async deleteFaq(id) {
        await db.collection('faq').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }
    async sendTestNewsletter(id) {
        let newsletter = await db.collection('newsletters').findOne({ _id: ObjectID(id) });
        if (!newsletter) {
            return;
        }


        let galleries = [];

        if (newsletter.galleries && newsletter.galleries.length) {
            galleries = await db.collection('gallery').find({ _id: { $in: newsletter.galleries.map(item => ObjectID(item)) } }).toArray();;
        }

        /*
         * PROBNO slanje NE menja status.
         *
         * Do 2026-08-28 je i ono upisivalo „Poslato", pa se u spisku nije
         * moglo razaznati šta je stvarno otišlo pretplatnicima a šta je samo
         * probano — od pet newslettera četiri su bila u tom stanju. Otkad
         * dugme za pravo slanje bude onemogućeno na „Poslato", ovo bi uz to
         * značilo i da se posle probe ne može poslati.
         */

        let emails = ['info@zipaphoto.net', 'zipaphoto@gmail.com', 'stanojevic.milan97@gmail.com'];
        // let emails = {};
        // for (let i = 0; i < subscribers.length; i++) {
        //     emails[subscribers[i].email] = subscribers[i].email;
        // }

        // emails = Object.keys(emails);


        let orderItemTemplate = fs.readFileSync('./emails/orderItem.html', 'utf-8');

        let itemsHTML = '';
        for (let i = 0; i < galleries.length; i++) {
            itemsHTML += String.format(orderItemTemplate, `${API_ENDPOINT}/photos/350x/` + encodeURI(galleries[i].photos[0].image), galleries[i].name.ba, galleries[i].description && galleries[i].description.ba ? galleries[i].description.ba : '', galleries[i].alias.ba, galleries[i]._id);
        }

        console.log(emails);


        // for (let i = 0; i < emails.length; i++) {
        //     sendMail(emails[i], newsletter.title.ba, String.format(fs.readFileSync('./emails/newsletter.html', 'utf-8'), newsletter.title.ba, newsletter.image ? `<img src="${newsletter.image}" style="max-width: 80%;" />` : '', newsletter.content ? newsletter.content : '', itemsHTML))
        // }

    }

    /*
     * Oznaka za odjavu.
     *
     * Veza za odjavu nosi adresu i ovu oznaku, izvedenu iz adrese i tajne
     * ključa. Bez nje bi svako mogao da odjavi tuđu adresu prostim pogađanjem
     * — dovoljno bi bilo znati mejl.
     */
    oznakaZaOdjavu(email) {
        const crypto = require('crypto');
        return crypto
            .createHmac('sha256', process.env.JWT_SECRET || 'zipa')
            .update(String(email).toLowerCase())
            .digest('hex')
            .slice(0, 20);
    }

    async odjaviPretplatnika(email, oznaka) {
        if (!email || !oznaka) return { response: { error: 'nepotpun zahtev' }, status: 400 };
        if (this.oznakaZaOdjavu(email) !== oznaka) {
            return { response: { error: 'neispravna veza' }, status: 403 };
        }

        /*
         * Zapis se NE BRISE nego se OZNACAVA.
         *
         * Ranije je odjava radila `deleteMany`, pa je adresa nestajala bez
         * traga: nije se moglo videti ko se odjavio ni kada, a ista osoba bi
         * se pri sledecem uvozu liste tiho vratila na spisak. Sada zapis
         * ostaje i nosi datum odjave; slanje ga preskace.
         *
         * MREZA ZA PAD: ako kolona `unsubscribedAt` jos ne postoji, sloj u
         * `db.js` tiho preskoci nepoznato polje i vrati `matchedCount: 0` —
         * odjava bi ispala kao da je prosla, a covek bi i dalje dobijao
         * poruke. Zato se ishod PROVERAVA, i kad upis ne prodje, vraca se na
         * staro ponasanje (brisanje). Bolje izgubiti podatak o odjavi nego
         * ne odjaviti coveka.
         */
        const adresa = String(email).toLowerCase();
        let oznaceno = 0;

        try {
            const ishod = await db.collection('subscribers').updateMany(
                { email: adresa },
                { $set: { unsubscribedAt: Math.floor(new Date().getTime() / 1000) } }
            );
            oznaceno = ishod && (ishod.matchedCount || 0);
        } catch (e) {
            console.error('[odjava] oznacavanje nije proslo:', e.message);
        }

        if (!oznaceno) {
            console.warn('[odjava] kolona `unsubscribedAt` ne postoji — brisem zapis, kao ranije');
            await db.collection('subscribers').deleteMany({ email: adresa });
        }

        return { response: { ok: true }, status: 200 };
    }

    /*
     * HTML jedne poruke — ISTI za pregled i za slanje.
     *
     * Do sada se poruka sastavljala samo unutar `sendNewsletter`, pa se pre
     * slanja nije imalo sta da se pogleda: „Pregled newslettera" u meniju je
     * vodio na stranu koja crta grafikon poseta, ne poruku.
     *
     * `adresa` sluzi samo za vezu za odjavu; u pregledu se salje primer.
     */
    async sastaviNewsletter(id, adresa = 'primjer@zipaphoto.net') {
        const newsletter = await db.collection('newsletters').findOne({ _id: ObjectID(id) });
        if (!newsletter) return null;

        let galleries = [];
        if (newsletter.galleries && newsletter.galleries.length) {
            galleries = await db.collection('gallery')
                .find({ _id: { $in: newsletter.galleries.map((item) => ObjectID(item)) } })
                .toArray();
        }

        const orderItemTemplate = fs.readFileSync('./emails/orderItem.html', 'utf-8');
        let itemsHTML = '';
        for (let i = 0; i < galleries.length; i++) {
            itemsHTML += String.format(
                orderItemTemplate,
                `${API_ENDPOINT}/photos/350x/` + encodeURI(galleries[i].photos[0].image),
                galleries[i].name.ba,
                galleries[i].description && galleries[i].description.ba ? galleries[i].description.ba : '',
                galleries[i].alias.ba,
                galleries[i]._id
            );
        }

        const predlozak = fs.readFileSync('./emails/newsletter.html', 'utf-8');
        const vezaOdjave =
            `${SITE_URL}/odjava?email=${encodeURIComponent(adresa)}&k=${this.oznakaZaOdjavu(adresa)}`;

        return {
            naslov: newsletter.title.ba,
            html: String.format(
                predlozak,
                newsletter.title.ba,
                newsletter.image ? `<img src="${newsletter.image}" style="max-width: 80%;" />` : '',
                newsletter.content ? newsletter.content : '',
                itemsHTML,
                vezaOdjave
            ),
            brojGalerija: galleries.length,
        };
    }

    async sendNewsletter(id) {
        let newsletter = await db.collection('newsletters').findOne({ _id: ObjectID(id) });
        if (!newsletter) {
            return;
        }


        let galleries = [];

        if (newsletter.galleries && newsletter.galleries.length) {
            galleries = await db.collection('gallery').find({ _id: { $in: newsletter.galleries.map(item => ObjectID(item)) } }).toArray();;
        }

        /*
         * Odjavljeni NE dobijaju poruku.
         *
         * Odjava vise ne brise zapis (vidi `odjaviPretplatnika`) nego mu
         * upisuje `unsubscribedAt`, da bi se znalo ko se i kada odjavio.
         * Zato se ovde takvi izostavljaju — bez ovoga bi im poruka i dalje
         * stizala.
         */
        let subscribers = (await db.collection('subscribers').find().toArray())
            .filter((p) => !p.unsubscribedAt);

        // Uz status se pamti i KADA je poslato i na koliko adresa — spisak je
        // do sada imao samo reč „Poslato", bez ijednog traga o slanju.
        await db.collection('newsletters').updateOne({ _id: ObjectID(id) }, {
            $set: {
                status: 'Poslato',
                sentAt: Math.floor(new Date().getTime() / 1000),
                sentCount: subscribers.length
            }
        });

        let emails = {};
        for (let i = 0; i < subscribers.length; i++) {
            emails[subscribers[i].email] = subscribers[i].email;
        }

        emails = Object.keys(emails);

        let orderItemTemplate = fs.readFileSync('./emails/orderItem.html', 'utf-8');

        let itemsHTML = '';
        for (let i = 0; i < galleries.length; i++) {
            itemsHTML += String.format(orderItemTemplate, `${API_ENDPOINT}/photos/350x/` + encodeURI(galleries[i].photos[0].image), galleries[i].name.ba, galleries[i].description && galleries[i].description.ba ? galleries[i].description.ba : '', galleries[i].alias.ba, galleries[i]._id);
        }


        const predlozak = fs.readFileSync('./emails/newsletter.html', 'utf-8');

        /*
         * Šalje se jedno po jedno, sa malim razmakom.
         *
         * Ranije je ceo spisak odlazio odjednom, bez čekanja: pri većem broju
         * pretplatnika to zna da zaguši poštanski server i da nas označi kao
         * nepoželjnog pošiljaoca. Pola sekunde između poruka je dovoljno.
         *
         * Svaka poruka nosi svoju vezu za odjavu — po adresi primaoca.
         */
        /*
         * Otkad `sendMail` vraća `Promise` koji se odbija na grešci (prelazak
         * na Resend, 2026-08-28), `catch` ispod stvarno hvata. Do tada je bio
         * mrtav kod: stara funkcija je koristila callback, pa je `await`
         * prolazio odmah i newsletter se označavao „Poslato" i kad nijedna
         * poruka nije otišla. Zato se sada broji šta je prošlo, i taj broj se
         * upisuje uz status.
         */
        let uspelo = 0;
        const neuspele = [];

        for (let i = 0; i < emails.length; i++) {
            const adresa = emails[i];
            const vezaOdjave =
                `${SITE_URL}/odjava?email=${encodeURIComponent(adresa)}&k=${this.oznakaZaOdjavu(adresa)}`;

            try {
                await sendMail(
                    adresa,
                    newsletter.title.ba,
                    String.format(
                        predlozak,
                        newsletter.title.ba,
                        newsletter.image ? `<img src="${newsletter.image}" style="max-width: 80%;" />` : '',
                        newsletter.content ? newsletter.content : '',
                        itemsHTML,
                        vezaOdjave
                    )
                );
                uspelo++;
            } catch (e) {
                // Jedna adresa koja ne prolazi ne sme da zaustavi ostale.
                neuspele.push(adresa);
                console.error('[newsletter] neuspelo slanje na', adresa, '-', e.message);
            }

            if (i < emails.length - 1) {
                await new Promise((r) => setTimeout(r, 500));
            }
        }

        /*
         * Stvarni ishod, ne pretpostavka. `sentCount` je gore upisan pre
         * slanja (koliko je pokušano); ovde se prepisuje na koliko je STVARNO
         * otišlo, i pamti se koliko nije. Ako nije prošlo ništa, status se
         * vraća na „Na čekanju" — inače bi spisak tvrdio da je poslato.
         */
        await db.collection('newsletters').updateOne({ _id: ObjectID(id) }, {
            $set: {
                status: uspelo ? 'Poslato' : 'Na čekanju',
                sentCount: uspelo,
                failedCount: neuspele.length
            }
        });

        console.log(`[newsletter] "${newsletter.title.ba}" — poslato ${uspelo}/${emails.length}` +
            (neuspele.length ? `, neuspelo ${neuspele.length}` : ''));
    }

    async fetchNewsletter(id) {
        let cat = await db.collection('newsletters').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updateNewsletter(id, data) {
        let obj = data;

        if (id == 'new') {
            await db.collection('newsletters').insertOne({
                title: obj.title,
                content: obj.content,
                image: obj.image,
                galleries: obj.galleries,
                status: 'Na čekanju',
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('newsletters').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    title: obj.title,
                    content: obj.content,
                    galleries: obj.galleries,
                    image: obj.image,
                }
            })
        }

        return {
            response: {},
            status: 200
        }
    }

    async allNewsletter() {
        let items = await db.collection('newsletters').find().sort({ position: 1 }).toArray();
        return items;
    }


    async deleteNewsletter(id) {
        await db.collection('newsletters').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }




    async fetchAnnouncement(id) {
        let cat = await db.collection('announcements').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updateAnnouncement(id, data) {
        let obj = data;

        if (id == 'new') {
            await db.collection('announcements').insertOne({
                content: obj.content,
                text: obj.text,
                from: parseInt(obj.from),
                to: parseInt(obj.to),
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('announcements').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    content: obj.content,
                    text: obj.text,
                    from: parseInt(obj.from),
                    to: parseInt(obj.to),
                }
            })
        }

        return {
            response: {},
            status: 200
        }

    }

    async annoucments() {
        let items = await db.collection('announcements').find({
            from: { $lte: Math.floor(new Date().getTime() / 1000) }, to: { $gte: Math.floor(new Date().getTime() / 1000) },
        }).toArray();
        return items;

    }

    async allAnnouncements() {
        let items = await db.collection('announcements').find().toArray();
        return items;
    }


    async deleteAnnouncement(id) {
        await db.collection('announcements').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }





    async fetchPage(id) {
        let cat = await db.collection('pages').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updatePage(id, data) {
        let obj = data;
        if (obj.name) {
            obj.alias = {};

            for (var key in obj.name) {
                if (obj.name.hasOwnProperty(key)) {
                    obj.alias[key] = generateAlias(obj.name[key]);
                }
            }
        }

        if (id == 'new') {
            await db.collection('pages').insertOne({
                name: obj.name,
                alias: obj.alias,
                content: obj.content,
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('pages').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    name: obj.name,
                    alias: obj.alias,
                    content: obj.content,
                }
            })
        }

        return {
            response: {},
            status: 200
        }

    }

    async allPages() {
        let items = await db.collection('pages').find().toArray();
        return items;
    }




    async fetchBanner(id) {
        let cat = await db.collection('banners').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updateBanner(id, data) {
        let obj = data;
        if (id == 'new') {
            await db.collection('banners').insertOne({
                name: obj.name,
                images: obj.images,
                position: parseInt(obj.position),
                leftSide: obj.leftSide ? true : false,
                rightSide: obj.rightSide ? true : false,
                footer: obj.footer ? true : false,
                sponsor: obj.sponsor ? true : false,
                detail: obj.detail ? true : false,
                ad: obj.ad ? true : false,
                hidden: obj.hidden ? true : false,
                // Unapred zadata veličina, da se baneri pripremaju po mjeri.
                size: obj.size || 'siroki',
                mobilePopup: obj.mobilePopup ? true : false,
                mobileOnly: obj.mobileOnly ? true : false,
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('banners').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    name: obj.name,
                    images: obj.images,
                    leftSide: obj.leftSide ? true : false,
                    rightSide: obj.rightSide ? true : false,
                    footer: obj.footer ? true : false,
                    sponsor: obj.sponsor ? true : false,
                    detail: obj.detail ? true : false,
                    ad: obj.ad ? true : false,
                    hidden: obj.hidden ? true : false,
                    size: obj.size || 'siroki',
                    mobilePopup: obj.mobilePopup ? true : false,
                    mobileOnly: obj.mobileOnly ? true : false,
                    position: parseInt(obj.position),
                }
            })
        }

        return {
            response: {},
            status: 200
        }

    }

    /*
     * Brisanje banera. Dodato 2026-08-28.
     *
     * Ova funkcija nije postojala, ni ruta uz nju — a u spisku banera je
     * stajala ikona kante koja je bila `<Link to='/'>` i samo izbacivala
     * administratora na javnu naslovnu. Baner se, jednom napravljen, nije
     * mogao ukloniti. Pravljeno po uzoru na `deleteSlide`.
     */
    async deleteBanner(id) {
        await db.collection('banners').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }

    async allBanners() {
        let items = await db.collection('banners').find().sort({ position: 1 }).toArray();
        return items;
    }

    async generateImages(dir, filename, fname, extension) {

        webp.cwebp(dir + filename, dir + fname + '.webp', "-q 100", function (status, error) {
            console.log(status, error);
        });

        try {
            const resizeInfo = await easyimage.resize({
                src: dir + filename,
                dst: dir + fname + `-50x` + extension,
                width: 50,
                quality: 100
            });

            webp.cwebp(dir + fname + `-50x` + extension, dir + fname + `-50x` + '.webp', "-q 100", function (status, error) {
                console.log(status, error);
            });


        } catch (e) {

        }

        for (let i = 100; i <= 1200; i += 100) {
            console.log('generating', dir + fname + `-${i}x` + extension)
            try {
                const resizeInfo = await easyimage.resize({
                    src: dir + filename,
                    dst: dir + fname + `-${i}x` + extension,
                    width: i,
                    quality: 100
                });

                webp.cwebp(dir + fname + `-${i}x` + extension, dir + fname + `-${i}x` + '.webp', "-q 100", function (status, error) {
                    console.log(status, error);
                });


            } catch (e) {

            }
        }
    }


    async autoGenerate() {
        fs.readdirSync('./uploads').forEach(async file => {
            let extension = '.' + file.split('.')[1];
            if (extension == '.png' || extension == '.jpg' || extension == '.jpeg') {
                console.log(file);
                await this.generateImages('./uploads/', file, file.split('.')[0], extension);
            }
        });

    }


    /*
     * Postavljanje slike.
     *
     * Ime fajla se NE koristi za odluku šta se snima — ekstenzija se izvodi iz
     * sadržaja (`admin/slike.js`). Time `zlo.html` preimenovan u `slika.png`
     * ne može da završi kao HTML u `uploads/`, koji se servira statički.
     *
     * Ranije je ova funkcija imala i grešku sa dva odgovora: kod `err` se
     * slalo 500 BEZ `return`, pa je odmah zatim išlo i 200 — drugi `send`
     * baca `ERR_HTTP_HEADERS_SENT`. Sada se izlazi odmah.
     */
    upload(file, res) {
        const nalaz = slike.proveri(file);
        if (nalaz.greska) {
            res.status(400).send(nalaz.greska);
            return;
        }

        const filename = uuidv4() + nalaz.ext;

        file.mv('./uploads/' + filename, (err) => {
            if (err) {
                console.error('[upload] snimanje nije uspelo:', err.message);
                res.status(500).send('Snimanje fajla nije uspjelo.');
                return;
            }

            res.status(200).send(`${API_ENDPOINT}/uploads/` + filename);
        })
    }


    async login(username, password) {
        //console.log(db);   

        let admin = await db.collection('admins').find({ username: username }).toArray();

        if (!admin.length) {
            return {
                response: {
                    error: 'User not exists'
                },
                status: 404
            };

        } else {
            if (bcrypt.compareSync(password, admin[0].pk)) {
                let token = jwt.sign({ "id": admin[0]._id }, constants.jwtSecretKey, { algorithm: 'HS256' });
                return {
                    response: {
                        token: token
                    },
                    status: 200
                };

            } else {
                return {
                    response: {
                        error: 'Wrong creditials'
                    },
                    status: 400
                };

            }
        }
    }




    async updateOne(id, collection, obj) {
        if (collection === 'blogCategories' || collection === 'technologies' || collection === 'categories' || collection === 'products' || collection === 'pages') {
            if (obj.name) {
                obj.alias = generateAlias(obj.name);
            }
        }

        if (collection === 'categories') {
            let breadcrumb = `/${obj.alias}`;
            if (obj.parentCategory) {
                let parentCategory = await db.collection('categories').find({ _id: ObjectID(obj.parentCategory) }).toArray();
                if (parentCategory && parentCategory.length) {
                    breadcrumb = `${parentCategory[0].breadcrumb}${breadcrumb}`;
                }
            }

            obj.breadcrumb = breadcrumb;
        }


        if (collection === 'blog') {
            if (obj.title) {
                obj.alias = generateAlias(obj.title);
            }
        }


        if (collection === 'products' && obj.category) {
            let category = await db.collection('categories').find({ _id: ObjectID(obj.category) }).toArray();
            if (category.length) {
                obj.breadcrumb = category[0].breadcrumb;
            }
        }


        if (id == 'new') {
            obj.timestamp = Math.floor(new Date().getTime() / 1000);

            await db.collection(collection).insertOne(obj);
        } else {
            delete obj._id;
            await db.collection(collection).updateOne({ _id: ObjectID(id) }, {
                $set: obj
            })
        }
        return {}
    }

    async delete(id, collection) {
        await db.collection(collection).deleteOne({ _id: ObjectID(id) });
        return {}
    }


    async fetchOne(id, collection) {

        let result = await db.collection(collection).find({ _id: ObjectID(id) }).toArray();
        if (result.length) {
            return result[0]
        } else {
            return { error: 'Not found' }
        }
    }

    async fetch(collection) {
        let result = await db.collection(collection).find().toArray();
        return result
    }
    async projects() {
        let result = await db.collection('projects').find().sort({ sort: 1 }).toArray();
        return result;
    }
    async sortProjects(items) {
        for (let i = 0; i < items.length; i++) {
            await db.collection('projects').updateOne({ _id: ObjectID(items[i]._id) }, {
                $set: {
                    sort: i
                }
            })
        }

        return {};
    }



    async home(obj) {
        await db.collection('home').deleteMany({});

        await db.collection('home').insertOne(obj);
        return {}

    }


    /*
     * Brisanje korisnika briše I SVE NJEGOVE GALERIJE.
     *
     * To je bilo tako i ranije, ali se nigde nije govorilo — potvrda u
     * administraciji je pisala samo „Potvrdite brisanje". Kod fotografa sa
     * više stotina galerija jedan promašen klik odnosi ceo njegov doprinos
     * arhivi, bez povratka.
     *
     * Sam postupak se ne menja (agencija to i traži kad uklanja nalog), ali
     * se sada vraća KOLIKO je obrisano, a `brojGalerija` ispod daje taj broj
     * unapred, da potvrda može da ga pokaže.
     */
    async deleteUser(id) {
        const galerije = await db.collection('gallery').find({ uid: ObjectID(id) }).toArray();
        await db.collection('gallery').deleteMany({ uid: ObjectID(id) })
        await db.collection('users').deleteOne({ _id: ObjectID(id) });
        return { obrisanoGalerija: galerije.length }
    }

    /** Koliko galerija ima korisnik — za upozorenje pre brisanja. */
    async brojGalerija(id) {
        const galerije = await db.collection('gallery').find({ uid: ObjectID(id) }).toArray();
        return { broj: galerije.length };
    }


    async getUser(uid) {
        return await db.collection('users').findOne({ _id: ObjectID(uid) });
    }
    checkPassword(password) {
        var decimal = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{6,16}$/;
        if (password.match(decimal))
            return true;
        else
            return false;
    }


    async editUser(uid, data) {
        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        if (!user.length) {
            return { error: `User not exists` };
        }

        let hash;

        if (data.newPassword) {

            if (data.newPassword != data.newPasswordRetyped) {
                return { error: `Lozinke se ne podudaraju.` };

            }

            if (!this.checkPassword(data.newPassword)) {
                return { error: `Lozinka mora da sadrži izmedju 6-16 karaktera, veliko slovo, broj i specijalni karakter.` };

            }


            var salt = bcrypt.genSaltSync(10);
            hash = bcrypt.hashSync(data.newPassword, salt);
        }


        let object = {
            //name: data.name
        }

        if (data.name) {
            object.name = data.name;
            let userAlias = generateAlias(object.name);
            object.userAlias = userAlias;

            db.collection('gallery').updateMany({ uid: ObjectID(uid) }, {
                $set: {
                    userAlias: userAlias,
                    user: object.name
                }
            })
        }

        if (user[0].email != data.email && data.email) {
            object.emailVerified = false;
            object.emailVerificationCode = uuidv4();
            object.email = data.email;
            sendMail(data.email, 'Verifikujte E-mail Adresu', String.format(fs.readFileSync('./emails/verify.html', 'utf-8'), data.email, `${SITE_URL}/account/verify/${uid}/${object.emailVerificationCode}`))
        }

        if (hash) {
            object.pk = hash;
        }

        if (data.phoneNumber) {
            object.phoneNumber = data.phoneNumber;
        }

        if (data.businessPhoneNumber) {
            object.businessPhoneNumber = data.businessPhoneNumber;
        }
        if (data.webSite) {
            object.webSite = data.webSite;
        }
        if (data.skype) {
            object.skype = data.skype;
        }
        if (data.twitter) {
            object.twitter = data.twitter;
        }
        if (data.facebook) {
            object.facebook = data.facebook;
        }
        if (data.instagram) {
            object.instagram = data.instagram;
        }
        if (data.country) {
            object.country = data.country;
        }
        if (data.city) {
            object.city = data.city;
        }
        if (data.address) {
            object.address = data.address;
        }
        if (data.profilePhoto) {
            object.profilePhoto = data.profilePhoto;
        }

        if (data.biography) {
            object.biography = data.biography;
        }

        await db.collection('users').updateOne({ _id: user[0]._id }, { $set: object });
        return {}

    }



    async getHome() {

        let result = await db.collection('home').find({}).toArray();
        if (result.length) {
            return result[0];
        } else {
            return {}
        }
    }
    async aboutUs(obj) {
        await db.collection('aboutus').deleteMany({});

        await db.collection('aboutus').insertOne(obj);
        return {}

    }


    async getAboutUs() {

        let result = await db.collection('aboutus').find({}).toArray();
        if (result.length) {
            return result[0];
        } else {
            return {}
        }
    }




}

module.exports = Admin;