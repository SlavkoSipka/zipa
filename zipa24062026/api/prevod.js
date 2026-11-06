/*
 * PREVOD NA ENGLESKI (2026-10-30, dorađeno 2026-11-06)
 *
 * Nove galerije dobijaju engleski naziv i opis same, da agencija ne mora da
 * ih kuca dvaput. Upisuje se kad je englesko polje „prazno" — a prazno je i
 * kad je u njemu samo kopija srpskog teksta ili samo potpis „(ZIPAPHOTO…)".
 * Ranije se ta dva slučaja nisu računala, pa se naslov nikad nije prevodio
 * (strana je kopirala srpski naslov u engleski), a opis samo ponekad. Ručno
 * upisan engleski tekst se ne dira.
 *
 * Izvori, redom:
 *   1. Claude (`ANTHROPIC_API_KEY`) — najbolji prevod: zna da je reč o
 *      agenciji za fotografije, čuva imena, mesta i ćirilicu/latinicu.
 *   2. DeepL (`DEEPL_API_KEY`).
 *   3. MyMemory, bez ključa — samo rezerva (oko 5.000 znakova dnevno).
 * Ako nijedan ne uspe, engleski dobija srpski tekst, da engleska verzija
 * sajta ne ostane prazna; pri sledećem čuvanju prevod se pokušava ponovo.
 * Prevod nikad ne obara čuvanje galerije.
 */
const fetch = require('node-fetch');

const NAJDUZE = 4500;      // znakova po pozivu
const ROK = 20000;         // ms — posle toga se odustaje od tog izvora

// Potpis na kraju opisa, npr. „(ZIPAPHOTO/Borislav Zdrinja)" — ne prevodi se.
const POTPIS = /\s*\(\s*ZIPA\s*PHOTO[^)]*\)\s*$/i;

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

let claude = null;
function klijentClaude() {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    if (!claude) {
        const Anthropic = require('@anthropic-ai/sdk');
        claude = new (Anthropic.default || Anthropic)();
    }
    return claude;
}

const UPUTSTVO = [
    'You translate texts for ZIPA PHOTO, a press photo agency from Banja Luka (Republika Srpska, Bosnia and Herzegovina).',
    'Translate the user text from Serbian (Latin or Cyrillic script) into natural, concise British news English, as a photo agency caption or gallery title would read.',
    'Keep personal names, organisation names and place names correct (e.g. Banja Luka, Republika Srpska, Vidovdan); transliterate Cyrillic names to Latin with diacritics.',
    'Keep line breaks. If the input is a short title in capital letters, return the title in capital letters too.',
    'Reply with the translation only: no quotes, no notes, no explanations.',
].join(' ');

async function prekoClaude(tekst) {
    const c = klijentClaude();
    if (!c) return null;
    const odgovor = await c.beta.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 4000,
        output_config: { effort: 'low' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: UPUTSTVO,
        messages: [{ role: 'user', content: tekst }],
    });
    if (odgovor.stop_reason === 'refusal') return null;
    const deo = odgovor.content.find((b) => b.type === 'text');
    const prevod = deo && deo.text ? deo.text.trim() : '';
    return prevod || null;
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
        body: JSON.stringify({ text: [tekst], target_lang: 'EN-GB' }),
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

    for (const [ime, izvor] of [['Claude', prekoClaude], ['DeepL', prekoDeepL], ['MyMemory', prekoMyMemory]]) {
        try {
            const prevod = await saRokom(izvor(kratko));
            if (prevod) return prevod;
        } catch (e) {
            console.error(`[prevod] ${ime} nije uspeo:`, e.message);
        }
    }
    return null;
}

// Englesko polje se popunjava kad je prazno, kopija srpskog ili samo potpis.
function trebaPrevod(polje) {
    const ba = String(polje.ba || '').trim();
    const en = String(polje.en || '').trim();
    if (!en) return true;
    if (en === ba) return true;
    return en.replace(POTPIS, '').trim() === '';
}

/**
 * Dopuni englesku vrednost dvojezičnog polja ({ba, en}).
 *
 * Potpis „(ZIPAPHOTO/…)" sa kraja srpskog teksta se ne prevodi nego se
 * prepisuje na kraj prevoda. Vraća isti objekat radi lakšeg nizanja.
 */
async function dopuniEngleski(polje) {
    if (!polje || typeof polje !== 'object') return polje;
    if (!polje.ba || String(polje.ba).trim() === '') return polje;
    if (!trebaPrevod(polje)) return polje;

    const ba = String(polje.ba);
    const potpis = (ba.match(POTPIS) || [''])[0];
    const telo = potpis ? ba.slice(0, ba.length - potpis.length) : ba;

    const prevod = telo.trim() ? await prevediNaEngleski(telo) : '';
    polje.en = prevod !== null
        ? (prevod + (potpis ? '\n\n' + potpis.trim() : '')).trim()
        : ba;    // bez prevoda: srpski tekst, pokušava se opet pri sledećem čuvanju
    return polje;
}

module.exports = { prevediNaEngleski, dopuniEngleski, trebaPrevod };
