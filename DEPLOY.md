# Postavljanje sajta na internet

Sistem ima tri dela:

```
sajt (Render)  ──слike──▶  Cloudflare Worker  ──▶  R2 bucket
               ──podaci─▶  API (Render)       ──▶  Supabase
```

Slike ne prolaze kroz API — idu direktno sa Cloudflare mreže, jer jedna galerija
zna da povuče i 150+ sličica. Originali ostaju privatni i idu samo kroz API.

Redosled je bitan: **Worker → API → sajt**, jer svaki sledeći korak traži URL prethodnog.

---

## 1. Cloudflare Worker (slike) — ✅ URAĐENO

Postavljen je na:

```
https://zipa-photos.zipa-photo-agency.workers.dev
```

Ponovni deploy posle izmena koda:
```bash
cd photos-worker && npx wrangler deploy
```

Provereno da radi kako treba:
- `/photos/350x/...` i `/photos/700x/...` → 200, `image/jpeg`, keširano godinu dana
- `/photos/originals/...`, `/originals/...`, `..` obilaznice → 404

> Novi `workers.dev` poddomen prvih par minuta vraća SSL grešku dok se izdaje
> sertifikat — to prođe samo od sebe.

---

## 2. API na Renderu

1. [render.com](https://render.com) → **New → Web Service** → poveži GitHub repo `zipa`
2. Podešavanja:
   - Root Directory: `zipa24062026/api`
   - Build Command: `npm install`
   - Start Command: `node app.js`
   - Region: Frankfurt (najbliži)
3. **Environment** → dodaj varijable (vrednosti su u tvom lokalnom `zipa24062026/api/.env`):

   | Key | Vrednost |
   |---|---|
   | `DATABASE_URL` | Supabase connection string |
   | `R2_ACCOUNT_ID` | iz .env |
   | `R2_ACCESS_KEY_ID` | iz .env |
   | `R2_SECRET_ACCESS_KEY` | iz .env |
   | `R2_BUCKET` | `zipa-photos` |
   | `JWT_SECRET` | iz .env (**mora ostati isti** — inače svi korisnici ispadaju iz sesije) |
   | `ADMIN_JWT_SECRET` | iz .env |
   | `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | iz .env |
   | `NODE_VERSION` | `20` |

   > ⚠️ **`PORT` NE prenositi iz `.env`.** Port zadaje Render; ako se postavi ručno,
   > server sluša na pogrešnom portu i sve rute vraćaju 404 uz zaglavlje
   > `x-render-routing: no-server`.

4. Deploy → dobiješ URL, npr. `https://zipa-api.onrender.com`
5. Vrati se u Environment i dodaj `API_ENDPOINT` = taj URL → Save (ponovo se deployuje)

Provera: `https://<api-url>/categories` treba da vrati JSON sa kategorijama.

---

## 3. Sajt na Renderu

1. **New → Web Service** → isti repo
2. Podešavanja:
   - Root Directory: `zipa24062026/site`
   - Build Command:
     ```
     npm install --legacy-peer-deps && rm -rf node_modules/fsevents && NODE_OPTIONS=--openssl-legacy-provider npm run build
     ```
   - Start Command: `SERVER_PORT=$PORT npm run start:prod`
3. **Environment**:

   | Key | Vrednost |
   |---|---|
   | `RAZZLE_API_ENDPOINT` | URL API-ja iz koraka 2 |
   | `RAZZLE_PHOTOS_ENDPOINT` | `https://zipa-photos.zipa-photo-agency.workers.dev` |
   | `NODE_VERSION` | `20` |

4. Deploy → to je link koji šalješ klijentu.

> Ove dve `RAZZLE_` varijable se ugrađuju u build. Ako ih kasnije menjaš,
> pokreni **Manual Deploy → Clear build cache & deploy**.

---

## Umesto ručnog podešavanja: Blueprint

U repou postoji `render.yaml`. U Renderu **New → Blueprint** → izaberi repo i
oba servisa se naprave odjednom; ostaje samo da uneseš tajne u UI.

---

## Napomene

- **Besplatan Render plan uspava servis** posle 15 min neaktivnosti — prvo otvaranje
  posle toga čeka ~30–50 s. Za demo klijentu je u redu; za produkciju je plaćeni
  plan (~7 $/mesec po servisu) ili držati servis budnim.
- **Supabase besplatni plan pauzira bazu** posle 7 dana neaktivnosti. Ako sajt
  odjednom nema podatke, probudi projekat u Supabase dashboardu.
- Slike se keširaju na Cloudflare-u; izlazni saobraćaj iz R2 je besplatan.
- Lokalni razvoj se ne menja: bez `RAZZLE_PHOTOS_ENDPOINT` slike idu kroz API.
