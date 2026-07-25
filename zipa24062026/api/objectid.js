/**
 * Zamena za require('mongodb').ObjectID — u Postgres bazi su ID-jevi obični
 * tekstualni hex stringovi, pa ObjectID(x) samo vraća string, a ObjectID()
 * generiše novi 24-hex ID u istom formatu kao Mongo (timestamp + random).
 */
let counter = Math.floor(Math.random() * 0xffffff);

function ObjectID(id) {
    if (id !== undefined && id !== null) return String(id);
    const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const rnd = [...Array(5)].map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    counter = (counter + 1) % 0xffffff;
    return ts + rnd + counter.toString(16).padStart(6, '0');
}

module.exports = ObjectID;
