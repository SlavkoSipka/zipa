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
 *   Galerija, Fotografija   → tabela `gallery` (count i zbir `photos`)
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
            podaci: null,
            ucitavanje: true,
            greska: null,
        };
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        this.dovuci(this.state.dana);
    }

    dovuci(dana) {
        this.setState({ ucitavanje: true, greska: null });

        fetch(`${API_ENDPOINT}/admin/dashboard?dana=${dana}`, {
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
            .then((podaci) => this.setState({ podaci, ucitavanje: false }))
            .catch(() => this.setState({ ucitavanje: false, greska: true }));
    }

    promeniPeriod(dana) {
        this.setState({ dana });
        this.dovuci(dana);
    }

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
        const danas = new Date();

        for (let i = p.raspon - 1; i >= 0; i--) {
            const d = new Date(danas);
            d.setDate(d.getDate() - i);
            const kljuc = d.toISOString().slice(0, 10);

            // Na godinu dana se ne ispisuje svaki datum — bilo bi nečitko.
            oznake.push(
                p.raspon > 60
                    ? (d.getDate() === 1 ? d.toLocaleDateString('sr-RS', { month: 'short' }) : '')
                    : d.getDate() + '.' + (d.getMonth() + 1) + '.'
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
                    <Kartica lang={l} naziv="Galerija" vrednost={p ? p.ukupno.galerija : 0}
                             uz={p ? 'u arhivi'.translate(l) : null} />

                    <Kartica lang={l} naziv="Fotografija" vrednost={p ? p.ukupno.fotografija : 0}
                             uz={p ? 'u arhivi'.translate(l) : null} />

                    <Kartica lang={l} naziv="Korisnika" vrednost={p ? p.ukupno.korisnika : 0}
                             uz={p ? p.ukupno.fotografa + ' ' + 'fotografa'.translate(l) : null} />

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
                            {'Izvor: arhiva — broj fotografija u galerijama.'.translate(l)}
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
                            <p className="z-ploca__izvor">{'Izvor: arhiva — datum objave.'.translate(l)}</p>
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
                                    <span className="z-ploca__stavka-naziv">
                                        {g.name && (g.name.ba || g.name.en) ? (g.name.ba || g.name.en) : '—'}
                                    </span>
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
                </div>
            </AdminOkvir>
        );
    }
}

export default Page(DashboardPage);
