/**
 * Mongo-kompatibilan sloj nad Postgresom (Supabase).
 *
 * Moduli (users.js, admin.js, products.js, site.js) i dalje pozivaju
 * db.collection(...).find/insertOne/updateOne/aggregate... kao sa MongoDB
 * driverom — ovaj fajl prevodi te pozive u SQL nad Supabase bazom, u kojoj
 * su tabele i kolone nazvane identično kao Mongo kolekcije i polja.
 *
 * Dve vrste tabela:
 *  - mapirane: migrirane tabele sa pravim kolonama (users, gallery, ...);
 *    lista kolona se učitava iz information_schema pri startu.
 *  - doc-mode: sve ostale kolekcije (logs, photoVisits, seo, ...) čuvaju se
 *    kao (_id text, doc jsonb) i kreiraju se automatski pri prvom upisu.
 *
 * Poznata ograničenja (dovoljna za postojeći kod):
 *  - projekcije se primenjuju u JS-u nakon čitanja
 *  - u $lookup dokumentima jsonb NIZOVI zadržavaju dužinu ali ne i sadržaj
 *    (postojeći pipeline-i koriste samo $size nad njima)
 */
const { Pool, types } = require('pg');
const { dbAuth } = require('./constants');

// int8 (bigint) i numeric vraćaj kao brojeve, kao što je Mongo vraćao
types.setTypeParser(20, (v) => (v === null ? null : Number(v)));
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || dbAuth.pgConnectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
});

// ---------------------------------------------------------------------------
// ObjectID zamena (bez mongodb paketa): 24-hex string, kompatibilan format
// ---------------------------------------------------------------------------
let __oidCounter = Math.floor(Math.random() * 0xffffff);
function generateObjectId() {
    const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const rnd = [...Array(5)].map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    __oidCounter = (__oidCounter + 1) % 0xffffff;
    return ts + rnd + __oidCounter.toString(16).padStart(6, '0');
}

// ---------------------------------------------------------------------------
// Šema: koje tabele postoje i kog su tipa kolone
// ---------------------------------------------------------------------------
let tableColumns = null; // { table: { col: 'jsonb'|'array'|'boolean'|'number'|'text' } }
const docTablesEnsured = new Set();

async function loadSchema() {
    const res = await pool.query(`
        select table_name, column_name, data_type, udt_name
          from information_schema.columns
         where table_schema = 'public'
    `);
    tableColumns = {};
    for (const row of res.rows) {
        const t = row.table_name;
        if (!tableColumns[t]) tableColumns[t] = {};
        let kind = 'text';
        if (row.data_type === 'jsonb' || row.data_type === 'json') kind = 'jsonb';
        else if (row.data_type === 'ARRAY') kind = 'array';
        else if (row.data_type === 'boolean') kind = 'boolean';
        else if (['bigint', 'integer', 'numeric', 'double precision', 'real', 'smallint'].includes(row.data_type)) kind = 'number';
        tableColumns[t][row.column_name] = kind;
    }
}

function isDocTable(name) {
    const cols = tableColumns[name];
    if (!cols) return true;
    return !!cols.doc && Object.keys(cols).length === 2; // (_id, doc)
}

async function ensureDocTable(name) {
    if (tableColumns[name] || docTablesEnsured.has(name)) return;
    await pool.query(`create table if not exists "${name}" ("_id" text primary key, "doc" jsonb not null default '{}'::jsonb)`);
    docTablesEnsured.add(name);
    tableColumns[name] = { _id: 'text', doc: 'jsonb' };
}

// ---------------------------------------------------------------------------
// Vrednosti: ObjectID/NaN/undefined čišćenje pre upisa ili poređenja
// ---------------------------------------------------------------------------
function cleanValue(v) {
    if (v === undefined) return null;
    if (v === null) return null;
    if (typeof v === 'number' && !isFinite(v)) return null;
    if (v instanceof RegExp) return v;
    if (typeof v === 'object' && v !== null && typeof v.toHexString === 'function') return v.toHexString();
    if (Array.isArray(v)) return v.map(cleanValue);
    if (typeof v === 'object' && v.constructor === Object) {
        const out = {};
        for (const k of Object.keys(v)) out[k] = cleanValue(v[k]);
        return out;
    }
    return v;
}

// ---------------------------------------------------------------------------
// WHERE builder
// ---------------------------------------------------------------------------
class SqlParams {
    constructor() { this.values = []; }
    add(v) { this.values.push(v); return `$${this.values.length}`; }
}

/** Vrati SQL izraz za polje + metapodatke o tipu */
function fieldExpr(table, field) {
    const cols = tableColumns[table] || {};
    const doc = isDocTable(table);
    const parts = field.split('.');

    if (doc) {
        if (field === '_id') return { expr: '"_id"', kind: 'text' };
        let expr = '"doc"';
        for (let i = 0; i < parts.length - 1; i++) expr += `->'${parts[i]}'`;
        return { expr: `${expr}->'${parts[parts.length - 1]}'`, kind: 'docjson' };
    }

    const col = parts[0];
    const kind = cols[col];
    if (!kind) return { expr: null, kind: 'missing' };

    if (parts.length === 1) return { expr: `"${col}"`, kind };

    // dot-path u jsonb koloni: alias.ba, name.ba, keywords.en, photo.name...
    if (kind === 'jsonb') {
        let expr = `"${col}"`;
        for (let i = 1; i < parts.length - 1; i++) expr += `->'${parts[i]}'`;
        return { expr: `${expr}->'${parts[parts.length - 1]}'`, kind: 'jsonbnode' };
    }
    return { expr: null, kind: 'missing' };
}

/** tekstualna varijanta jsonb čvora */
function asText(fe) {
    if (fe.kind === 'jsonbnode' || fe.kind === 'docjson') {
        const i = fe.expr.lastIndexOf('->');
        return fe.expr.slice(0, i) + '->>' + fe.expr.slice(i + 2);
    }
    return fe.expr;
}

function condEquals(fe, value, p) {
    if (value instanceof RegExp) {
        const op = value.flags.includes('i') ? '~*' : '~';
        if (fe.kind === 'missing') return 'FALSE';
        return `${asText(fe)} ${op} ${p.add(value.source)}`;
    }
    value = cleanValue(value);
    if (fe.kind === 'missing') return value === null ? 'TRUE' : 'FALSE';
    if (value === null) return `${fe.expr} IS NULL`;
    if (fe.kind === 'jsonb' || fe.kind === 'jsonbnode' || fe.kind === 'docjson') {
        if (typeof value === 'object' || typeof value === 'number' || typeof value === 'boolean') {
            return `${fe.expr} = ${p.add(JSON.stringify(value))}::jsonb`;
        }
        return `${asText(fe)} = ${p.add(String(value))}`;
    }
    if (fe.kind === 'array') return `${fe.expr} @> ${p.add([String(value)])}`;
    return `${fe.expr} = ${p.add(value)}`;
}

function condOp(table, fe, op, value, p) {
    switch (op) {
        case '$eq': return condEquals(fe, value, p);
        case '$ne': {
            value = cleanValue(value);
            if (fe.kind === 'missing') return value === null ? 'FALSE' : 'TRUE';
            if (fe.kind === 'jsonbnode' || fe.kind === 'docjson') {
                if (value === null) return `${fe.expr} IS NOT NULL AND ${fe.expr} <> 'null'::jsonb`;
                return `(${asText(fe)} IS DISTINCT FROM ${p.add(typeof value === 'object' ? JSON.stringify(value) : String(value))})`;
            }
            if (value === null) return `${fe.expr} IS NOT NULL`;
            if (fe.kind === 'jsonb') return `(${fe.expr} IS DISTINCT FROM ${p.add(JSON.stringify(value))}::jsonb)`;
            return `(${fe.expr} IS DISTINCT FROM ${p.add(value)})`;
        }
        case '$gt': case '$gte': case '$lt': case '$lte': {
            const sqlOp = { $gt: '>', $gte: '>=', $lt: '<', $lte: '<=' }[op];
            value = cleanValue(value);
            if (fe.kind === 'missing') return 'FALSE';
            if (fe.kind === 'docjson' || fe.kind === 'jsonbnode') {
                if (typeof value === 'number') return `(${asText(fe)})::numeric ${sqlOp} ${p.add(value)}`;
                return `${asText(fe)} ${sqlOp} ${p.add(value)}`;
            }
            return `${fe.expr} ${sqlOp} ${p.add(value)}`;
        }
        case '$in': {
            const vals = (value || []).map(cleanValue).filter((v) => v !== null).map(String);
            if (fe.kind === 'missing') return 'FALSE';
            if (!vals.length) return 'FALSE';
            if (fe.kind === 'array') return `${fe.expr} && ${p.add(vals)}::text[]`;
            if (fe.kind === 'jsonbnode' || fe.kind === 'docjson') {
                // jsonb niz (keywords.ba): poklapa ako sadrži bilo koju vrednost;
                // jsonb skalar: poredi tekstualno
                return `(case when jsonb_typeof(${fe.expr}) = 'array' then ${fe.expr} ?| ${p.add(vals)}::text[] else ${asText(fe)} = ANY(${p.add(vals)}::text[]) end)`;
            }
            return `${fe.expr}::text = ANY(${p.add(vals)}::text[])`;
        }
        case '$nin': {
            const inner = condOp(table, fe, '$in', value, p);
            return `NOT (${inner})`;
        }
        case '$exists': {
            if (fe.kind === 'missing') return value ? 'FALSE' : 'TRUE';
            return value ? `${fe.expr} IS NOT NULL` : `${fe.expr} IS NULL`;
        }
        case '$regex': {
            const rx = value instanceof RegExp ? value : new RegExp(value);
            return condEquals(fe, rx, p);
        }
        case '$options':
            return 'TRUE'; // obrađeno uz $regex
        default:
            throw new Error(`Nepodržan Mongo operator u shimu: ${op}`);
    }
}

function isOperatorObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof RegExp)
        && v.constructor === Object && Object.keys(v).some((k) => k.startsWith('$'));
}

function buildWhere(table, query, p) {
    if (!query || !Object.keys(query).length) return 'TRUE';
    const conds = [];
    for (const key of Object.keys(query)) {
        const value = query[key];
        if (key === '$or' || key === '$and') {
            const sub = value.map((q) => `(${buildWhere(table, q, p)})`);
            conds.push(`(${sub.join(key === '$or' ? ' OR ' : ' AND ')})`);
            continue;
        }
        const fe = fieldExpr(table, key);
        if (isOperatorObject(value)) {
            for (const op of Object.keys(value)) {
                conds.push(condOp(table, fe, op, value[op], p));
            }
        } else {
            conds.push(condEquals(fe, value, p));
        }
    }
    return conds.length ? conds.join(' AND ') : 'TRUE';
}

function buildOrderBy(table, sortSpec) {
    if (!sortSpec || !Object.keys(sortSpec).length) return `ORDER BY "_id" ASC`;
    const parts = [];
    for (const key of Object.keys(sortSpec)) {
        const dir = sortSpec[key] === -1 ? 'DESC' : 'ASC';
        const nulls = dir === 'DESC' ? 'NULLS LAST' : 'NULLS FIRST';
        const fe = fieldExpr(table, key);
        if (fe.kind === 'missing') continue;
        // jsonb vrednosti se porede jsonb-redosledom (brojevi numerički) — dovoljno
        parts.push(`${fe.expr} ${dir} ${nulls}`);
    }
    return parts.length ? `ORDER BY ${parts.join(', ')}` : `ORDER BY "_id" ASC`;
}

// ---------------------------------------------------------------------------
// Redovi <-> dokumenti
// ---------------------------------------------------------------------------
function rowToDoc(table, row) {
    if (isDocTable(table)) {
        return { _id: row._id, ...(row.doc || {}) };
    }
    return { ...row };
}

function applyProjection(doc, projection) {
    if (!projection || !Object.keys(projection).length) return doc;
    const keys = Object.keys(projection).filter((k) => projection[k]);
    const out = {};
    if (projection._id !== 0) out._id = doc._id;
    for (const k of keys) {
        if (k in doc) out[k] = doc[k];
    }
    return out;
}

/**
 * Lista kolona za SELECT na osnovu Mongo projekcije.
 *
 * Bitno za pamćenje: `gallery.photos` ume da bude ogroman jsonb niz, pa
 * `SELECT *` na 9.965 galerija povuče stotine megabajta i obori proces.
 * Kada kod traži samo npr. `{location: 1}`, ovde se u SQL šalju baš te kolone.
 *
 * Podržana je samo "inclusion" projekcija ({polje: 1}), jer je jedino takva
 * i u upotrebi; kod bilo čega drugog vraća `*` i projekcija se svede na JS.
 */
function buildSelectList(table, projection) {
    if (!projection) return '*';
    const keys = Object.keys(projection);
    if (!keys.length) return '*';
    if (isDocTable(table)) return '*'; // doc tabele: sve je u jednoj jsonb koloni

    const included = keys.filter((k) => k !== '_id' && projection[k]);
    if (!included.length) return '*';
    // ako je bilo koje polje isključeno ({photos: 0}) — ne diramo SELECT
    if (keys.some((k) => k !== '_id' && !projection[k])) return '*';

    const cols = tableColumns[table] || {};
    const wanted = new Map(); // kolona -> SQL izraz
    wanted.set('_id', '"_id"');

    for (const k of included) {
        const base = k.split('.')[0]; // "photo.name" -> "photo"
        if (!cols[base]) return '*';  // nepoznata kolona — bezbednije uzeti sve

        const spec = projection[k];

        /*
         * `{ photos: { $slice: N } }` vraća samo prvih N elemenata niza.
         *
         * Za spiskove galerija je dovoljna naslovna fotografija, a cela lista
         * ume da bude ogromna — kod dvesta galerija po strani to je bilo preko
         * deset megabajta i trinaest sekundi čekanja.
         */
        if (spec && typeof spec === 'object' && typeof spec.$slice === 'number') {
            if (cols[base] !== 'jsonb') return '*';
            const n = Math.max(0, parseInt(spec.$slice, 10));
            wanted.set(base, `(
                select coalesce(jsonb_agg(e.value order by e.ordinality), '[]'::jsonb)
                  from jsonb_array_elements("${base}") with ordinality e(value, ordinality)
                 where e.ordinality <= ${n}
            ) as "${base}"`);
            continue;
        }

        wanted.set(base, `"${base}"`);
    }

    return [...wanted.values()].join(', ');
}

// ---------------------------------------------------------------------------
// Cursor
// ---------------------------------------------------------------------------
class Cursor {
    constructor(table, query, options) {
        this.table = table;
        this.query = query || {};
        this.options = options || {};
        this._sort = null;
        this._skip = 0;
        this._limit = null;
    }

    sort(spec) { this._sort = spec; return this; }
    skip(n) { this._skip = n || 0; return this; }
    limit(n) { this._limit = n; return this; }

    async _run() {
        await ready;
        await ensureDocTable(this.table);
        const p = new SqlParams();
        const where = buildWhere(this.table, this.query, p);
        const orderBy = buildOrderBy(this.table, this._sort);
        const selectList = buildSelectList(this.table, this.options.projection);
        let sql = `SELECT ${selectList} FROM "${this.table}" WHERE ${where} ${orderBy}`;
        if (this._limit !== null) sql += ` LIMIT ${parseInt(this._limit, 10)}`;
        if (this._skip) sql += ` OFFSET ${parseInt(this._skip, 10)}`;
        const res = await pool.query(sql, p.values);
        const projection = this.options.projection;
        return res.rows.map((r) => applyProjection(rowToDoc(this.table, r), projection));
    }

    toArray(cb) {
        const promise = this._run();
        if (typeof cb === 'function') {
            promise.then((rows) => cb(null, rows)).catch((err) => cb(err));
            return undefined;
        }
        return promise;
    }

    async count() {
        await ready;
        await ensureDocTable(this.table);
        const p = new SqlParams();
        const where = buildWhere(this.table, this.query, p);
        const res = await pool.query(`SELECT COUNT(*)::int AS c FROM "${this.table}" WHERE ${where}`, p.values);
        return res.rows[0].c;
    }
}

// ---------------------------------------------------------------------------
// Aggregation (mini engine za pipeline-e koje kod koristi)
// ---------------------------------------------------------------------------
function aggGet(doc, path, vars) {
    if (path.startsWith('$$')) {
        const parts = path.slice(2).split('.');
        let cur = vars[parts[0]];
        for (let i = 1; i < parts.length && cur != null; i++) cur = cur[parts[i]];
        return cur;
    }
    if (path.startsWith('$')) path = path.slice(1);
    const parts = path.split('.');
    let cur = doc;
    for (const part of parts) {
        if (cur == null) return undefined;
        cur = cur[part];
    }
    return cur;
}

function aggEval(expr, doc, vars = {}) {
    if (typeof expr === 'string' && expr.startsWith('$')) return aggGet(doc, expr, vars);
    if (expr === null || typeof expr !== 'object') return expr;
    if (Array.isArray(expr)) return expr.map((e) => aggEval(e, doc, vars));

    const keys = Object.keys(expr);
    if (keys.length === 1 && keys[0].startsWith('$')) {
        const op = keys[0];
        const arg = expr[op];
        switch (op) {
            case '$size': {
                const v = aggEval(arg, doc, vars);
                return Array.isArray(v) ? v.length : 0;
            }
            case '$sum': {
                const v = aggEval(arg, doc, vars);
                if (Array.isArray(v)) return v.reduce((a, b) => a + (Number(b) || 0), 0);
                return Number(v) || 0;
            }
            case '$map': {
                const input = aggEval(arg.input, doc, vars) || [];
                const as = arg.as || 'this';
                return input.map((item) => aggEval(arg.in, doc, { ...vars, [as]: item }));
            }
            case '$multiply': {
                const vals = arg.map((a) => Number(aggEval(a, doc, vars)) || 0);
                return vals.reduce((a, b) => a * b, 1);
            }
            case '$toDate': {
                const v = aggEval(arg, doc, vars);
                return new Date(Number(v));
            }
            case '$dateToString': {
                const d = aggEval(arg.date, doc, vars);
                const fmt = arg.format || '%Y-%m-%d';
                const pad = (n, l = 2) => String(n).padStart(l, '0');
                return fmt
                    .replace('%Y', d.getUTCFullYear())
                    .replace('%m', pad(d.getUTCMonth() + 1))
                    .replace('%d', pad(d.getUTCDate()))
                    .replace('%H', pad(d.getUTCHours()))
                    .replace('%M', pad(d.getUTCMinutes()))
                    .replace('%S', pad(d.getUTCSeconds()));
            }
            case '$eq': { const [a, b] = arg.map((x) => aggEval(x, doc, vars)); return String(a) === String(b); }
            case '$gte': { const [a, b] = arg.map((x) => aggEval(x, doc, vars)); return a >= b; }
            case '$gt': { const [a, b] = arg.map((x) => aggEval(x, doc, vars)); return a > b; }
            case '$lte': { const [a, b] = arg.map((x) => aggEval(x, doc, vars)); return a <= b; }
            case '$lt': { const [a, b] = arg.map((x) => aggEval(x, doc, vars)); return a < b; }
            case '$and': return arg.every((x) => !!aggEval(x, doc, vars));
            case '$or': return arg.some((x) => !!aggEval(x, doc, vars));
            case '$first': return aggEval(arg, doc, vars);
            default:
                throw new Error(`Nepodržan aggregate izraz: ${op}`);
        }
    }
    // objekat-literal: {name: "$x", ...}
    const out = {};
    for (const k of keys) out[k] = aggEval(expr[k], doc, vars);
    return out;
}

function matchDocJs(query, doc) {
    for (const key of Object.keys(query)) {
        if (key === '$or') { if (!query[key].some((q) => matchDocJs(q, doc))) return false; continue; }
        if (key === '$and') { if (!query[key].every((q) => matchDocJs(q, doc))) return false; continue; }
        if (key === '$expr') { if (!aggEval(query[key], doc, {})) return false; continue; }
        const val = aggGet(doc, '$' + key, {});
        const cond = query[key];
        if (isOperatorObject(cond)) {
            for (const op of Object.keys(cond)) {
                const cv = cleanValue(cond[op]);
                if (op === '$gte' && !(val >= cv)) return false;
                else if (op === '$gt' && !(val > cv)) return false;
                else if (op === '$lte' && !(val <= cv)) return false;
                else if (op === '$lt' && !(val < cv)) return false;
                else if (op === '$ne' && String(val) === String(cv)) return false;
                else if (op === '$eq' && String(val) !== String(cv)) return false;
                else if (op === '$in' && !(cv || []).map(String).includes(String(val))) return false;
            }
        } else if (cond instanceof RegExp) {
            if (typeof val !== 'string' || !cond.test(val)) return false;
        } else if (String(val) !== String(cleanValue(cond))) {
            return false;
        }
    }
    return true;
}

function groupStage(spec, docs) {
    const groups = new Map();
    for (const doc of docs) {
        const idVal = aggEval(spec._id, doc, {});
        const key = JSON.stringify(idVal === undefined ? null : idVal);
        if (!groups.has(key)) {
            const g = { _id: idVal === undefined ? null : idVal };
            for (const field of Object.keys(spec)) {
                if (field === '_id') continue;
                const acc = Object.keys(spec[field])[0];
                if (acc === '$sum') g[field] = 0;
                else if (acc === '$push') g[field] = [];
                else if (acc === '$first') g[field] = undefined;
                else throw new Error(`Nepodržan akumulator: ${acc}`);
            }
            groups.set(key, { g, first: true });
        }
        const entry = groups.get(key);
        for (const field of Object.keys(spec)) {
            if (field === '_id') continue;
            const accOp = Object.keys(spec[field])[0];
            const accArg = spec[field][accOp];
            if (accOp === '$sum') {
                const v = typeof accArg === 'number' ? accArg : Number(aggEval(accArg, doc, {})) || 0;
                entry.g[field] += v;
            } else if (accOp === '$push') {
                entry.g[field].push(aggEval(accArg, doc, {}));
            } else if (accOp === '$first') {
                if (entry.first) entry.g[field] = aggEval(accArg, doc, {});
            }
        }
        entry.first = false;
    }
    return [...groups.values()].map((e) => e.g);
}

async function lookupStage(spec, docs) {
    const from = spec.from;
    await ensureDocTable(from);

    // SELECT koji jsonb NIZOVE menja praznim objektima iste dužine (radi $size
    // bez prenosa megabajta sadržaja); ostale kolone netaknute.
    const cols = tableColumns[from] || {};
    const selectCols = Object.keys(cols).map((c) => {
        if (cols[c] === 'jsonb' && !isDocTable(from)) {
            return `case when jsonb_typeof("${c}") = 'array'
                         then (select coalesce(jsonb_agg('{}'::jsonb), '[]'::jsonb) from jsonb_array_elements("${c}"))
                         else "${c}" end as "${c}"`;
        }
        return `"${c}"`;
    }).join(', ');

    if (spec.localField && spec.foreignField) {
        const localVals = [...new Set(docs.map((d) => String(aggGet(d, '$' + spec.localField, {}))).filter((v) => v !== 'undefined' && v !== 'null'))];
        let rows = [];
        if (localVals.length) {
            const fe = fieldExpr(from, spec.foreignField);
            const p = new SqlParams();
            const cond = fe.kind === 'missing' ? 'FALSE' : `${asText(fe)} = ANY(${p.add(localVals)}::text[])`;
            const res = await pool.query(`SELECT ${selectCols} FROM "${from}" WHERE ${cond}`, p.values);
            rows = res.rows.map((r) => rowToDoc(from, r));
        }
        const buckets = {};
        for (const r of rows) {
            const k = String(aggGet(r, '$' + spec.foreignField, {}));
            (buckets[k] = buckets[k] || []).push(r);
        }
        return docs.map((d) => ({ ...d, [spec.as]: buckets[String(aggGet(d, '$' + spec.localField, {}))] || [] }));
    }

    // pipeline-forma sa let/$expr: povuci kandidate jednim upitom pa filtriraj u JS-u
    if (spec.pipeline) {
        const letSpec = spec.let || {};
        const res = await pool.query(`SELECT ${selectCols} FROM "${from}"`);
        const rows = res.rows.map((r) => rowToDoc(from, r));
        return docs.map((d) => {
            const vars = {};
            for (const k of Object.keys(letSpec)) vars[k] = aggEval(letSpec[k], d, {});
            let matched = rows;
            for (const stage of spec.pipeline) {
                if (stage.$match) {
                    matched = matched.filter((r) => {
                        const q = stage.$match;
                        if (q.$expr) {
                            return !!aggEvalWithVars(q.$expr, r, vars);
                        }
                        return matchDocJs(q, r);
                    });
                }
            }
            return { ...d, [spec.as]: matched };
        });
    }

    return docs.map((d) => ({ ...d, [spec.as]: [] }));
}

function aggEvalWithVars(expr, doc, vars) {
    return aggEval(expr, doc, vars);
}

class AggCursor {
    constructor(table, pipeline) {
        this.table = table;
        this.pipeline = pipeline || [];
    }

    async _run() {
        await ready;
        await ensureDocTable(this.table);
        let stages = [...this.pipeline];

        // $match kao prva faza ide u SQL (osim $expr varijante)
        let matchQuery = {};
        if (stages.length && stages[0].$match && !JSON.stringify(stages[0].$match).includes('$expr')) {
            matchQuery = stages.shift().$match;
        }
        let docs = await new Cursor(this.table, matchQuery, {}).toArray();

        for (const stage of stages) {
            const op = Object.keys(stage)[0];
            const spec = stage[op];
            if (op === '$match') {
                docs = docs.filter((d) => matchDocJs(spec, d));
            } else if (op === '$sort') {
                const keys = Object.keys(spec);
                docs = [...docs].sort((a, b) => {
                    for (const k of keys) {
                        const av = aggGet(a, '$' + k, {});
                        const bv = aggGet(b, '$' + k, {});
                        if (av < bv) return -spec[k];
                        if (av > bv) return spec[k];
                    }
                    return 0;
                });
            } else if (op === '$limit') {
                docs = docs.slice(0, spec);
            } else if (op === '$skip') {
                docs = docs.slice(spec);
            } else if (op === '$group') {
                docs = groupStage(spec, docs);
            } else if (op === '$project') {
                docs = docs.map((d) => {
                    const out = {};
                    if (spec._id !== 0 && d._id !== undefined) out._id = d._id;
                    for (const k of Object.keys(spec)) {
                        if (k === '_id') continue;
                        const v = spec[k];
                        if (v === 1 || v === true) out[k] = aggGet(d, '$' + k, {});
                        else if (v && v !== 0) out[k] = aggEval(v, d, {});
                    }
                    return out;
                });
            } else if (op === '$lookup') {
                docs = await lookupStage(spec, docs);
            } else {
                throw new Error(`Nepodržana aggregate faza: ${op}`);
            }
        }
        return docs;
    }

    toArray(cb) {
        const promise = this._run();
        if (typeof cb === 'function') {
            promise.then((rows) => cb(null, rows)).catch((err) => cb(err));
            return undefined;
        }
        return promise;
    }
}

// ---------------------------------------------------------------------------
// Collection
// ---------------------------------------------------------------------------
class Collection {
    constructor(name) { this.name = name; }

    find(query, options) { return new Cursor(this.name, query, options); }

    async findOne(query, options) {
        const rows = await new Cursor(this.name, query, options).limit(1).toArray();
        return rows.length ? rows[0] : null;
    }

    async countDocuments(query) {
        return new Cursor(this.name, query || {}, {}).count();
    }

    aggregate(pipeline) { return new AggCursor(this.name, pipeline); }

    async insertOne(doc) {
        await ready;
        await ensureDocTable(this.name);
        const clean = cleanValue({ ...doc });
        const id = clean._id ? String(clean._id) : generateObjectId();
        clean._id = id;

        if (isDocTable(this.name)) {
            const body = { ...clean };
            delete body._id;
            await pool.query(`INSERT INTO "${this.name}" ("_id", "doc") VALUES ($1, $2::jsonb)`, [id, JSON.stringify(body)]);
            return { insertedId: id, insertedCount: 1 };
        }

        const cols = tableColumns[this.name];
        const names = [];
        const params = [];
        const placeholders = [];
        for (const k of Object.keys(clean)) {
            if (!cols[k]) {
                console.warn(`[db-shim] upozorenje: kolona "${k}" ne postoji u tabeli "${this.name}" — polje preskočeno pri upisu`);
                continue;
            }
            names.push(`"${k}"`);
            if (cols[k] === 'jsonb') {
                params.push(clean[k] === null ? null : JSON.stringify(clean[k]));
                placeholders.push(`$${params.length}::jsonb`);
            } else if (cols[k] === 'array') {
                params.push(clean[k] === null ? null : (clean[k] || []).map(String));
                placeholders.push(`$${params.length}`);
            } else {
                params.push(clean[k]);
                placeholders.push(`$${params.length}`);
            }
        }
        await pool.query(`INSERT INTO "${this.name}" (${names.join(', ')}) VALUES (${placeholders.join(', ')})`, params);
        return { insertedId: id, insertedCount: 1 };
    }

    async _update(filter, update, onlyOne) {
        await ready;
        await ensureDocTable(this.name);
        const p = new SqlParams();
        const where = buildWhere(this.name, filter, p);
        const target = onlyOne
            ? `"_id" IN (SELECT "_id" FROM "${this.name}" WHERE ${where} ORDER BY "_id" LIMIT 1)`
            : where;

        const sets = [];
        const setSpec = cleanValue(update.$set || {});
        const incSpec = cleanValue(update.$inc || {});

        if (isDocTable(this.name)) {
            let expr = '"doc"';
            for (const k of Object.keys(setSpec)) {
                expr = `jsonb_set(${expr}, '{${k}}', ${p.add(JSON.stringify(setSpec[k]))}::jsonb, true)`;
            }
            for (const k of Object.keys(incSpec)) {
                expr = `jsonb_set(${expr}, '{${k}}', to_jsonb(coalesce(("doc"->>'${k}')::numeric, 0) + ${p.add(incSpec[k])}::numeric), true)`;
            }
            const res = await pool.query(`UPDATE "${this.name}" SET "doc" = ${expr} WHERE ${target}`, p.values);
            return { matchedCount: res.rowCount, modifiedCount: res.rowCount };
        }

        const cols = tableColumns[this.name];
        for (const k of Object.keys(setSpec)) {
            if (!cols[k]) {
                console.warn(`[db-shim] upozorenje: kolona "${k}" ne postoji u tabeli "${this.name}" — $set polje preskočeno`);
                continue;
            }
            if (cols[k] === 'jsonb') sets.push(`"${k}" = ${p.add(setSpec[k] === null ? null : JSON.stringify(setSpec[k]))}::jsonb`);
            else if (cols[k] === 'array') sets.push(`"${k}" = ${p.add(setSpec[k] === null ? null : (setSpec[k] || []).map(String))}`);
            else sets.push(`"${k}" = ${p.add(setSpec[k])}`);
        }
        for (const k of Object.keys(incSpec)) {
            if (!cols[k]) continue;
            sets.push(`"${k}" = coalesce("${k}", 0) + ${p.add(incSpec[k])}`);
        }
        if (!sets.length) return { matchedCount: 0, modifiedCount: 0 };
        const res = await pool.query(`UPDATE "${this.name}" SET ${sets.join(', ')} WHERE ${target}`, p.values);
        return { matchedCount: res.rowCount, modifiedCount: res.rowCount };
    }

    updateOne(filter, update) { return this._update(filter, update, true); }
    updateMany(filter, update) { return this._update(filter, update, false); }

    async _delete(filter, onlyOne) {
        await ready;
        await ensureDocTable(this.name);
        const p = new SqlParams();
        const where = buildWhere(this.name, filter, p);
        const target = onlyOne
            ? `"_id" IN (SELECT "_id" FROM "${this.name}" WHERE ${where} ORDER BY "_id" LIMIT 1)`
            : where;
        const res = await pool.query(`DELETE FROM "${this.name}" WHERE ${target}`, p.values);
        return { deletedCount: res.rowCount };
    }

    deleteOne(filter) { return this._delete(filter, true); }
    deleteMany(filter) { return this._delete(filter, false); }
}

// ---------------------------------------------------------------------------
// Public API — isti oblik kao stari db.js
// ---------------------------------------------------------------------------
const dbShim = {
    collection(name) { return new Collection(name); },

    /**
     * Direktan SQL — za agregacije koje bi kroz Mongo-stil upite značile
     * učitavanje ogromnih `photos` nizova u memoriju samo da bi se prebrojali.
     * Koristi se na par mesta (brojanje fotografija po fotografu/kategoriji).
     */
    async query(sql, params) {
        await ready;
        return pool.query(sql, params);
    },
};

const ready = loadSchema().catch((e) => {
    console.error('[db-shim] Ne mogu da učitam šemu iz Postgresa:', e.message);
    throw e;
});

module.exports = function () {
    return ready.then(() => dbShim);
};
