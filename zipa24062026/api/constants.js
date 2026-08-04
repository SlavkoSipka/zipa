// Konekcija na Supabase Postgres. Kredencijali se čitaju iz okruženja (.env).
const dbAuth = {
  pgConnectionString: process.env.DATABASE_URL
}

const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:10015'

// Adresa samog sajta — koristi se u linkovima koje šaljemo mejlom
// (verifikacija naloga, promena lozinke, upit za cenu).
const SITE_URL = process.env.SITE_URL || 'http://localhost:10016'

if (!dbAuth.pgConnectionString) {
  console.error('[constants] Nedostaje DATABASE_URL — napravi .env po uzoru na .env.example');
}

module.exports = {
  dbAuth: dbAuth,
  API_ENDPOINT: API_ENDPOINT,
  SITE_URL: SITE_URL
}
