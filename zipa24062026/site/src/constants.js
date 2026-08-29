/*
 * ADRESE — API i slike.
 *
 * Vrednosti iz `process.env.RAZZLE_*` Razzle UGRADI U SNOP pri gradnji. Ako
 * promenljive nisu postojale u trenutku gradnje, u snopu zauvek ostaje
 * `http://localhost:10015` — sajt onda radi kod nas, a na produkciji trazi
 * slike sa localhost-a. Server to ne pogadja jer svoj `process.env` cita u
 * trenutku pokretanja, pa je prikaz sa servera ispravan a sve sto pregledac
 * naknadno iscrta pokazuje na localhost. Odatle „gore se vidi, dole ne".
 *
 * Zato adrese stizu i KROZ STRANU: `server.js` ih upise u `window.__ADRESE__`
 * pre snopa, procitane iz zive okoline. Pregledac uzima njih, pa ispravna
 * adresa ne zavisi od toga da li je promenljiva postojala pri gradnji.
 */
const izStrane = (typeof window !== 'undefined' && window.__ADRESE__) || {};

// Adresa API servera (podaci, prijava, korpa, preuzimanje originala).
export const API_ENDPOINT =
    izStrane.api || process.env.RAZZLE_API_ENDPOINT || 'http://localhost:10015'

// Adresa sa koje se povlace watermarkovani pregledi fotografija.
// U produkciji je to Cloudflare Worker (slike idu sa CDN-a, ne kroz API);
// lokalno, ako nije postavljena, pregledi idu kroz sam API kao i do sada.
export const PHOTOS_ENDPOINT =
    izStrane.photos || process.env.RAZZLE_PHOTOS_ENDPOINT || API_ENDPOINT
