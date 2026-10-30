/*
 * PREVOD NA ENGLESKI (2026-10-30)
 *
 * Nove galerije dobijaju engleski naziv i opis same, da agencija ne mora da
 * ih kuca dvaput. Prevod je SAMO ISPOMOĆ: upisuje se jedino kad je englesko
 * polje prazno, pa svaka ručna izmena ostaje netaknuta i uvek se može
 * ispraviti u administraciji.
 *
 * Dva izvora, redom:
 *
 *   1. DeepL, ako u okolini stoji `DEEPL_API_KEY` (besplatan nalog daje
 *      500.000 znakova mesečno i daleko bolji prevod).
 *   2. MyMemory, bez ključa — rezerva da prevod radi i dok ključa nema.
 *      Besplatno je oko 5.000 znakova dnevno po adresi, pa se koristi samo
 *      za kratke tekstove.
 *
 * Ako nijedan ne odgovori na vreme, vraća se `null` i čuvanje galerije teče
 * dalje — prevod nikad ne sme da obori upis.
 */
const fetch = require('node-fetch');

const NAJDUZE = 4500;      // znakova po pozivu
const ROK = 8000;          // ms — posle toga se odustaje

async function saRokom(obecanje, rok = ROK) {
    let merac;
    try {
        return await Promise.race([
            obecanje,
            new Promise((_, odbij) => { merac = setTimeout(() => odbij(new Error('istekao rok')), rok); }),
        ]);
    } finally {
        clearTimeout(merac);
    }
}

async function prekoDeepL(tekst) {
    const kljuc = process.env.DEEPL_API_KEY;
    if (!kljuc) return null;

    // Besplatni nalozi idu na `api-free`, plaćeni na `api`.
    const domacin = kljuc.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com';
    const odgovor = await fetch(`https://${domacin}/v2/translate`, {
        method: 'POST',
        headers: {
            'Authorization': `DeepL-Auth-Key ${kljuc}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: [tekst], source_lang: 'SR', target_lang: 'EN-US' }),
    });

    if (!odgovor.ok) throw new Error(`DeepL ${odgovor.status}`);
    const telo = await odgovor.json();
    return (telo.translations && telo.translations[0] && telo.translations[0].text) || null;
}

async function prekoMyMemory(tekst) {
    const adresa = 'https://api.mymemory.translated.net/get?q='
        + encodeURIComponent(tekst) + '&langpair=sr|en';
    const odgovor = await fetch(adresa);
    if (!odgovor.ok) throw new Error(`MyMemory ${odgovor.status}`);

    const telo = await odgovor.json();
    const prevod = telo && telo.responseData && telo.responseData.translatedText;

    // Servis na grešku vraća poruku kao „prevod" — tada se ne upisuje ništa.
    if (!prevod || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(prevod)) return null;
    return prevod;
}

/**
 * Prevede jedan tekst na engleski. Vraća `null` kad prevod nije uspeo.
 */
async function prevediNaEngleski(tekst) {
    const t = String(tekst || '').trim();
    if (!t) return null;

    const kratko = t.length > NAJDUZE ? t.slice(0, NAJDUZE) : t;

    try {
        const deepl = await saRokom(prekoDeepL(kratko));
        if (deepl) return deepl;
    } catch (e) {
        console.error('[prevod] DeepL nije uspeo:', e.message);
    }

    try {
        return await saRokom(prekoMyMemory(kratko));
    } catch (e) {
        console.error('[prevod] MyMemory nije uspeo:', e.message);
        return null;
    }
}

/**
 * Dopuni englesku vrednost dvojezičnog polja ({ba, en}).
 *
 * Menja SAMO prazno englesko polje; ako je neko već uneo engleski tekst,
 * ostaje kako jeste. Vraća isti objekat radi lakšeg nizanja.
 */
async function dopuniEngleski(polje) {
    if (!polje || typeof polje !== 'object') return polje;
    if (!polje.ba || String(polje.ba).trim() === '') return polje;
    if (polje.en && String(polje.en).trim() !== '') return polje;

    const prevod = await prevediNaEngleski(polje.ba);
    if (prevod) polje.en = prevod;
    return polje;
}

module.exports = { prevediNaEngleski, dopuniEngleski };
