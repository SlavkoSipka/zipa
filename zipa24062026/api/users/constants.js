const jwtSecretKey = process.env.JWT_SECRET;

if (!jwtSecretKey) {
    console.error('[users/constants] Nedostaje JWT_SECRET — napravi .env po uzoru na .env.example');
}

module.exports = {
    jwtSecretKey: jwtSecretKey
}
