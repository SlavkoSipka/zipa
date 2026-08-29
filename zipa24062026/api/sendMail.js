/*
 * SLANJE POŠTE — Resend (HTTPS API), od 2026-08-28.
 *
 * Ranije je ovde stajao `nodemailer` preko SMTP-a na `mail.zipaphoto.net:25`.
 * Tri stvari su ga činile nepouzdanim:
 *
 *   1. PORT 25. Render — kao i skoro svi provajderi — blokira odlazni port 25.
 *      Provereno: veza se otvori ali server nikad ne pošalje pozdrav, pa
 *      istekne. Na produkciji bi slanje viselo pa palo.
 *   2. GREŠKE SE NISU VIDELE. Stara funkcija je koristila callback i nije
 *      vraćala `Promise`, pa je `await sendMail(...)` u petlji newslettera
 *      odmah prolazio, a `try/catch` oko njega bio mrtav kod. Newsletter se
 *      označavao „Poslato" i kad nijedna poruka nije otišla.
 *   3. ISPORUKA. Domen nema DKIM ni DMARC, a SPF se završava sa `?all`.
 *      Resend potpisuje poruke svojim DKIM-om nad proverenim domenom.
 *
 * POTPIS FUNKCIJE JE NEPROMENJEN — `(to, subject, html)`. Svih 13 poziva iz
 * ostatka koda radi bez ijedne izmene. Razlika je što sada vraća `Promise`
 * koji se ODBIJA na grešci, pa pozivalac može da je uhvati.
 */
const { Resend } = require('resend');

const API_KLJUC = process.env.RESEND_API_KEY;

/*
 * Adresa pošiljaoca. Domen mora biti proveren u Resend nalogu, inače Resend
 * odbija zahtev sa `validation_error`. Dok se domen ne proveri, može se
 * privremeno postaviti `MAIL_FROM=onboarding@resend.dev`, ali takva pošta ide
 * SAMO na adresu vlasnika naloga.
 */
const OD = process.env.MAIL_FROM || 'ZIPA PHOTO <noreply@zipaphoto.net>';

/*
 * SLIKE I VEZE U ŠABLONIMA
 *
 * Šabloni u `emails/` su do 2026-08-28 vukli logo i ikone sa
 * `zipa-mail-assets.novamedia.agency`. Taj host ne odgovara (DNS pokazuje na
 * 94.130.217.122, ali ni HTTP ni HTTPS ne daju ništa), pa je svaka poslata
 * poruka stizala bez logotipa. Ikone društvenih mreža su uz to imale
 * `href="#"` — nisu vodile nikuda — i izbačene su iz šablona.
 *
 * Sada šabloni nose dve oznake koje se popunjavaju ovde:
 *
 *   %%SLIKE%%  →  odakle se povlači logo (API servira `mail-assets/`)
 *   %%SAJT%%   →  javni URL sajta, za veze ka galerijama
 *
 * `String.format` menja samo `{0}`, `{1}`… pa se ove oznake ne sudaraju
 * sa njim.
 */
const { API_ENDPOINT, SITE_URL } = require('./constants');
const SLIKE = process.env.MAIL_ASSETS_URL || `${API_ENDPOINT}/mail-assets`;

function popuniOznake(html) {
    if (typeof html !== 'string') return html;
    return html
        .split('%%SLIKE%%').join(SLIKE)
        .split('%%SAJT%%').join(SITE_URL);
}

if (!API_KLJUC) {
    console.error('[posta] RESEND_API_KEY nije postavljen — pošta se neće slati.');
}

const resend = API_KLJUC ? new Resend(API_KLJUC) : null;

/**
 * Šalje jednu poruku.
 *
 * @param {string} to      adresa primaoca
 * @param {string} subject naslov
 * @param {string} html    telo poruke
 * @returns {Promise<{id: string}>} razrešava se sa oznakom poslate poruke;
 *          ODBIJA SE ako slanje ne uspe — to je razlika u odnosu na staru
 *          verziju i na tome se oslanja petlja u `sendNewsletter`.
 */
module.exports = async function (to, subject, html) {
    if (!resend) {
        throw new Error('RESEND_API_KEY nije postavljen');
    }

    const { data, error } = await resend.emails.send({
        from: OD,
        to: [to],
        subject: subject,
        html: popuniOznake(html),
    });

    if (error) {
        // Resend vraća grešku u telu odgovora, ne kao izuzetak.
        const poruka = error.message || error.name || 'nepoznata greška';
        console.error('[posta] slanje na', to, 'nije uspelo:', poruka);
        throw new Error(poruka);
    }

    console.log('[posta] poslato na', to, '| id:', data && data.id);
    return data;
};
