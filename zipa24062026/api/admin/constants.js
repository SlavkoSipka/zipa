const jwtSecretKey = process.env.ADMIN_JWT_SECRET;

if (!jwtSecretKey) {
    console.error('[admin/constants] Nedostaje ADMIN_JWT_SECRET — napravi .env po uzoru na .env.example');
}

module.exports = {
    jwtSecretKey: jwtSecretKey
}
