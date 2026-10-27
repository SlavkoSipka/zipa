import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Line, HorizontalBar } from 'react-chartjs-2';

import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import { Prazno } from '../../components/admin/Stanja';
import { token, linija, stubic } from '../../components/bojeGrafikona';
import { API_ENDPOINT } from '../../constants';

/*
 * NADZORNA PLOČA ADMINISTRACIJE
 *
 * ODAKLE DOLAZI KOJI PODATAK — nijedan broj ovde nije izmišljen ni primer.
 * Svi stižu iz `GET /admin/dashboard`, koji je namerno LAGANA ruta (~1,2 s),
 * odvojena od `/admin/statistics` (~2,4 s, vidi `docs/admin-popis.md` 3.2).
 *
 *   Galerija, Fotografija   → `brojeviArhive()` u `api/admin/admin.js` — ISTI
 *                             izvor kao Statistika arhive i spisak Galerija:
 *                             veliki broj je „na sajtu", ispod piše koliko je
 *                             skrivenih i koliko ih je ukupno u bazi (2026-10-27)
 *   Korisnika, Fotografa    → tabela `users`
 *   Posjete danas / period  → tabela `logs`, polje `doc->>'timestamp'`
 *   Preuzimanja             → tabela `downloads`
 *   Grafikon posjeta        → `logs`, grupisano po danu
 *   Najaktivniji fotografi  → `gallery."user"`, po broju fotografija
 *   Kategorije po posjetama → `logs`, adrese sa `category=`
 *   Poslednje galerije      → `gallery."published"`
 *
 * ŠTA SE NE CRTA I ZAŠTO:
 *
 *   Prihod — tabela `transactions` je PRAZNA, a `downloads` ima 10 redova od
 *   kojih je poslednji iz novembra 2024. Kartica prihoda bi prikazivala nulu
 *   koja ne znači „nema zarade" nego „nema zapisa", pa je nema.
 *
 *   Najtraženije kategorije — izvor postoji (`logs` sa `category=`), ali ima
 *   svega desetak zapisa. Ispod praga (`PRAG_KATEGORIJA`) se ne crta grafikon
 *   nego se piše zašto.
 *
 *   Promena u odnosu na prethodni period — prikazuje se SAMO kad je prethodni
 *   prozor pokriven merenjem. Beleženje poseta radi od 13.07.2026; za period
 *   od 30 dana prethodni prozor pada pre toga i „porast" bi ispao +4.600%,
 *   što nije rast nego početak merenja. Server to javlja kroz
 *   `posete.poredjenjeMoguce`.
 */

// Ispod ovoliko poseta po kategorijama grafikon ne govori ništa.
const PRAG_KATEGORIJA = 30;

const PERIODI = [
    { dana: 7,   naziv: '7 dana' },
    { dana: 30,  naziv: '30 dana' },
    { dana: 365, naziv: 'Godina' },
];

/* Manje kretanja — animacije se gase, ne skraćuju. */
function manjeKretanja() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/*
 * Broj koji se odbroji do vrednosti. Kratko (320ms) i samo pri prvom
 * pojavljivanju — ne pri svakoj promeni perioda, da ploča ne treperi.
 */
class Broj extends Component {
    constructor(props) {
        super(props);
        this.state = { prikaz: manjeKretanja() ? props.vrednost : 0 };
    }

    componentDidMount() {
        this.odbroj();
        // Ako se kartica vrati iz pozadine usred odbrojavanja, broj se
        // dovršava odmah umesto da ostane na pola.
        if (typeof document !== 'undefined') {
            this.naVidljivost = () => { if (!document.hidden) this.odbroj(); };
            document.addEventListener('visibilitychange', this.naVidljivost);
        }
    }

    componentDidUpdate(prev) {
        if (prev.vrednost !== this.props.vrednost) this.odbroj();
    }

    componentWillUnmount() {
        cancelAnimationFrame(this.zahtev);
        if (typeof document !== 'undefined' && this.naVidljivost) {
            document.removeEventListener('visibilitychange', this.naVidljivost);
        }
    }

    odbroj() {
        const cilj = Number(this.props.vrednost) || 0;

        /*
         * Bez animacije kad je tražena manje kretanja — i kad je kartica
         * pregledača U POZADINI.
         *
         * `requestAnimationFrame` se u skrivenoj kartici ne okida, pa
         * odbrojavanje nikad ne stigne do cilja i na ploči ostane STARI broj.
         * Uhvaćeno pri prebacivanju perioda: karta je pokazivala 2.025 (30
         * dana) i pošto su podaci već bili za 7 dana (1.420). Podatak koji
         * laže je gore od podatka bez animacije.
         */
        const skriveno = typeof document !== 'undefined' && document.hidden;
        if (manjeKretanja() || skriveno || typeof requestAnimationFrame === 'undefined') {
            this.setState({ prikaz: cilj });
            return;
        }

        cancelAnimationFrame(this.zahtev);
        const pocetak = performance.now();
        const trajanje = 320;
        const kreni = (t) => {
            const p = Math.min(1, (t - pocetak) / trajanje);
            // Usporava pri kraju — brojevi tako deluju mirnije nego linearno.
            const lak = 1 - Math.pow(1 - p, 3);
            this.setState({ prikaz: Math.round(cilj * lak) });
            if (p < 1) this.zahtev = requestAnimationFrame(kreni);
        };
        this.zahtev = requestAnimationFrame(kreni);
    }

    render() {
        return <span>{(this.state.prikaz || 0).toLocaleString('sr-RS')}</span>;
    }
}

// Dan u obliku za `<input type="date">` (UTC, kao i grupisanje poseta po danu).
const uDan = (t) => new Date(t * 1000).toISOString().slice(0, 10);
const prikazDana = (dan) => (dan ? `${dan.slice(8, 10)}.${dan.slice(5, 7)}.${dan.slice(0, 4)}.` : '');

/* Preuzimanje PDF-a sa prijavom: ruta traži token, pa obična veza ne može —
   dovuče se kao blob i ponudi kao fajl. */
function preuzmiPdf(adresa, ime) {
    return fetch(adresa, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } })
        .then((res) => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.blob();
        })
        .then((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = ime;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
}

function Kartica({ naziv, vrednost, uz, promena, prazno, lang }) {
    return (
        <div className="z-ploca__kartica">
            <span className="z-ploca__kartica-naziv">{naziv.translate(lang)}</span>

            {prazno ? (
                <span className="z-ploca__kartica-prazno">{prazno}</span>
            ) : (
                <span className="z-ploca__kartica-broj"><Broj vrednost={vrednost} /></span>
            )}

            {uz ? <span className="z-ploca__kartica-uz">{uz}</span> : null}

            {promena ? (
                <span className={'z-ploca__promena z-ploca__promena--' + promena.smer}>
                    {promena.tekst}
                </span>
            ) : null}
        </div>
    );
}

class DashboardPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dana: 30,
            // Izabrani raspon od–do (YYYY-MM-DD); kad je `dana` izabrano, puni se iz odgovora.
            od: '',
            do: '',
            podaci: null,
            ucitavanje: true,
            greska: null,
            izvestaji: null,
            izvestajiGreska: null,
            preuzima: null,
        };
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        this.dovuci({ dana: this.state.dana });
        this.dovuciIzvestaje();
    }

    // Spisak mesečnih izveštaja; prvi poziv ume da potraje — server tada pravi one kojih nema.
    dovuciIzvestaje() {
        fetch(`${API_ENDPOINT}/admin/izvestaji`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then((izvestaji) => this.setState({ izvestaji: Array.isArray(izvestaji) ? izvestaji : [] }))
            .catch(() => this.setState({ izvestaji: [], izvestajiGreska: true }));
    }

    preuzmi(kljuc, adresa, ime) {
        this.setState({ preuzima: kljuc });
        preuzmiPdf(adresa, ime)
            .catch(() => window.alert('PDF se ne može preuzeti. Pokušajte ponovo.'))
            .then(() => this.setState({ preuzima: null }));
    }

    dovuci(period) {
        this.setState({ ucitavanje: true, greska: null });
        const upit = period.od && period.do
            ? `od=${period.od}&do=${period.do}`
            : `dana=${period.dana}`;

        fetch(`${API_ENDPOINT}/admin/dashboard?${upit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then((podaci) => this.setState({
                podaci,
                ucitavanje: false,
                // Polja od–do uvek pokazuju period koji je stvarno prikazan.
                od: uDan(podaci.od),
                do: uDan(podaci.dokle - 86400),
            }))
            .catch(() => this.setState({ ucitavanje: false, greska: true }));
    }

    promeniPeriod(dana) {
        this.setState({ dana });
        this.dovuci({ dana });
    }

    prikaziRaspon = (e) => {
        if (e) e.preventDefault();
        const { od, do: dokle } = this.state;
        if (!od || !dokle || dokle < od) return;
        this.setState({ dana: null });
        this.dovuci({ od, do: dokle });
    };

    /*
     * Dani bez ijedne posete moraju da budu NULA, ne rupa — inače linija
     * preskače prazne dane i prikazuje ravnomeran promet kojeg nije bilo.
     */
    poDanima() {
        const p = this.state.podaci;
        if (!p) return { oznake: [], vrednosti: [] };

        const poDanu = {};
        p.posete.poDanima.forEach((d) => { poDanu[d.dan] = d.broj; });

        const oznake = [];
        const vrednosti = [];

        // Od prvog dana izabranog perioda, dan po dan (UTC, kao i server).
        for (let i = 0; i < p.raspon; i++) {
            const d = new Date((Number(p.od) + i * 86400) * 1000);
            const kljuc = d.toISOString().slice(0, 10);

            // Na godinu dana se ne ispisuje svaki datum — bilo bi nečitko.
            oznake.push(
                p.raspon > 60
                    ? (d.getUTCDate() === 1 ? d.toLocaleDateString('sr-RS', { month: 'short', timeZone: 'UTC' }) : '')
                    : d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.'
            );
            vrednosti.push(poDanu[kljuc] || 0);
        }

        return { oznake, vrednosti };
    }

    promenaPoseta() {
        const p = this.state.podaci;
        if (!p || !p.posete.poredjenjeMoguce) return null;

        const sada = p.posete.uPeriodu;
        const pre = p.posete.prethodno;
        if (!pre) return null;

        const postotak = Math.round(((sada - pre) / pre) * 100);
        return {
            smer: postotak >= 0 ? 'gore' : 'dole',
            tekst: (postotak >= 0 ? '+' : '') + postotak + '% ' + 'u odnosu na prethodni period'.translate(this.props.lang),
        };
    }

    render() {
        const l = this.props.lang;
        const p = this.state.podaci;
        const { oznake, vrednosti } = this.poDanima();

        const bezAnimacije = manjeKretanja();
        const animacija = bezAnimacije ? { duration: 0 } : { duration: 400, easing: 'easeOutQuart' };

        const merenjeOd = p && p.posete.najstarije
            ? new Date(Number(p.posete.najstarije) * 1000).toLocaleDateString('sr-RS')
            : null;

        const poslednjePreuzimanje = p && p.preuzimanja.najnovije
            ? new Date(Number(p.preuzimanja.najnovije) * 1000).toLocaleDateString('sr-RS')
            : null;

        const ukupnoKategorija = p ? p.kategorije.reduce((z, k) => z + k.broj, 0) : 0;
        const arh = p && p.arhiva;
        const br = (n) => Number(n || 0).toLocaleString('sr-RS');
        const dovoljnoKategorija = ukupnoKategorija >= PRAG_KATEGORIJA;

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Nadzorna ploča'.translate(l)}
            >
                <div className="z-ploca">
                {this.state.greska ? (
                    <Prazno
                        lang={l}
                        znak="!"
                        naslov="Podaci se ne mogu dovući"
                        tekst="Osvježite stranu; ako se ponovi, provjerite da li API radi."
                    />
                ) : null}

                {/* ── 1. ključni brojevi ─────────────────────────────── */}
                <div className="z-ploca__brojevi">
                    <Kartica lang={l} naziv="Galerija na sajtu" vrednost={p ? p.ukupno.galerija : 0}
                             uz={arh ? `+ ${br(arh.galerija.skrivene)} ${'skrivenih'.translate(l)} · ${'ukupno u bazi'.translate(l)} ${br(arh.galerija.ukupno)}` : null} />

                    <Kartica lang={l} naziv="Fotografija na sajtu" vrednost={p ? p.ukupno.fotografija : 0}
                             uz={arh ? `${'ukupno u bazi'.translate(l)} ${br(arh.fotografija.ukupno)}` : null} />

                    <Kartica lang={l} naziv="Korisnika" vrednost={p ? p.ukupno.korisnika : 0}
                             uz={p ? p.ukupno.fotografa + ' ' + 'naloga fotografa'.translate(l) : null} />

                    <Kartica lang={l} naziv="Posjeta danas" vrednost={p ? p.posete.danas : 0}
                             uz={merenjeOd ? 'mjerenje od'.translate(l) + ' ' + merenjeOd : null} />

                    <Kartica lang={l} naziv="Posjeta u periodu" vrednost={p ? p.posete.uPeriodu : 0}
                             promena={this.promenaPoseta()}
                             uz={p && !p.posete.poredjenjeMoguce
                                 ? 'nema poređenja — mjerenje kraće od perioda'.translate(l)
                                 : null} />

                    {/* Preuzimanja: broj je stvaran, ali je star. Nula bez
                        objašnjenja bi značila „niko ne kupuje", a znači
                        „nema zapisa". */}
                    <Kartica lang={l} naziv="Preuzimanja" vrednost={p ? p.preuzimanja.ukupno : 0}
                             uz={poslednjePreuzimanje
                                 ? 'posljednje'.translate(l) + ' ' + poslednjePreuzimanje
                                 : null} />
                </div>

                {/* Šta koji broj znači — isto na ploči, u statistici arhive i u spisku galerija. */}
                {arh ? (
                    <p className="z-ploca__izvor z-ploca__legenda">
                        {'„Na sajtu" = galerije koje posjetioci vide. „Skrivene" = isključene galerije i prazni nacrti'.translate(l)}
                        {arh.galerija.prazne ? ` (${br(arh.galerija.prazne)} ${'praznih nacrta'.translate(l)})` : ''}
                        {'. Isti brojevi stoje u Statistici arhive i u spisku Galerija.'.translate(l)}
                    </p>
                ) : null}

                {/* ── 2. glavni grafikon ─────────────────────────────── */}
                <section className="z-ploca__glavni">
                    <header className="z-ploca__zaglavlje">
                        <div>
                            <h2 className="z-ploca__naslov">{'Posjete po danima'.translate(l)}</h2>
                            <p className="z-ploca__izvor">
                                {'Izvor: evidencija posjeta.'.translate(l)}
                                {merenjeOd ? ' ' + 'Mjerenje počinje'.translate(l) + ' ' + merenjeOd + '.' : ''}
                            </p>
                        </div>

                        <div className="z-ploca__periodi" role="group" aria-label={'Period'.translate(l)}>
                            {PERIODI.map((x) => (
                                <button
                                    key={x.dana}
                                    type="button"
                                    className={'z-ploca__period' + (this.state.dana === x.dana ? ' z-ploca__period--ovde' : '')}
                                    aria-pressed={this.state.dana === x.dana}
                                    onClick={() => this.promeniPeriod(x.dana)}
                                >
                                    {x.naziv.translate(l)}
                                </button>
                            ))}
                        </div>
                    </header>

                    {/* Tačan raspon od–do (2026-10-27): grafikon i svi brojevi
                        poseta na ploči računaju se samo u tom rasponu. */}
                    <form className="z-ploca__raspon" onSubmit={this.prikaziRaspon}>
                        <label className="z-ploca__datum">
                            <span>{'Od'.translate(l)}</span>
                            <input type="date" value={this.state.od} max={this.state.do || undefined}
                                   onChange={(e) => this.setState({ od: e.target.value })} />
                        </label>
                        <label className="z-ploca__datum">
                            <span>{'Do'.translate(l)}</span>
                            <input type="date" value={this.state.do} min={this.state.od || undefined}
                                   onChange={(e) => this.setState({ do: e.target.value })} />
                        </label>
                        <button type="submit" className="z-dugme z-dugme--glavno"
                                disabled={!this.state.od || !this.state.do || this.state.do < this.state.od}>
                            {'Prikaži'.translate(l)}
                        </button>
                        <button type="button" className="z-dugme z-dugme--sporedno"
                                disabled={!p || this.state.preuzima === 'period'}
                                onClick={() => p && this.preuzmi('period',
                                    `${API_ENDPOINT}/admin/izvestaj-period?od=${uDan(p.od)}&do=${uDan(p.dokle - 86400)}`,
                                    `zipa-izvestaj-${uDan(p.od)}-${uDan(p.dokle - 86400)}.pdf`)}>
                            {this.state.preuzima === 'period' ? 'Pravim PDF…'.translate(l) : 'PDF za ovaj period'.translate(l)}
                        </button>
                        {p ? (
                            <span className="z-ploca__raspon-opis">
                                {'Prikazano'.translate(l)}: {prikazDana(uDan(p.od))} – {prikazDana(uDan(p.dokle - 86400))} ({p.raspon} {'dana'.translate(l)})
                            </span>
                        ) : null}
                    </form>

                    <div className="z-ploca__grafikon z-ploca__grafikon--veliki">
                        {this.state.ucitavanje ? (
                            <div className="z-kostur z-kostur--slika" />
                        ) : (
                            <Line
                                data={{ labels: oznake, datasets: [linija('Posjete'.translate(l), vrednosti)] }}
                                options={{
                                    maintainAspectRatio: false,
                                    animation: animacija,
                                    legend: { display: false },
                                    scales: {
                                        xAxes: [{
                                            gridLines: { display: false, color: token('--boja-linija') },
                                            ticks: { fontColor: token('--boja-tekst-tiho'), maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
                                        }],
                                        yAxes: [{
                                            gridLines: { color: token('--boja-linija'), drawBorder: false },
                                            ticks: { beginAtZero: true, precision: 0, fontColor: token('--boja-tekst-tiho') },
                                        }],
                                    },
                                }}
                            />
                        )}
                    </div>
                </section>

                {/* ── 3. dva manja grafikona ─────────────────────────── */}
                <div className="z-ploca__par">

                    <section className="z-ploca__panel">
                        <h2 className="z-ploca__naslov">{'Najaktivniji fotografi'.translate(l)}</h2>
                        <p className="z-ploca__izvor">
                            {'Izvor: galerije na sajtu — broj fotografija.'.translate(l)}
                        </p>

                        <div className="z-ploca__grafikon">
                            {this.state.ucitavanje ? (
                                <div className="z-kostur z-kostur--slika" />
                            ) : p && p.fotografi.length ? (
                                <HorizontalBar
                                    data={{
                                        labels: p.fotografi.map((f) => f.ime),
                                        datasets: [stubic('Fotografija'.translate(l), p.fotografi.map((f) => f.fotografija))],
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        animation: animacija,
                                        legend: { display: false },
                                        scales: {
                                            xAxes: [{ gridLines: { color: token('--boja-linija'), drawBorder: false },
                                                      ticks: { beginAtZero: true, precision: 0, fontColor: token('--boja-tekst-tiho') } }],
                                            yAxes: [{ gridLines: { display: false },
                                                      ticks: { fontColor: token('--boja-tekst-tiho') } }],
                                        },
                                    }}
                                />
                            ) : (
                                <Prazno lang={l} naslov="Nema podataka o fotografima" />
                            )}
                        </div>
                    </section>

                    <section className="z-ploca__panel">
                        <h2 className="z-ploca__naslov">{'Najtraženije kategorije'.translate(l)}</h2>
                        <p className="z-ploca__izvor">
                            {'Izvor: evidencija posjeta — adrese sa izabranom kategorijom.'.translate(l)}
                        </p>

                        <div className="z-ploca__grafikon">
                            {this.state.ucitavanje ? (
                                <div className="z-kostur z-kostur--slika" />
                            ) : dovoljnoKategorija ? (
                                <HorizontalBar
                                    data={{
                                        labels: p.kategorije.map((k) => k.alias),
                                        datasets: [stubic('Posjeta'.translate(l), p.kategorije.map((k) => k.broj))],
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        animation: animacija,
                                        legend: { display: false },
                                        scales: {
                                            xAxes: [{ gridLines: { color: token('--boja-linija'), drawBorder: false },
                                                      ticks: { beginAtZero: true, precision: 0, fontColor: token('--boja-tekst-tiho') } }],
                                            yAxes: [{ gridLines: { display: false },
                                                      ticks: { fontColor: token('--boja-tekst-tiho') } }],
                                        },
                                    }}
                                />
                            ) : (
                                /* Prazno stanje sa RAZLOGOM, ne nula. */
                                <Prazno
                                    lang={l}
                                    znak="◔"
                                    naslov="Još nema dovoljno posjeta po kategorijama"
                                    tekst={
                                        'U ovom periodu zabilježeno je svega ' + ukupnoKategorija +
                                        '. Evidencija posjeta radi tek od ' + (merenjeOd || '—') +
                                        ', pa se raspored po kategorijama još ne može čitati.'
                                    }
                                />
                            )}
                        </div>
                    </section>
                </div>

                {/* ── 4. poslednja aktivnost ─────────────────────────── */}
                <section className="z-ploca__panel">
                    <header className="z-ploca__zaglavlje">
                        <div>
                            <h2 className="z-ploca__naslov">{'Posljednje dodate galerije'.translate(l)}</h2>
                            <p className="z-ploca__izvor">{'Izvor: sve galerije po datumu objave — i skrivene, označene. Klik otvara galeriju.'.translate(l)}</p>
                        </div>
                        <Link to="/account/galleries" className="z-ploca__veza">
                            {'Sve galerije'.translate(l)} &rarr;
                        </Link>
                    </header>

                    {this.state.ucitavanje ? (
                        <div>
                            <div className="z-kostur z-kostur--red" />
                            <div className="z-kostur z-kostur--red" />
                            <div className="z-kostur z-kostur--red" />
                        </div>
                    ) : p && p.poslednje.length ? (
                        <ul className="z-ploca__spisak">
                            {p.poslednje.map((g) => (
                                <li key={g._id} className="z-ploca__stavka">
                                    {/* Veza na izmenu galerije — da se zna koja je tačno. */}
                                    <Link className="z-ploca__stavka-naziv"
                                          to={g.uid && this.props.uData && String(g.uid) !== String(this.props.uData._id)
                                              ? `/account/gallery-photographer/${g.uid}/${g._id}`
                                              : `/account/gallery/${g._id}`}>
                                        {g.name && (g.name.ba || g.name.en) ? (g.name.ba || g.name.en) : '—'}
                                        {g.naSajtu === false ? <span className="z-oznaka z-oznaka--upozorenje z-ploca__skrivena">{'skrivena'.translate(l)}</span> : null}
                                    </Link>
                                    <span className="z-ploca__stavka-uz">
                                        {g.user || ''}
                                        {g.fotografija ? ' · ' + g.fotografija + ' ' + 'fotografija'.translate(l) : ''}
                                    </span>
                                    <span className="z-ploca__stavka-datum">
                                        {g.published
                                            ? new Date(Number(g.published) * 1000).toLocaleDateString('sr-RS')
                                            : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <Prazno lang={l} naslov="Nema galerija" />
                    )}
                </section>

                {/* ── 5. mesečni izveštaji (PDF) ─────────────────────── */}
                <section className="z-ploca__panel">
                    <header className="z-ploca__zaglavlje">
                        <div>
                            <h2 className="z-ploca__naslov">{'Mjesečni izvještaji'.translate(l)}</h2>
                            <p className="z-ploca__izvor">
                                {'Za svaki završeni mjesec sistem sam napravi izvještaj (A4, PDF) i čuva ga ovdje — posjete, najgledanije galerije, kategorije, pretrage, nove galerije, korisnici, baneri.'.translate(l)}
                            </p>
                        </div>
                    </header>

                    {this.state.izvestaji === null ? (
                        <p className="z-ploca__izvor">{'Pripremam izvještaje…'.translate(l)}</p>
                    ) : this.state.izvestaji.length ? (
                        <ul className="z-ploca__spisak z-ploca__izvestaji">
                            {this.state.izvestaji.map((iz) => (
                                <li key={iz.mesec} className="z-ploca__stavka">
                                    <span className="z-ploca__stavka-naziv">{iz.naziv}</span>
                                    <span className="z-ploca__stavka-uz">PDF · {Math.max(1, Math.round((iz.velicina || 0) / 1024))} KB</span>
                                    <button type="button" className="z-dugme z-dugme--sporedno z-dugme--malo"
                                            disabled={this.state.preuzima === iz.mesec}
                                            onClick={() => this.preuzmi(iz.mesec, `${API_ENDPOINT}/admin/izvestaji/${iz.mesec}`, `zipa-izvestaj-${iz.mesec}.pdf`)}>
                                        {this.state.preuzima === iz.mesec ? 'Preuzimam…'.translate(l) : 'Preuzmi PDF'.translate(l)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <Prazno lang={l}
                                naslov={this.state.izvestajiGreska ? 'Izvještaji se ne mogu učitati' : 'Još nema završenog mjeseca'}
                                tekst={this.state.izvestajiGreska ? 'Osvježite stranu.' : 'Prvi izvještaj se pravi prvog dana sljedećeg mjeseca.'} />
                    )}
                </section>
                </div>
            </AdminOkvir>
        );
    }
}

export default Page(DashboardPage);
