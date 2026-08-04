const fs = require('fs');
const ObjectID = require('../objectid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const fetch = require('node-fetch');
const sendMail = require('../sendMail');

let db;
const dbConnect = require('../db');
const storage = require('../storage');
const constants = require('./constants');
const { SITE_URL } = require('../constants');
var paypal = require('paypal-rest-sdk');
var easyimage = require('easyimage');

/*paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AZ-3VdH8RS5xnC6vhj_qjfnYykku2O9dN3enY61EsBTw3Lz7rgfUbNAvgQ-zWMyPoreI3sgkJJyVeYAY',
    'client_secret': 'EFLr7h99l92gE2EbRwJZkWtpXDUVRcJysdW7lw71b3gBaBzN2IxcGHuYLPULyBmiZIYLMXQAQOfpRHox'
});*/

let paypalEnv = new paypal.core.SandboxEnvironment('Aeo_ioibFhYvOe1C3Su14KejG9WXXngPuhQG6xZtiQKvMK_J0eCGnF6cRpV6Fij0SDoH4JIYMkIjtuT3', 'EGgd4k_Xud7U-IhivqCgP7GqRL-KZKQuprovpZCwFeCFTZMB_UWbv1hf_f2TjpoCIDA359ApI5rFqXix');
//let paypalEnv = new paypal.core.LiveEnvironment('AU6dEOqLcGkaIx5Jn_3DZxjMf2BGPb0GI6OABJLJAv1OsBrV2L4O-4s5teSuwjcmHGOWfXTZwtmS1d8b', 'EOvHb544jH3vlpR5w70kxXaifT3RDuVgpekRoDtnnkQLyORR_sA_Cldhr93H6V6rOadoQtezYJJB-7gT'); // Live account
let paypalClient = new paypal.core.PayPalHttpClient(paypalEnv);

/*paypal.order.get("YCSMNZ5RD4NZ8", (err, order) => {
    if (err) {
        console.log(err)
    } else {
        console.log(order)
    }
})
*/


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


const userRolePermissions = {
    'photographer': ['change-gallery', 'transactions']
}


dbConnect()
    .then((conn) => {
        db = conn;
    })
    .catch((e) => {
        console.log('DB error')
    })

class UsersModule {
    constructor(props) {

    }


    async logVisit(uid, url) {
        await db.collection('logs').insertOne({
            uid: uid ? ObjectID(uid) : null,
            url: url,
            timestamp: Math.floor(new Date().getTime() / 1000)
        });
        return {};
    }

    /**
     * Evidencija prijava na sajt.
     *
     * Prikazuje ko se od registrovanih korisnika prijavljivao i kada.
     * Administratorski nalozi se podrazumevano izostavljaju, jer je klijentu
     * bitno da vidi korisnike, a ne sopstvene prijave.
     *
     * @param {number} page     strana (od nule)
     * @param {object} options  { from, to, perPage, includeAdmins }
     */
    async fetchLoginHistory(page = 0, options = {}) {
        const perPage = Math.min(parseInt(options.perPage, 10) || 100, 1000);
        const uslovi = [];
        const params = [];

        if (options.from) {
            params.push(parseInt(options.from, 10));
            uslovi.push(`h."timestamp" >= $${params.length}`);
        }
        if (options.to) {
            params.push(parseInt(options.to, 10));
            uslovi.push(`h."timestamp" <= $${params.length}`);
        }
        if (!options.includeAdmins) {
            uslovi.push(`coalesce(u."userRole", '') <> 'admin'`);
        }

        const where = uslovi.length ? `where ${uslovi.join(' and ')}` : '';

        const ukupno = await db.query(`
            select count(*)::int as c
              from "loginHistory" h
              left join users u on u."_id" = h."uid"
              ${where}
        `, params);

        const items = await db.query(`
            select h."_id", h."timestamp", h."ip", h."userAgent",
                   u."_id" as user_id, u."name" as user_name,
                   u."email" as user_email, u."userRole" as user_role
              from "loginHistory" h
              left join users u on u."_id" = h."uid"
              ${where}
             order by h."timestamp" desc
             limit ${perPage} offset ${parseInt(page, 10) * perPage}
        `, params);

        return {
            items: items.rows.map((r) => ({
                _id: r._id,
                timestamp: r.timestamp,
                ip: r.ip,
                userAgent: r.userAgent,
                user: r.user_id ? {
                    _id: r.user_id, name: r.user_name,
                    email: r.user_email, userRole: r.user_role
                } : null
            })),
            total: Math.ceil(ukupno.rows[0].c / perPage),
            totalItems: ukupno.rows[0].c
        };
    }

    /**
     * Evidencija otvaranja stranica.
     *
     * Podržava izbor perioda i broja redova po strani, da bi se izveštaj za
     * ceo mesec mogao odštampati odjednom umesto listanja strane po stranu.
     * Podaci o korisnicima se dovlače u istom upitu — ranije se za svaki red
     * išlo u bazu posebno, pa je strana od sto redova značila sto upita.
     *
     * @param {number} page      strana (od nule)
     * @param {string} search    deo adrese stranice
     * @param {object} options   { from, to, perPage, onlyUsers }
     */
    async fetchLogs(page = 0, search = null, options = {}) {
        const perPage = Math.min(parseInt(options.perPage, 10) || 100, 1000);
        const uslovi = [];
        const params = [];

        if (search) {
            params.push(search);
            uslovi.push(`l."doc"->>'url' ~* $${params.length}`);
        }
        if (options.from) {
            params.push(parseInt(options.from, 10));
            uslovi.push(`(l."doc"->>'timestamp')::bigint >= $${params.length}`);
        }
        if (options.to) {
            params.push(parseInt(options.to, 10));
            uslovi.push(`(l."doc"->>'timestamp')::bigint <= $${params.length}`);
        }
        // samo prijavljeni korisnici — da se vidi ko od registrovanih koristi sajt
        if (options.onlyUsers) {
            uslovi.push(`l."doc"->>'uid' is not null`);
        }

        const where = uslovi.length ? `where ${uslovi.join(' and ')}` : '';

        const ukupno = await db.query(`select count(*)::int as c from logs l ${where}`, params);
        const total = ukupno.rows[0].c;

        const items = await db.query(`
            select l."_id",
                   l."doc"->>'url' as url,
                   (l."doc"->>'timestamp')::bigint as timestamp,
                   l."doc"->>'uid' as uid,
                   u."name" as user_name,
                   u."userAlias" as user_alias
              from logs l
              left join users u on u."_id" = l."doc"->>'uid'
              ${where}
             order by (l."doc"->>'timestamp')::bigint desc nulls last
             limit ${perPage} offset ${parseInt(page, 10) * perPage}
        `, params);

        return {
            items: items.rows.map((r) => ({
                _id: r._id,
                url: r.url,
                timestamp: r.timestamp,
                uid: r.uid,
                user: r.user_name ? { name: r.user_name, userAlias: r.user_alias } : null
            })),
            total: Math.ceil(total / perPage),
            totalItems: total
        };
    }


    /**
     * Pregled preuzimanja fotografija.
     *
     * Uz svako preuzimanje prikazuje se na koji je način fotografija uzeta:
     *   kupovina  — plaćena karticom (postoji broj transakcije)
     *   autor     — fotograf je preuzeo sopstvenu fotografiju
     *   besplatno — galerija je bez cene
     *   pretplata — potrošen kredit iz pretplate
     *
     * Za starija preuzimanja način se izvodi iz podataka, a od sada se
     * upisuje uz sam zapis.
     *
     * Podaci o korisniku, galeriji i transakciji dovlače se u istom upitu;
     * ranije su za svaki red išla tri zasebna upita u bazu.
     *
     * @param {number} page    strana (od nule)
     * @param {string} search  ime korisnika ili naziv galerije
     * @param {object} options { from, to, perPage, type }
     */
    async fetchDownloads(page = 0, search = null, options = {}) {
        const perPage = Math.min(parseInt(options.perPage, 10) || 20, 500);
        const uslovi = ['u."_id" is not null', 'g."_id" is not null'];
        const params = [];

        if (search) {
            params.push(search);
            uslovi.push(`(u."name" ~* $${params.length} or g."name"->>'ba' ~* $${params.length} or u."email" ~* $${params.length})`);
        }
        if (options.from) {
            params.push(parseInt(options.from, 10));
            uslovi.push(`d."timestamp" >= $${params.length}`);
        }
        if (options.to) {
            params.push(parseInt(options.to, 10));
            uslovi.push(`d."timestamp" <= $${params.length}`);
        }

        // način preuzimanja — isti izraz se koristi i za filter i za prikaz
        const nacin = `
            case
              when d."transactionId" is not null then 'kupovina'
              when d."uid" = g."uid"              then 'autor'
              when coalesce(g."price", 0) = 0     then 'besplatno'
              else 'pretplata'
            end`;

        if (options.type) {
            params.push(options.type);
            uslovi.push(`${nacin} = $${params.length}`);
        }

        const where = `where ${uslovi.join(' and ')}`;

        const ukupno = await db.query(`
            select count(*)::int as c
              from downloads d
              left join users u   on u."_id" = d."uid"
              left join gallery g on g."_id" = d."galleryId"
              ${where}
        `, params);

        const items = await db.query(`
            select d."_id", d."timestamp", d."resolution", d."photoId",
                   d."photo", d."transactionId", d."galleryId",
                   ${nacin} as "downloadType",
                   u."_id" as user_id, u."name" as user_name,
                   u."userAlias" as user_alias, u."email" as user_email,
                   g."name" as gallery_name, g."alias" as gallery_alias,
                   g."price" as gallery_price, g."photos" as gallery_photos,
                   t."transaction" as transaction_data
              from downloads d
              left join users u        on u."_id" = d."uid"
              left join gallery g      on g."_id" = d."galleryId"
              left join transactions t on t."_id" = d."transactionId"
              ${where}
             order by d."timestamp" desc nulls last
             limit ${perPage} offset ${parseInt(page, 10) * perPage}
        `, params);

        return {
            items: items.rows.map((r) => ({
                _id: r._id,
                timestamp: r.timestamp,
                resolution: r.resolution,
                photoId: r.photoId,
                photo: r.photo,
                transactionId: r.transactionId,
                galleryId: r.galleryId,
                downloadType: r.downloadType,
                transaction: r.transaction_data ? { transaction: r.transaction_data } : undefined,
                user: { _id: r.user_id, name: r.user_name, userAlias: r.user_alias, email: r.user_email },
                gallery: {
                    _id: r.galleryId, name: r.gallery_name, alias: r.gallery_alias,
                    price: r.gallery_price, photos: r.gallery_photos
                }
            })),
            total: Math.ceil(ukupno.rows[0].c / perPage),
            totalItems: ukupno.rows[0].c
        };
    }


    async fetchUsers(page = 0, search = null) {

        let query = {};


        if (search) {
            query = { $or: [{ email: new RegExp(search, 'i') }, { name: new RegExp(search, 'i'), }] }
        }

        let users = await db.collection('users').find(query).skip(page * 20).limit(20).toArray();
        return {
            items: users,
            total: Math.ceil(await db.collection('users').find(query).count() / 20)
        };
    }

    checkPassword(password) {
        var decimal = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{6,16}$/;
        if (password.match(decimal))
            return true;
        else
            return false;
    }



    async register(email, password, name, type) {
        let check = await db.collection('users').find({ email: email }).count();
        if (check) {
            return {
                response: { error: `E-mail adresa već postoji.` },
                status: 500
            }
        }

        if (!this.checkPassword(password)) {
            return {
                response: { error: `Lozinka mora da sadrži izmedju 6-16 karaktera, veliko slovo, broj i specijalni karakter.` },
                status: 500
            }
        }




        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(password, salt);



        let obj = {
            _id: ObjectID(),
            name: name,
            email: email,
            userRole: type,
            pk: hash,
            emailVerified: false,
            accountEnabled: false,
            emailVerificationCode: uuidv4(),
            registerTimestamp: Math.floor(new Date().getTime() / 1000),
            permissions: userRolePermissions[type],
            userAlias: generateAlias(name)
        }

        sendMail(email, 'Verifikujte E-mail Adresu', String.format(fs.readFileSync('./emails/verify.html', 'utf-8'), email, `${SITE_URL}/account/verify/${obj._id.toString()}/${obj.emailVerificationCode}`))

        await db.collection('users').insertOne(obj);

        // Obaveštenje agenciji — sa podacima potrebnim za odobrenje naloga.
        // Ranije je stizala samo rečenica da se neko registrovao, bez ijednog
        // podatka, pa se moralo tražiti u administraciji ko je to.
        const nazivTipa = {
            photographer: 'Fotograf',
            agency: 'Agencija',
            legalPerson: 'Pravno lice',
            physicalPerson: 'Fizičko lice'
        }[type] || type || 'nije naznačen';

        let html = `<html><body style="font-family: Arial, sans-serif; color:#1a1d29">
            <h2 style="margin:0 0 14px">Nova registracija na sajtu</h2>
            <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
                <tr><td><b>Ime i prezime</b></td><td>${name || '-'}</td></tr>
                <tr><td><b>E-mail</b></td><td>${email}</td></tr>
                <tr><td><b>Tip naloga</b></td><td>${nazivTipa}</td></tr>
                <tr><td><b>Vrijeme</b></td><td>${new Date().toLocaleString('sr-RS')}</td></tr>
            </table>
            <p style="margin-top:18px;font-size:14px">
                Nalog čeka odobrenje. Otvorite
                <a href="${SITE_URL}/account/users">spisak korisnika</a> da biste ga odobrili.
            </p>
        </body></html>`;

        sendMail('info@zipaphoto.net', `Nova registracija — ${nazivTipa}: ${name || email}`, html);


        return {
            response: {
            },
            status: 200
        }
    }

    async verifyEmail(uid, emailVerificationCode) {
        let check = await db.collection('users').find({ _id: ObjectID(uid) }).count();
        if (!check) {
            return {
                response: { error: `User not exists` },
                status: 500
            }
        }

        check = await db.collection('users').find({ _id: ObjectID(uid), emailVerificationCode: emailVerificationCode }).count();
        if (!check) {
            return {
                response: { error: `Wrokng verification code` },
                status: 500
            }
        }


        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();


        sendMail(user[0].email, 'E-mail Adresa Verifikovana!', String.format(fs.readFileSync('./emails/verified.html', 'utf-8'), `${SITE_URL}`))

        await db.collection('users').updateOne({ _id: ObjectID(uid) }, { $set: { emailVerificationCode: null, emailVerified: true, emailVerificationTimestamp: Math.floor(new Date().getTime() / 1000) } });

        let token = jwt.sign({ "id": uid }, constants.jwtSecretKey, { algorithm: 'HS256', expiresIn: '30d' });
        return {
            response: {
                token: token
            },
            status: 200
        };
    }

    async sendResetPasswordMail(email) {
        let user = await db.collection('users').find({ email: email }).toArray();
        if (!user.length) {
            return {
                response: { error: `User not exists` },
                status: 500
            }
        }


        let resetPasswordVerificationCode = uuidv4();
        await db.collection('users').updateOne({ _id: user[0]._id }, { $set: { resetPasswordVerificationCode: resetPasswordVerificationCode } });

        sendMail(email, 'Zaboravljena lozinka', String.format(fs.readFileSync('./emails/forgot.html', 'utf-8'), `${SITE_URL}/reset-password/${user[0]._id.toString()}/${resetPasswordVerificationCode}`))
        return {
            response: { error: null },
            status: 200
        }
    }

    async resetPassword(uid, resetPasswordVerificationCode, newPassword, retypedPassword) {
        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        if (!user.length) {
            return {
                response: { error: `User not exists` },
                status: 500
            }
        }

        user = await db.collection('users').find({ _id: ObjectID(uid), resetPasswordVerificationCode: resetPasswordVerificationCode }).toArray();
        if (!user.length) {
            return {
                response: { error: `Wrong verification code` },
                status: 500
            }
        }

        if (newPassword !== retypedPassword) {
            return {
                response: { error: `Passwords do not match` },
                status: 500
            }
        }

        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(newPassword, salt);


        await db.collection('users').updateOne({ _id: user[0]._id }, { $set: { resetPasswordVerificationCode: null, pk: hash } });

        let token = jwt.sign({ "id": uid }, constants.jwtSecretKey, { algorithm: 'HS256', expiresIn: '30d' });
        return {
            response: {
                token: token
            },
            status: 200
        };

    }


    async login(email, password, rememberMe, prijava = {}) {
        let user = await db.collection('users').find({ email: email }).toArray();
        if (!user.length) {
            return {
                response: {
                    error: 'Korisnik ne postoji'
                },
                status: 404
            };

        } else {
            if (!user[0].emailVerified) {
                return {
                    response: {
                        error: 'E-mail adresa nije verifikovana'
                    },
                    status: 500
                };
            }

            if (!user[0].accountEnabled) {
                return {
                    response: {
                        error: 'Vaš nalog još uvijek čeka odobrenje administratora.'
                    },
                    status: 500
                };
            }


            if (bcrypt.compareSync(password, user[0].pk)) {


                let token = jwt.sign({ "id": user[0]._id }, constants.jwtSecretKey, { algorithm: 'HS256', expiresIn: rememberMe ? '30d' : '24h' });

                // Vreme prethodne prijave se čuva pre upisa nove, da bi korisnik
                // na profilu video kada je bio ulogovan pre ovog puta.
                await db.collection('users').updateOne({ _id: user[0]._id }, {
                    $set: {
                        previousLoginTimestamp: user[0].lastLoginTimestamp ? user[0].lastLoginTimestamp : null,
                        lastLoginTimestamp: Math.floor(new Date().getTime() / 1000)
                    }
                })

                // Zapis o prijavi — da se u administraciji vidi ko od
                // registrovanih korisnika i kada koristi servis.
                await db.collection('loginHistory').insertOne({
                    uid: user[0]._id,
                    timestamp: Math.floor(new Date().getTime() / 1000),
                    ip: prijava.ip || null,
                    userAgent: prijava.userAgent || null
                })

                return {
                    response: {
                        token: token
                    },
                    status: 200
                };

            } else {
                return {
                    response: {
                        error: 'Pogrešni podaci za prijavu.'
                    },
                    status: 400
                };
            }
        }
    }

    async editAccount(uid, data) {
        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        if (!user.length) {
            return {
                response: { error: `User not exists` },
                status: 500
            }
        }

        let hash;

        if (data.oldPassword || data.newPassword) {

            if (!bcrypt.compareSync(data.oldPassword, user[0].pk)) {
                return {
                    response: { error: `Pogrešna stara lozinka.` },
                    status: 400
                }

            }

            if (data.newPassword != data.newPasswordRetyped) {
                return {
                    response: { error: `Lozinke se ne podudaraju.` },
                    status: 500
                }
            }

            if (!this.checkPassword(data.newPassword)) {
                return {
                    response: { error: `Lozinka mora da sadrži izmedju 6-16 karaktera, veliko slovo, broj i specijalni karakter.` },
                    status: 500
                }
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
        return {
            response: { error: null },
            status: 200
        }

    }

    async photographers() {
        let users = await db.collection('users').find({ accountEnabled: true, userRole: 'photographer' }, { projection: { _id: 1, userAlias: 1, name: 1, profilePhoto: 1 } }).toArray();

        // Broj fotografija se računa u bazi — učitavanje svih galerija sa
        // `photos` nizovima (kod najplodnijih fotografa 150k+ fotografija)
        // bi bez potrebe povuklo stotine megabajta.
        let counts = await db.query(`
            select "uid", coalesce(sum(jsonb_array_length(photos)), 0)::int as cnt
              from gallery
             where "isActive" is true and photos is not null
             group by "uid"
        `);
        let byUid = {};
        for (let row of counts.rows) byUid[row.uid] = row.cnt;

        for (let i = 0; i < users.length; i++) {
            users[i].photosCount = byUid[users[i]._id] || 0;
        }

        users.sort((a, b) => b.photosCount - a.photosCount);
        return users;

    }

    async photographer(alias) {
        let user = await db.collection('users').findOne({ accountEnabled: true, userRole: 'photographer', userAlias: alias }, { projection: { _id: 1, userAlias: 1, name: 1, profilePhoto: 1, country: 1, city: 1, biography: 1, webSite: 1, instagram: 1, twitter: 1, facebook: 1, skype: 1 } });
        if (user) {
            // I broj fotografija i izdvojene fotografije se dobijaju iz baze,
            // umesto učitavanja svih galerija fotografa u memoriju.
            let total = await db.query(
                `select coalesce(sum(jsonb_array_length(photos)), 0)::int as cnt
                   from gallery where "uid" = $1 and "isActive" is true and photos is not null`,
                [user._id]
            );
            user.photosCount = total.rows[0].cnt;

            let featured = await db.query(
                `select g."_id", g.alias, p.value as photo, (p.ordinality - 1)::int as photo_id
                   from gallery g,
                        jsonb_array_elements(g.photos) with ordinality p(value, ordinality)
                  where g."uid" = $1 and g."isActive" is true
                    and (p.value->>'visibleOnProfile') in ('true', 't')`,
                [user._id]
            );
            user.photos = featured.rows.map((row) => ({
                ...row.photo,
                galleryAlias: row.alias,
                photoId: row.photo_id,
                _id: row._id,
            }));
        }

        return user;
    }


    async verify(uid) {
        let user = await db.collection('users').find({ _id: ObjectID(uid) }, { projection: { _id: 1, email: 1, userAlias: 1, name: 1, permissions: 1, profilePhoto: 1, phoneNumber: 1, lastLoginTimestamp: 1, previousLoginTimestamp: 1, businessPhoneNumber: 1, webSite: 1, skype: 1, twitter: 1, facebook: 1, instagram: 1, country: 1, city: 1, address: 1, userRole: 1, biography: 1 } }).toArray();

        if (user[0].userRole != 'photographer' && user[0].userRole != 'admin') {
            let userResolutions = await db.collection('userResolutions').find(
                {
                    uid: uid,
                    from: { $lte: Math.floor(new Date().getTime() / 1000) }, to: { $gte: Math.floor(new Date().getTime() / 1000) },
                    $or: [
                        {
                            'resolution3000px': { $gt: 0 }
                        },
                        {
                            'resolution1500px': { $gt: 0 }
                        },
                        {
                            'resolution800px': { $gt: 0 }
                        }
                    ]
                }
            ).toArray();

            user[0].freePhotos = 0;
            if (userResolutions.length) {
                user[0].freePhotos += userResolutions[0].resolution3000px;
                user[0].freePhotos += userResolutions[0].resolution1500px;
                user[0].freePhotos += userResolutions[0].resolution800px;
            }
        }

        if (user[0].userRole == 'photographer') {
            // Brojanje u bazi umesto učitavanja svih galerija sa `photos`.
            let res = await db.query(
                `select coalesce(sum(jsonb_array_length(photos)), 0)::int as cnt
                   from gallery where "uid" = $1 and photos is not null`,
                [user[0]._id]
            );
            user[0].photoCount = res.rows[0].cnt;
        }



        let curMonth = new Date();
        curMonth.setHours(0, 0, 0, 0);
        curMonth.setDate(1);



        let curMonthTimestamp = Math.floor(curMonth.getTime() / 1000);
        let currMonthDownloads = await db.collection('downloads').find({ timestamp: { $gte: curMonthTimestamp }, uid: uid }).toArray();

        user[0].currMonthDownloads = 0;
        for (let i = 0; i < currMonthDownloads.length; i++) {
            let gallery = await db.collection('gallery').findOne({ _id: currMonthDownloads[i].galleryId });

            if (gallery && gallery.price) {
                let priceMap = {
                    3000: 1,
                    1500: 0.5,
                    800: 0.15,
                };

                user[0].currMonthDownloads += (gallery.price * priceMap[currMonthDownloads[i].resolution]);
            }

        }

        let downloads = await db.collection('downloads').find({ uid: uid }).toArray();

        user[0].totalDownloads = 0;
        for (let i = 0; i < downloads.length; i++) {
            let gallery = await db.collection('gallery').findOne({ _id: downloads[i].galleryId });

            if (gallery && gallery.price) {
                let priceMap = {
                    3000: 1,
                    1500: 0.5,
                    800: 0.15,
                };

                user[0].totalDownloads += (gallery.price * priceMap[downloads[i].resolution]);
            }

        }


        return user[0]
    }

    async comment(uid, storeAlias, alias, sku, parent, comment) {
        let product = await db.collection('products').find({ storeAlias: storeAlias, alias: alias, sku: sku }).toArray();
        if (!product.length) {
            return { error: 'Product not found' };
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        if (!user.length) {
            return { error: 'User not found' };
        }

        await db.collection('comments').insertOne({
            uid: uid,
            productId: product[0]._id,
            parent: parent,
            comment: comment,
            status: 1,
            timestamp: Math.floor(new Date().getTime() / 1000)
        });

        return {
            error: null
        }
    }

    async fetchCommentsNode(uid, product, node) {
        let query = { productId: product, parent: node };

        if (uid) {
            query['$or'] = [{ uid: uid }, { uid: { $ne: uid }, status: 1 }];
        } else {
            query.status = 1;
        }

        let comments = await db.collection('comments').find(query).sort({ timestamp: 1 }).toArray();
        for (let i = 0; i < comments.length; i++) {
            comments[i].replies = await this.fetchCommentsNode(uid, product, comments[i]._id.toString());
            let user = await db.collection('users').find({ _id: ObjectID(comments[i].uid) }).toArray();
            if (user.length) {
                comments[i].user = user[0].name ? user[0].name : user[0].email.split('@')[0];
            }
        }

        return comments;
    }

    async comments(uid, storeAlias, alias, sku) {
        let product = await db.collection('products').find({ storeAlias: storeAlias, alias: alias, sku: sku }).toArray();
        if (!product.length) {
            return { error: 'Product not found' };
        }

        return await this.fetchCommentsNode(uid, product[0]._id, null);
    }





    async rate(uid, storeAlias, alias, sku, rating, comment) {
        let product = await db.collection('products').find({ storeAlias: storeAlias, alias: alias, sku: sku }).toArray();
        if (!product.length) {
            return { error: 'Product not found' };
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        if (!user.length) {
            return { error: 'User not found' };
        }

        let check = await db.collection('userOrders').find({ uid: uid, 'product._id': product[0]._id }).count();
        if (!check) {
            return { error: 'Not allowed' };
        }

        let review = await db.collection('reviews').find({ uid: uid, productId: product[0]._id }).toArray();
        if (review.length) {
            await db.collection('reviews').updateOne({ _id: review[0]._id }, {
                $set: {
                    comment: comment,
                    rating: parseInt(rating),
                    timestamp: Math.floor(new Date().getTime() / 1000)
                }
            });

        } else {
            await db.collection('reviews').insertOne({
                uid: uid,
                productId: product[0]._id,
                comment: comment,
                rating: parseInt(rating),
                timestamp: Math.floor(new Date().getTime() / 1000)
            });

        }



        let sum = 0;
        let reviews = await db.collection('reviews').find({ productId: product[0]._id }).toArray();
        for (let i = 0; i < reviews.length; i++) {
            sum += reviews[i].rating;
        }

        await db.collection('products').updateOne({ _id: product[0]._id }, {
            $set: {
                rating: reviews.length > 0 ? sum / reviews.length : 0
            }
        });

        return {
            error: null
        }
    }

    async isRatingAllowed(uid, storeAlias, alias, sku) {
        let product = await db.collection('products').find({ storeAlias: storeAlias, alias: alias, sku: sku }).toArray();
        if (!product.length) {
            return { ratingAllowed: false };
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        if (!user.length) {
            return { ratingAllowed: false };
        }

        let check = await db.collection('userOrders').find({ uid: uid, 'product._id': product[0]._id }).count();
        if (!check) {
            return { ratingAllowed: false };
        }

        return { ratingAllowed: true };
    }


    async reviews(storeAlias, alias, sku) {
        let product = await db.collection('products').find({ storeAlias: storeAlias, alias: alias, sku: sku }).toArray();
        if (!product.length) {
            return { error: 'Product not found' };
        }

        let reviews = await db.collection('reviews').find({ productId: product[0]._id }).sort({ timestamp: -1 }).toArray();
        for (let i = 0; i < reviews.length; i++) {
            let user = await db.collection('users').find({ _id: ObjectID(reviews[i].uid) }).toArray();
            if (user.length) {
                reviews[i].user = user[0].name ? user[0].name : user[0].email.split('@')[0];
            }
        }

        return reviews;
    }

    async userReviews(uid) {

        let reviews = await db.collection('reviews').find({ uid: uid }).sort({ timestamp: -1 }).toArray();
        for (let i = 0; i < reviews.length; i++) {
            let product = await db.collection('products').find({ _id: reviews[i].productId }).toArray();
            if (product.length) {
                reviews[i].productName = product[0].name;
                reviews[i].productAlias = product[0].alias;
            }
        }

        return reviews;
    }


    async deleteReview(uid, alias) {
        let product = await db.collection('products').find({ alias: alias }).toArray();
        if (!product.length) {
            return { error: 'Product not found' };
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        if (!user.length) {
            return { error: 'User not found' };
        }

        let check = await db.collection('downloads').find({ uid: uid, productId: product[0]._id }).count();
        if (!check) {
            return { error: 'Not allowed' };
        }

        await db.collection('reviews').deleteOne({ uid: uid, productId: product[0]._id });

        let sum = 0;
        let reviews = await db.collection('reviews').find({ productId: product[0]._id }).toArray();
        for (let i = 0; i < reviews.length; i++) {
            sum += reviews[i].rating;
        }

        await db.collection('products').updateOne({ _id: product[0]._id }, {
            $set: {
                rating: reviews.length > 0 ? sum / reviews.length : 0
            }
        });


        return { error: null }
    }

    async review(uid, alias) {
        let product = await db.collection('products').find({ alias: alias }).toArray();
        if (!product.length) {
            return { error: 'Product not found' };
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).count();
        if (!user) {
            return { error: 'User not found' };
        }


        let res = await db.collection('reviews').find({ uid: uid, productId: product[0]._id }).toArray();
        if (res.length) {
            return {
                comment: res[0].comment,
                rating: res[0].rating
            }
        } else {
            return {

            }
        }
    }



    async addToCartAfterLogin(uid, item) {
        let product = await db.collection('products').find({ _id: ObjectID(item.productId) }).toArray();
        if (!product.length) {
            return { error: 'Product not found' };
        }

        let check = await db.collection('cart').find({ uid: uid, productId: product[0]._id }).count();
        if (check) {
            await db.collection('cart').updateOne({ uid: uid, productId: product[0]._id }, {
                $set: {
                    quantity: item.quantity
                }
            });
        } else {

            await db.collection('cart').insertOne({
                uid: uid,
                productId: product[0]._id,
                timestamp: Math.floor(new Date().getTime() / 1000),
                quantity: item.quantity
            });
        }

        return { error: null }
    }



    async downloadGalleryImage(uid, galleryId, photoId, resolution = 3000 ) {

        let gallery = await db.collection('gallery').find({ _id: ObjectID(galleryId) }).toArray();
        if (!gallery.length) {
            return { response: { error: 'Gallery not found' }, status: 404 };
        }



        //let resolutions = await db.collection('userResolutions').find({ uid: uid }).toArray();

        if (gallery[0].uid.toString() != uid) {

            let resolutions = await db.collection('userResolutions').find({ uid: uid, from: { $lte: Math.floor(new Date().getTime() / 1000) }, to: { $gte: Math.floor(new Date().getTime() / 1000) } }).toArray();

            if (!resolutions.length) {
                return { response: { error: 'Not allowed' }, status: 400 };
            }

            if (resolutions[0].categories && resolutions[0].categories.length) {
                let found = false;
                for (let i = 0; i < resolutions[0].categories.length; i++) {
                    for (let j = 0; j < gallery[0].category.length; j++) {
                        if (gallery[0].category[j] == resolutions[0].categories[i]) {
                            found = true;
                            break;
                        }
                    }

                    if (found == true) {
                        break;
                    }
                }

                if (!found) {
                    return { response: { error: 'Not allowed' }, status: 400 };


                }

            }
            if (resolutions[0].photographers && resolutions[0].photographers.length) {
                if (resolutions[0].photographers.indexOf(gallery[0].uid.toString()) == -1) {
                    return { response: { error: 'Not allowed' }, status: 400 };

                }
            }

            if (resolutions[0][`resolution${resolution}px`] <= 0) {
                return { response: { error: 'Not allowed' }, status: 400 };
            }
        }


        let check = await db.collection('downloads').find({ uid: uid, galleryId: gallery[0]._id, photoId: photoId, resolution: resolution }).count();
        if (check) {
            await db.collection('downloads').updateOne({ uid: uid, galleryId: gallery[0]._id, photoId: photoId, resolution: resolution }, { $set: { timestamp: Math.floor(new Date().getTime() / 1000) } });
        } else {
            await db.collection('downloads').insertOne({ uid: uid, photo: gallery[0].photos[photoId], galleryId: gallery[0]._id, photoId: photoId, resolution: resolution, timestamp: Math.floor(new Date().getTime() / 1000) });
        }


        let base64;
        try {
            base64 = await storage.resizedOriginalDataUri(gallery[0].photos[photoId].image, resolution);
        } catch (e) {
            return { response: { error: 'Original fotografije nije dostupan.' }, status: 404 };
        }


        let obj = {};
        obj[`resolution${resolution}px`] = -1;
        await db.collection('userResolutions').updateOne({ uid: uid }, { $inc: obj });

        return {
            response: { image: base64 },
            status: 200
        }
    }

    async downloadGalleryImageFree(uid, galleryId, photoId, resolution = 3000,) {

        let gallery = await db.collection('gallery').find({ _id: ObjectID(galleryId) }).toArray();
        if (!gallery.length) {
            return { response: { error: 'Gallery not found' }, status: 404 };
        }
        let galleryPrice = gallery[0]
        console.log('GALLERY PRICE : ', galleryPrice.price)
        if (galleryPrice.price !== 0) {
            return { response: { error: 'Gallery photo is not free'}, status: 500};
        }



        //let resolutions = await db.collection('userResolutions').find({ uid: uid }).toArray();

        // if (gallery[0].uid.toString() != uid) {
        //
        //     let resolutions = await db.collection('userResolutions').find({ uid: uid, from: { $lte: Math.floor(new Date().getTime() / 1000) }, to: { $gte: Math.floor(new Date().getTime() / 1000) } }).toArray();
        //
        //     if (!resolutions.length) {
        //         return { response: { error: 'Not allowed' }, status: 400 };
        //     }
        //
        //     if (resolutions[0].categories && resolutions[0].categories.length) {
        //         let found = false;
        //         for (let i = 0; i < resolutions[0].categories.length; i++) {
        //             for (let j = 0; j < gallery[0].category.length; j++) {
        //                 if (gallery[0].category[j] == resolutions[0].categories[i]) {
        //                     found = true;
        //                     break;
        //                 }
        //             }
        //
        //             if (found == true) {
        //                 break;
        //             }
        //         }
        //
        //         if (!found) {
        //             return { response: { error: 'Not allowed' }, status: 400 };
        //
        //
        //         }
        //
        //     }
        //     if (resolutions[0].photographers && resolutions[0].photographers.length) {
        //         if (resolutions[0].photographers.indexOf(gallery[0].uid.toString()) == -1) {
        //             return { response: { error: 'Not allowed' }, status: 400 };
        //
        //         }
        //     }
        //
        //     if (resolutions[0][`resolution${resolution}px`] <= 0) {
        //         return { response: { error: 'Not allowed' }, status: 400 };
        //     }
        // }


        let check = await db.collection('downloads').find({ uid: uid, galleryId: gallery[0]._id, photoId: photoId, resolution: resolution }).count();
        if (check) {
            await db.collection('downloads').updateOne({ uid: uid, galleryId: gallery[0]._id, photoId: photoId, resolution: resolution }, { $set: { timestamp: Math.floor(new Date().getTime() / 1000) } });
        } else {
            await db.collection('downloads').insertOne({ uid: uid, photo: gallery[0].photos[photoId], galleryId: gallery[0]._id, photoId: photoId, resolution: resolution, timestamp: Math.floor(new Date().getTime() / 1000) });
        }


        let base64;
        try {
            base64 = await storage.resizedOriginalDataUri(gallery[0].photos[photoId].image, resolution);
        } catch (e) {
            return { response: { error: 'Original fotografije nije dostupan.' }, status: 404 };
        }


        let obj = {};
        obj[`resolution${resolution}px`] = -1;
        await db.collection('userResolutions').updateOne({ uid: uid }, { $inc: obj });

        return {
            response: { image: base64 },
            status: 200
        }
    }

    async addToCart(uid, galleryId, photoId, resolution = 3000) {

        let gallery = await db.collection('gallery').find({ _id: ObjectID(galleryId) }).toArray();
        if (!gallery.length) {
            return { error: 'Gallery not found' };
        }

        let check = await db.collection('cart').find({ uid: uid, galleryId: gallery[0]._id, photoId: photoId, resolution: resolution }).count();
        if (check) {
            return { error: 'Photo already in cart' };
        } else {
            await db.collection('cart').insertOne({
                uid: uid,
                galleryId: gallery[0]._id,
                photoId: photoId,
                resolution: resolution,
                photo: gallery[0].photos[photoId],
                timestamp: Math.floor(new Date().getTime() / 1000),
            });
        }

        return { error: null }
    }

    async updateCart(uid, productId, quantity) {
        let product = await db.collection('products').find({ _id: ObjectID(productId) }).toArray();
        if (!product.length) {
            return { error: 'Product not found' };
        }

        let check = await db.collection('cart').find({ uid: uid, productId: product[0]._id }).count();
        if (check) {
            await db.collection('cart').updateOne({ uid: uid, productId: product[0]._id }, {
                $set: {
                    quantity: parseInt(quantity)
                }
            });
        }

        return { error: null }
    }


    async removeFromCart(uid, galleryId, photoId, resolution) {
        let gallery = await db.collection('gallery').find({ _id: ObjectID(galleryId) }).toArray();
        if (!gallery.length) {
            return { error: 'Gallery not found' };
        }

        let check = await db.collection('cart').find({ uid: uid, galleryId: gallery[0]._id, photoId: photoId, resolution: resolution }).count();
        if (!check) {
            return { error: 'Photo not found in cart' };
        }

        await db.collection('cart').deleteOne({ uid: uid, galleryId: gallery[0]._id, photoId: photoId, resolution: resolution });

        return { error: null }
    }

    async emptyCart(uid) {
        await db.collection('cart').deleteMany({ uid: uid });
        return { error: null }
    }

    async cart(uid, localCart) {
        let priceMap = {
            3000: 1,
            1500: 0.5,
            800: 0.15,
        };


        let cart = [];
        if (uid) {
            cart = await db.collection('cart').find({ uid: uid }).toArray();
            if (!cart.length) {
                return [];
            }
        } else {
            if (localCart && localCart.length) {
                for (let i = 0; i < localCart.length; i++) {
                    cart.push({ galleryId: ObjectID(localCart[i].galleryId), photoId: localCart[i].photoId, resolution: localCart[i].resolution })
                }
            } else {
                return [];
            }
        }

        let newCart = [];
        for (let i = 0; i < cart.length; i++) {
            let gallery = await db.collection('gallery').find({ _id: cart[i].galleryId }).toArray();
            if (gallery.length) {
                newCart.push({
                    ...cart[i],
                    ...gallery[0],
                    cartId: cart[i]._id,
                    price: gallery[0].price * priceMap[cart[i].resolution]
                })
            }
        }

        return newCart;

    }


    async calculateShipping(uid, localCart) {
        let cart = [];
        if (uid) {
            cart = await db.collection('cart').find({ uid: uid }).toArray();
            if (!cart.length) {
                return [];
            }
        } else {
            if (localCart && localCart.length) {
                for (let i = 0; i < localCart.length; i++) {
                    cart.push({ productId: ObjectID(localCart[i].productId), quantity: localCart[i].quantity })
                }
            } else {
                return [];
            }
        }

        let stores = {};

        for (let i = 0; i < cart.length; i++) {
            let product = await db.collection('products').find({ _id: cart[i].productId }, { projection: { _id: 1, name: 1, images: 1, price: 1, alias: 1, storeName: 1, storeAlias: 1, storeId: 1, sku: 1, shortDescription: 1, length: 1, width: 1, height: 1, weight: 1 } }).toArray();
            product[0].quantity = cart[i].quantity;

            if (!stores[product[0].storeId.toString()]) {
                stores[product[0].storeId.toString()] = [];
            }

            stores[product[0].storeId.toString()].push(product[0]);
        }


        let shipping = 0;
        console.log(cart)
        for (var key in stores) {
            if (stores[key]) {
                var products = stores[key];
                let store = await db.collection('stores').find({ _id: ObjectID(key) }).toArray();
                let volume = 0;
                let weight = 0;
                for (let i = 0; i < products.length; i++) {
                    volume += ((products[i].length / 100) * (products[i].width / 100) * (products[i].height / 100) * products[i].quantity);
                    weight += (products[i].weight * products[i].quantity);
                }


                if (volume > store[0].shippingVolume && weight < store[0].shippingWeight) {
                    shipping += (store[0].shippingPrice * Math.ceil(volume / store[0].shippingVolume));
                } else if (volume < store[0].shippingVolume && weight > store[0].shippingWeight) {
                    shipping += (store[0].shippingPrice * Math.ceil(weight / store[0].shippingWeight));
                } else {
                    let val1 = volume / store[0].shippingVolume;
                    let val2 = weight / store[0].shippingWeight;
                    if (val1 > val2) {
                        shipping += (store[0].shippingPrice * Math.ceil(volume / store[0].shippingVolume));
                    } else {
                        shipping += (store[0].shippingPrice * Math.ceil(weight / store[0].shippingWeight));
                    }
                }


            }
        }


        return { shipping: shipping };

    }


    async calculateShippingForStore(key, products) {
        let shipping = 0;

        let store = await db.collection('stores').find({ _id: ObjectID(key) }).toArray();
        let volume = 0;
        let weight = 0;

        console.log(products);

        for (let i = 0; i < products.length; i++) {
            volume += ((products[i].length / 100) * (products[i].width / 100) * (products[i].height / 100) * products[i].quantity);
            weight += (products[i].weight * products[i].quantity);
        }


        if (volume > store[0].shippingVolume && weight < store[0].shippingWeight) {
            shipping += (store[0].shippingPrice * Math.ceil(volume / store[0].shippingVolume));
        } else if (volume < store[0].shippingVolume && weight > store[0].shippingWeight) {
            shipping += (store[0].shippingPrice * Math.ceil(weight / store[0].shippingWeight));
        } else {
            let val1 = volume / store[0].shippingVolume;
            let val2 = weight / store[0].shippingWeight;
            if (val1 > val2) {
                shipping += (store[0].shippingPrice * Math.ceil(volume / store[0].shippingVolume));
            } else {
                shipping += (store[0].shippingPrice * Math.ceil(weight / store[0].shippingWeight));
            }
        }

        console.log('shipping: ', shipping)

        return shipping;

    }




    async getPaypalTransaction(orderId) {
        return new Promise((resolve, error) => {
            let getRequest = new paypal.v1.orders.OrdersGetRequest(orderId);
            paypalClient.execute(getRequest).then((res) => {
                if (res.statusCode == 200) {
                    resolve(res.result);
                } else {
                    error();
                }
            })
        })
    }


    async finishOrder(uid, orderId, items) {
        if (orderId) {
            let transaction = await this.getPaypalTransaction(orderId);
            if (transaction.status != 'COMPLETED') {
                return { error: 'Transaction not completed' };
            }


            let cartItems = [];
            for (let i = 0; i < transaction.purchase_units[0].items.length; i++) {
                let cartItem = await db.collection('cart').find({ _id: ObjectID(transaction.purchase_units[0].items[i].sku) }).toArray();
                if (cartItem.length) {
                    cartItems.push(cartItem[0]);
                }
            }


            await db.collection('cart').deleteMany({ uid: uid });


            let transactionId = ObjectID();

            await db.collection('transactions').insertOne({
                _id: transactionId,
                timestamp: Math.floor(new Date().getTime() / 1000),
                transaction: transaction,
            })


            for (let i = 0; i < cartItems.length; i++) {
                let check = await db.collection('downloads').find({ uid: uid, galleryId: cartItems[i].galleryId, photoId: cartItems[i].photoId, resolution: cartItems[i].resolution }).count();
                if (check) {
                    await db.collection('downloads').updateOne({ uid: uid, photo: cartItems[i].photo, galleryId: cartItems[i].galleryId, photoId: cartItems[i].photoId, resolution: cartItems[i].resolution }, { $set: { timestamp: Math.floor(new Date().getTime() / 1000) } });
                } else {
                    await db.collection('downloads').insertOne({ transactionId: transactionId, uid: uid, photo: cartItems[i].photo, galleryId: cartItems[i].galleryId, photoId: cartItems[i].photoId, resolution: cartItems[i].resolution, timestamp: Math.floor(new Date().getTime() / 1000) });
                }
            }


        }/* else {

            let productsQuery = { sku: { $in: items }, price: { $in: ['0', 0, null, '0.00'] } };

            let products = await db.collection('products').find(productsQuery).toArray();
            if (uid) {
                // empty cart
                let cartDeleteQuery = { uid: uid, productId: { $in: [] } };
                for (let i = 0; i < products.length; i++) {
                    cartDeleteQuery['productId']['$in'].push(products[i]._id);
                }

                await db.collection('cart').deleteMany(cartDeleteQuery);
            }

            for (let i = 0; i < products.length; i++) {
                let check = await db.collection('downloads').find({ uid: uid, productId: products[i]._id }).count();
                if (check) {
                    await db.collection('downloads').updateOne({ uid: uid, productId: products[i]._id }, { $set: { timestamp: Math.floor(new Date().getTime() / 1000) } });
                } else {
                    await db.collection('downloads').insertOne({ uid: uid, productId: products[i]._id, timestamp: Math.floor(new Date().getTime() / 1000) });
                }
            }

        }*/

        return { error: null }

    }


    async downloadImage(uid, downloadId) {
        let item = await db.collection('downloads').find({ uid: uid, _id: ObjectID(downloadId) }).toArray();
        if (!item.length) {
            return {
                response: {},
                status: 404
            }
        }

        let base64;
        try {
            base64 = await storage.resizedOriginalDataUri(item[0].photo.image, item[0].resolution);
        } catch (e) {
            return { response: { error: 'Original fotografije nije dostupan.' }, status: 404 };
        }


        return {
            response: { image: base64 },
            status: 200
        }


    }


    async subscribeToNewsletter(email) {
        if (email.indexOf('@') !== -1) {
            await db.collection('subscribers').insertOne({
                email: email,
                timestamp: Math.floor(new Date().getTime() / 1000)
            });
            return { error: null }
        } else {
            return { error: true }

        }
    }

    async orders(uid, page = 0, sort = null) {
        let items = [];
        let total = await db.collection('userOrders').find({ uid: uid }).count();

        if (sort == 'null') {
            sort = null;
        }

        let sortObj = {
            timestamp: -1
        };

        if (sort) {

            if (sort == 'title') {
                sortObj = { 'product.name': 1 }
            }

            if (sort == 'price') {
                sortObj = {
                    'product.price': 1
                }
            }

        };
        items = await db.collection('userOrders').find({ uid: uid }).skip(page * 20).limit(20).sort(sortObj).toArray();


        return {
            total: total,
            items: items
        }
    }

    async downloads(uid, page = 0, sort = null) {
        let items = [];
        let total = await db.collection('downloads').find({ uid: uid }).count();
        let downloads = [];


        downloads = await db.collection('downloads').find({ uid: uid }).skip(page * 20).limit(20).sort({ timestamp: -1 }).toArray();

        for (let i = 0; i < downloads.length; i++) {
            let gallery = await db.collection('gallery').find({ _id: downloads[i].galleryId }).toArray();
            if (gallery.length) {
                items.push(
                    {
                        ...gallery[0],
                        ...downloads[i]
                    }
                );
            }
        }



        return {
            total: total,
            items: items
        }
    }

    async userGallery(uid, page = 0) {
        let total = await db.collection('gallery').find({ uid: ObjectID(uid) }).count();
        let items = [];


        items = await db.collection('gallery').find({ uid: ObjectID(uid) }).skip(page * 20).limit(20).sort({ published: -1 }).toArray();

        return {
            total: total / 20,
            items: items
        }
    }


    async photographerStatistics(uid) {
        console.log(uid);
        let photoVisits = await db.collection('photoVisits').find({ galleryUid: ObjectID(uid) }).toArray();
        let res = {};
        for (let i = 0; i < photoVisits.length; i++) {
            if (!photoVisits[i].photo) {
                continue;
            }


            if (!res[photoVisits[i].galleryId.toString() + '_' + photoVisits[i].photo.name]) {
                res[photoVisits[i].galleryId.toString() + '_' + photoVisits[i].photo.name] = {
                    photo: photoVisits[i].photo,
                    count: 0
                }
            }

            res[photoVisits[i].galleryId.toString() + '_' + photoVisits[i].photo.name].count++;
        }

        let arr = Object.values(res);

        arr.sort((a, b) => b.count - a.count);

        return arr;
    }

    /**
     * Upit za cenu arhivske fotografije.
     *
     * Za starije galerije se cena ne prikazuje; kupac ostavlja svoju adresu,
     * a agenciji stiže poruka sa podacima o tome koja je fotografija u
     * pitanju, da bi mogla da odgovori ponudom.
     */
    async priceInquiry(obj) {
        const email = (obj.email || '').trim();
        if (email.indexOf('@') === -1) {
            return { response: { error: 'Unesite ispravnu e-mail adresu.' }, status: 400 };
        }

        const gallery = await db.collection('gallery').findOne({ _id: ObjectID(obj.galleryId) });
        if (!gallery) {
            return { response: { error: 'Galerija nije pronađena.' }, status: 404 };
        }

        const photoIndex = parseInt(obj.photoId, 10);
        const photo = (gallery.photos && gallery.photos[photoIndex]) || null;
        const naziv = (gallery.name && (gallery.name.ba || gallery.name.en)) || '';
        const link = `${SITE_URL}/galerija/${gallery.alias && gallery.alias.ba}/${gallery._id}`;

        const html = `<html><body style="font-family: Arial, sans-serif; color:#1a1d29">
            <h2 style="margin:0 0 14px">Upit za cenu fotografije</h2>
            <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
                <tr><td><b>E-mail kupca</b></td><td>${email}</td></tr>
                <tr><td><b>Galerija</b></td><td>${naziv}</td></tr>
                <tr><td><b>Fotografija</b></td><td>${photo ? (photo.name || photo.image) : 'nije naznačena'}</td></tr>
                <tr><td><b>Datum snimka</b></td><td>${gallery.date ? new Date(gallery.date * 1000).toLocaleDateString('sr-RS') : '-'}</td></tr>
                <tr><td><b>Rezolucija</b></td><td>${obj.resolution ? obj.resolution + ' px' : 'nije naznačena'}</td></tr>
                <tr><td><b>Link</b></td><td><a href="${link}">${link}</a></td></tr>
            </table>
            ${obj.message ? `<p style="margin-top:14px"><b>Poruka kupca:</b><br>${String(obj.message).slice(0, 1000)}</p>` : ''}
            <p style="margin-top:18px;color:#7c828f;font-size:13px">Odgovorite direktno na adresu kupca.</p>
        </body></html>`;

        sendMail('info@zipaphoto.net', `Upit za cenu — ${naziv}`, html);

        // potvrda kupcu da je upit primljen
        sendMail(email, 'Vaš upit je primljen — ZIPA PHOTO', `<html><body style="font-family: Arial, sans-serif; color:#1a1d29">
            <p>Poštovani,</p>
            <p>primili smo Vaš upit za fotografiju <b>${naziv}</b>. Javićemo Vam se sa ponudom u najkraćem roku.</p>
            <p style="margin-top:18px">Srdačan pozdrav,<br><b>ZIPA PHOTO AGENCY</b></p>
        </body></html>`);

        return { response: { error: null }, status: 200 };
    }

    async contact(obj) {
        let html = `<html>
        <body>
            <table>
            <tr>
                <td>Ime</td>
                <td>${obj.firstName} ${obj.lastName}</td>
            </tr>
            <tr>
                <td>E-mail</td>
                <td>${obj.email}</td>
            </tr>
            <tr>
                <td>Poslovni telefon</td>
                <td>${obj.bussinessPhone}</td>
            </tr>
            <tr>
            <td>Država</td>
            <td>${obj.country}</td>
        </tr>

        <tr>
        <td>Posao</td>
        <td>${obj.jobeRole}</td>
    </tr>

    <tr>
    <td>Pozicija</td>
    <td>${obj.jobLevel}</td>
</tr>

<tr>
<td>Industrija</td>
<td>${obj.industry}</td>
</tr>

<tr>
<td>Kompanija</td>
<td>${obj.company}</td>
</tr>


            </table>
            <p>${obj.message}</p>
        </body>
        </html>`;

        sendMail('info@zipaphoto.net', 'Kontakt', html);


    }

    async insertCategories() {
        await db.collection('categories').insertOne({
            name: { ba: 'Vijesti' },
            position: 0,
            isRecommended: true,
            isVisibleOnNav: false,
            isVisible: true
        })
        await db.collection('categories').insertOne({
            name: { ba: 'Reportaže' },
            position: 1,
            isRecommended: false,
            isVisibleOnNav: false,
            isVisible: true
        })
        await db.collection('categories').insertOne({
            name: { ba: 'Sport' },
            position: 2,
            isRecommended: true,
            isVisibleOnNav: false,
            isVisible: true
        })
        await db.collection('categories').insertOne({
            name: { ba: 'COVID-19' },
            position: 3,
            isRecommended: true,
            isVisibleOnNav: true,
            isVisible: true
        })
    }


}

module.exports = UsersModule;