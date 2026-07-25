// Adresa API servera (podaci, prijava, korpa, preuzimanje originala).
export const API_ENDPOINT = process.env.RAZZLE_API_ENDPOINT || 'http://localhost:10015'

// Adresa sa koje se povlače watermarkovani pregledi fotografija.
// U produkciji je to Cloudflare Worker (slike idu sa CDN-a, ne kroz API);
// lokalno, ako nije postavljena, pregledi idu kroz sam API kao i do sada.
export const PHOTOS_ENDPOINT = process.env.RAZZLE_PHOTOS_ENDPOINT || API_ENDPOINT
