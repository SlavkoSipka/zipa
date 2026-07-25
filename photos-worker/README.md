# ZIPA — Worker za slike

Servira watermarkovane preglede fotografija (`350x`, `700x`) direktno sa Cloudflare
edge mreže, umesto kroz API server.

**Originali (`originals/`) su ovde nedostupni** — puna rezolucija ide isključivo kroz
API uz proveru pretplate.

## Zašto

Jedna strana galerije povuče 24 sličice, a otvaranje galerije i do 156. Kada to ide
kroz Node API, svaka sličica je jedan zahtev ka serveru. Sa Workerom slike stižu sa
Cloudflare servera najbližeg posetiocu, keširane, i ne opterećuju API.

## Deploy

```bash
cd photos-worker
npx wrangler login      # otvara browser, ulogovati se na Cloudflare nalog
npx wrangler deploy
```

Dobijaš URL oblika `https://zipa-photos.<tvoj-subdomen>.workers.dev`.
Taj URL ide u sajt kao `RAZZLE_PHOTOS_ENDPOINT`.

Provera da radi:

```bash
curl -I https://zipa-photos.<subdomen>.workers.dev/photos/350x/admin/20130203_Ljubacevo-zima_01_9d9a165d9585d43ba2b5ee2c24f43483.jpg
# ocekivano: HTTP 200, content-type: image/jpeg

curl -I https://zipa-photos.<subdomen>.workers.dev/photos/originals/bilo-sta.jpg
# ocekivano: HTTP 404 (originali nisu dostupni)
```

## Kasnije: sopstveni domen

U Cloudflare dashboardu → Workers → `zipa-photos` → Settings → Domains & Routes
može se dodati npr. `slike.zipaphoto.net`. Tada se samo promeni
`RAZZLE_PHOTOS_ENDPOINT` na sajtu.

## Cena

Besplatan plan: 100.000 zahteva dnevno. Keširane slike se ne broje, pa je realno
znatno više pregleda. Izlazni saobraćaj iz R2 je besplatan.
