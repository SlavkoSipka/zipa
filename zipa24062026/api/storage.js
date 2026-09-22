/**
 * Skladište fotografija — Cloudflare R2 (S3-kompatibilan API).
 *
 * Zamenjuje stari lokalni `photos-store/` folder. Struktura u bucketu je ista
 * kao što je bila na starom serveru, pa putanje iz baze (`<fotograf>/<fajl>.jpg`)
 * rade bez ikakve izmene:
 *
 *   originals/<fotograf>/<fajl>.jpg   — puna rezolucija (PRIVATNO, prodaje se)
 *   350x/<fotograf>/<fajl>.jpg        — thumbnail sa watermarkom
 *   700x/<fotograf>/<fajl>.jpg        — pregled sa watermarkom
 *
 * Bucket je namerno PRIVATAN — originali se nikad ne serviraju direktno, nego
 * samo kroz API nakon provere prava (kao i do sada).
 */
const { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const R2 = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET || 'zipa-photos',
};

if (!R2.accountId || !R2.accessKeyId || !R2.secretAccessKey) {
    console.error('[storage] Nedostaju R2_* varijable — napravi .env po uzoru na .env.example');
}

/*
 * Koliko veza ka R2 sme da bude otvoreno odjednom.
 *
 * Podrazumevanih 50 je premalo: jedna galerija ume da ima 150+ fotografija,
 * a sve sličice idu kroz ovaj API (lokalno uvek, na produkciji kad Worker
 * nije podešen). Preko te granice se zahtevi REDAJU — mereno 2026-09-23:
 * „socket usage at capacity=50 and 693 additional requests are enqueued",
 * posle čega API prestane da odgovara i na obične pozive, pa se galerija
 * uopšte ne otvori.
 */
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const https = require('https');

const client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2.accessKeyId,
        secretAccessKey: R2.secretAccessKey,
    },
    requestHandler: new NodeHttpHandler({
        httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 256 }),
        connectionTimeout: 5000,
        requestTimeout: 30000,
    }),
});

/** Da li objekat postoji u bucketu */
async function exists(key) {
    try {
        await client.send(new HeadObjectCommand({ Bucket: R2.bucket, Key: key }));
        return true;
    } catch (e) {
        return false;
    }
}

/** Vrati ceo objekat kao Buffer (baca grešku ako ne postoji) */
async function getBuffer(key) {
    const res = await client.send(new GetObjectCommand({ Bucket: R2.bucket, Key: key }));
    const chunks = [];
    for await (const chunk of res.Body) chunks.push(chunk);
    return Buffer.concat(chunks);
}

/** Vrati stream + metapodatke (za direktno prosleđivanje u HTTP odgovor) */
async function getStream(key) {
    const res = await client.send(new GetObjectCommand({ Bucket: R2.bucket, Key: key }));
    return {
        body: res.Body,
        contentType: res.ContentType || 'image/jpeg',
        contentLength: res.ContentLength,
        etag: res.ETag,
        lastModified: res.LastModified,
    };
}

/** Upload objekta (koristi se pri uploadu novih fotografija) */
async function put(key, body, contentType = 'image/jpeg') {
    await client.send(new PutObjectCommand({
        Bucket: R2.bucket, Key: key, Body: body, ContentType: contentType,
    }));
}

// Pomoćne funkcije za putanje — jedino mesto koje zna raspored foldera
const originalKey = (image) => `originals/${image}`;
const previewKey = (size, image) => `${size}/${image}`;

/**
 * Preuzmi original iz R2 i vrati ga smanjenog na traženu širinu, kao data-URI.
 * Zamena za stari `easyimage.resize` nad lokalnim fajlom (radi u memoriji, bez
 * temp fajlova i bez potrebe za ImageMagick-om na serveru).
 */
async function resizedOriginalDataUri(image, width) {
    const sharp = require('sharp');
    const input = await getBuffer(originalKey(image));
    const out = await sharp(input)
        .rotate()                                   // ispoštuj EXIF orijentaciju
        .resize({ width: parseInt(width, 10), withoutEnlargement: true })
        .jpeg({ quality: 100 })
        .toBuffer();
    return 'data:image/jpeg;base64,' + out.toString('base64');
}

/** Postoji li original za datu sliku (stari sajt je brisao stare originale) */
const originalExists = (image) => exists(originalKey(image));

module.exports = {
    exists, getBuffer, getStream, put,
    originalKey, previewKey, originalExists, resizedOriginalDataUri, R2,
};
