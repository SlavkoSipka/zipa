/*
 * Pravljenje administratorskog naloga za probu.
 *
 * Pokreni u svom terminalu:
 *     cd zipa24062026/api && node napravi-admina.js
 *
 * Skripta pita za adresu i lozinku. Lozinka se NE prikazuje dok se kuca i
 * nigde se ne zapisuje — u bazu ide samo njen bcrypt otisak, isto kao kod
 * običnih korisnika.
 *
 * Nalog se pravi odmah potvrđen i uključen, sa punim pravima ('*'), pa se
 * možeš prijaviti bez čekanja potvrde e-poštom.
 *
 * Kad završiš proveru, obriši ga:
 *     node napravi-admina.js --obrisi
 */
require('dotenv').config({ quiet: true });

const readline = require('readline');
const bcrypt = require('bcryptjs');
const dbConnect = require('./db');
const ObjectID = require('./objectid');

function pitaj(pitanje, sakrij = false) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

        if (!sakrij) {
            rl.question(pitanje, (odg) => { rl.close(); resolve(odg.trim()); });
            return;
        }

        // Lozinka se ne ispisuje na ekranu dok se kuca.
        process.stdout.write(pitanje);
        const naStdout = process.stdout.write.bind(process.stdout);
        process.stdout.write = () => true;

        rl.question('', (odg) => {
            process.stdout.write = naStdout;
            process.stdout.write('\n');
            rl.close();
            resolve(odg.trim());
        });
    });
}

function napraviOznaku(ime) {
    return String(ime).toLowerCase()
        .replace(/č|ć/g, 'c').replace(/ž/g, 'z').replace(/š/g, 's').replace(/đ/g, 'dj')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

(async () => {
    const db = await dbConnect();
    await new Promise((r) => setTimeout(r, 1200));

    // ── brisanje ─────────────────────────────────────────────────────────
    if (process.argv.includes('--obrisi')) {
        const adresa = await pitaj('Adresa naloga koji brišeš: ');
        const nadjen = await db.collection('users').find({ email: adresa.toLowerCase() }).toArray();

        if (!nadjen.length) {
            console.log('\nNema naloga sa tom adresom.');
            process.exit(0);
        }
        if (!Array.isArray(nadjen[0].permissions) || nadjen[0].permissions.indexOf('*') === -1) {
            console.log('\nTaj nalog nema puna prava — nije napravljen ovom skriptom.');
            console.log('Da ne bih obrisao pogrešan nalog, prekidam. Obriši ga iz administracije.');
            process.exit(1);
        }

        await db.collection('users').deleteOne({ _id: nadjen[0]._id });
        console.log('\nNalog obrisan:', adresa);
        process.exit(0);
    }

    // ── pravljenje ───────────────────────────────────────────────────────
    console.log('\nPravljenje administratorskog naloga za probu.\n');

    const email = (await pitaj('E-mail adresa: ')).toLowerCase();
    if (!email || email.indexOf('@') === -1) {
        console.log('\nAdresa nije ispravna.');
        process.exit(1);
    }

    const postoji = await db.collection('users').find({ email }).toArray();
    if (postoji.length) {
        console.log('\nNalog sa tom adresom već postoji.');
        process.exit(1);
    }

    const ime = await pitaj('Ime i prezime: ');
    if (!ime) {
        console.log('\nIme je obavezno.');
        process.exit(1);
    }

    const lozinka = await pitaj('Lozinka (ne prikazuje se): ', true);
    const ponovo = await pitaj('Lozinka ponovo: ', true);

    if (lozinka !== ponovo) {
        console.log('\nLozinke se ne poklapaju.');
        process.exit(1);
    }
    if (lozinka.length < 6) {
        console.log('\nLozinka mora imati bar 6 znakova.');
        process.exit(1);
    }

    const sada = Math.floor(Date.now() / 1000);

    await db.collection('users').insertOne({
        _id: ObjectID(),
        email,
        pk: bcrypt.hashSync(lozinka, 10),
        name: ime,
        userAlias: napraviOznaku(ime),
        userRole: 'admin',
        permissions: ['*'],
        accountEnabled: true,
        emailVerified: true,
        registerTimestamp: sada,
        lastLoginTimestamp: sada,
        previousLoginTimestamp: sada,
    });

    console.log('\n─────────────────────────────────────────');
    console.log('Nalog je napravljen.');
    console.log('  adresa:', email);
    console.log('  prijava: http://localhost:10016/login');
    console.log('\nKad završiš proveru, obriši ga:');
    console.log('  node napravi-admina.js --obrisi');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
})().catch((e) => {
    console.error('\nGreška:', e.message);
    process.exit(1);
});
