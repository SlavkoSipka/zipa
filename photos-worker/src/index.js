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

        // Dozvoljeno je samo /photos/350x/... i /photos/700x/...
        const match = url.pathname.match(/^\/photos\/(350x|700x)\/(.+)$/);
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

        // Edge keš: iste sličice se traže hiljadama puta
        const cache = caches.default;
        const cacheKey = new Request(url.toString(), request);
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
        // Fajlovi se nikad ne menjaju pod istim imenom -> može dug keš
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');

        const response = new Response(object.body, { headers });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
    },
};
