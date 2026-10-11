/**
 * ZIPA — Cloudflare Worker za serviranje pregleda fotografija.
 *
 * Sličice (350x) i pregledi (700x) su watermarkovani, pa smeju javno — serviraju
 * se direktno sa Cloudflare edge mreže, bez prolaska kroz API server. To je i
 * brže (najbliži server posetiocu + keš) i skida teret sa API-ja, jer jedna
 * strana galerije zna da povuče i 150+ sličica.
 *
 * ORIGINALI SE OVDE NIKAD NE SERVIRAJU — prefiks `originals/` je nedostupan.
 * Puna rezolucija ide isključivo kroz API (`/gallery/download/...`), uz proveru
 * pretplate i prava, kao i do sada.
 *
 * Putanje su namerno iste kao na API-ju (`/photos/350x/<fotograf>/<fajl>.jpg`),
 * pa je prelazak sa API-ja na CDN samo promena bazne adrese u sajtu.
 */
export default {
    async fetch(request, env, ctx) {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return new Response('Method not allowed', { status: 405 });
        }

        const url = new URL(request.url);

        /*
         * Dozvoljeno je samo /photos/350x/... i /photos/700x/..., uz neobavezan
         * prefiks verzije (`/v4/photos/...`). Prefiks postavlja sajt
         * (`VERZIJA_SLIKA` u `site/src/constants.js`): nova verzija je nova
         * adresa, pa i pregledač koji ima staru kopiju bez žiga mora da povuče
         * novu. Uveden 2026-10-11.
         */
        const match = url.pathname.match(/^(?:\/v\d+)?\/photos\/(350x|700x)\/(.+)$/);
        if (!match) {
            return new Response('Not found', { status: 404 });
        }

        const size = match[1];
        let image;
        try {
            image = decodeURIComponent(match[2]);
        } catch (e) {
            return new Response('Bad request', { status: 400 });
        }
        if (image.includes('..')) {
            return new Response('Bad request', { status: 400 });
        }

        const key = `${size}/${image}`;

        /*
         * Edge keš: iste sličice se traže hiljadama puta.
         *
         * I edge i pregledač čuvaju kopiju JEDAN DAN, ne godinu. Pregled pod
         * istim imenom ume da se napravi iznova (žig koji je falio —
         * `api/popravi-zig.js`); sa godinu dana bi stara kopija bez žiga
         * ostala vidljiva, a keš preko Cache API-ja na workers.dev ne može da
         * se očisti iz Cloudflare-a. Ovako popravka stigne do svakoga
         * najkasnije za dan — a odmah, povećanjem `VERZIJA_SLIKA` na sajtu.
         *
         * VERZIJA_KESA (deo ključa) ostaje za hitno brisanje edge keša:
         *   2 — 2026-10-10, „31. Sajam knjige" je bio keširan bez žiga.
         *   3 — 2026-10-11, provera cele arhive (`api/skeniraj-zig.js`).
         *   4 — 2026-10-11, keš skraćen na dan.
         */
        const VERZIJA_KESA = '4';
        const cache = caches.default;
        const kljucKesa = new URL(url.toString());
        kljucKesa.searchParams.set('__k', VERZIJA_KESA);
        const cacheKey = new Request(kljucKesa.toString(), request);
        const cached = await cache.match(cacheKey);
        if (cached) return cached;

        const object = await env.BUCKET.get(key);
        if (!object) {
            return new Response('Not found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=86400');
        headers.set('Access-Control-Allow-Origin', '*');

        const response = new Response(object.body, { headers });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
    },
};
