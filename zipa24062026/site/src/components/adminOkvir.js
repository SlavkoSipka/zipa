import React, { Component } from 'react';
import { Link } from 'react-router-dom';

/*
 * ZAJEDNIČKI OKVIR ZA CELU ADMINISTRACIJU
 *
 * Zamenjuje ono što je do sada bilo dva interfejsa zalepljena jedan na drugi:
 * javno zaglavlje sajta (tamna traka, logo, korpa, „Pomoć", prekidač jezika)
 * i bela pilula sa administratorskim menijem ispod njega. Korpa i pomoć nemaju
 * šta da traže u administraciji.
 *
 * Sada: tamni bočni meni levo, tanka bela traka gore, bela radna površina desno.
 *
 * KAKO SE KORISTI — u bilo kojoj strani pod `/account/*`:
 *
 *     import AdminOkvir from '../../components/adminOkvir';
 *
 *     render() {
 *         return (
 *             <AdminOkvir
 *                 lang={this.props.lang}
 *                 uData={this.props.uData}
 *                 putanja={this.props[0].location.pathname}
 *                 signOut={this.props.signOut}
 *                 settings={this.props.settings}
 *                 naslov={'Newsletter'.translate(this.props.lang)}
 *                 radnja={<Link to="/account/newsletter/new" className="z-adminokvir__radnja">Dodaj</Link>}
 *             >
 *                 …sadržaj ekrana…
 *             </AdminOkvir>
 *         );
 *     }
 *
 * Svi propovi su NEOBAVEZNI osim `children`. Okvir ne bira rutu, ne proverava
 * prava i ne dira `signOut` — samo ga prosleđuje dalje. `putanja` služi
 * isključivo da se označi aktivna stavka.
 *
 * `radnja` je mesto za glavnu radnju ekrana (npr. „Dodaj"). Stoji u gornjoj
 * traci, desno od naslova.
 *
 * NOVA STRANA SE DODAJE NA JEDNOM MESTU — jedan red u `MENI` ispod. Nigde
 * drugde se ništa ne dira.
 */

/* ── ikonice ──────────────────────────────────────────────────────────────
 * Crtaju se ovde, a ne uzimaju iz `assets/svg`: tamošnji set je skupljan kroz
 * godine i nema ujednačen potez ni okvir, pa bi 16 stavki menija izgledalo
 * kao 16 različitih rukopisa. Sve nasleđuju `currentColor`, pa ih boji sam
 * meni — i u tamnom i u skupljenom stanju.
 */
const I = {
    ploca:    'M3 3h7v7H3V3zm11 0h7v4h-7V3zM3 14h7v7H3v-7zm11-3h7v10h-7V11z',
    galerija: 'M3 5h18v14H3V5zm2 2v10h14V7H5zm2 7l2.5-3 2 2.5L14 9l3 5H7z',
    kategorija:'M3 5h6l2 2h10v12H3V5zm2 2v10h14V9h-8.8L8.2 7H5z',
    zig:      'M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4zm0 2.2L6 7v5c0 3.9 2.6 6.7 6 8 3.4-1.3 6-4.1 6-8V7l-6-2.8z',
    strana:   'M6 2h8l4 4v16H6V2zm2 2v16h8V8h-4V4H8zm2 8h6v2h-6v-2zm0 4h6v2h-6v-2z',
    najava:   'M4 9h4l7-5v16l-7-5H4V9zm14 3c0-1.6-.7-3-1.8-4v8c1.1-1 1.8-2.4 1.8-4z',
    baner:    'M2 6h20v5H2V6zm0 7h20v5H2v-5zm2 2v1h16v-1H4zM4 8v1h16V8H4z',
    faq:      'M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16zm-1 12h2v2h-2v-2zm1-9c-1.7 0-3 1.2-3 2.8h2c0-.6.4-1 1-1s1 .4 1 1c0 .5-.3.8-.9 1.2-.7.5-1.1 1-1.1 2H13c0-.5.3-.8.9-1.2.7-.5 1.1-1.1 1.1-2C15 8.2 13.7 7 12 7z',
    slajder:  'M2 6h14v12H2V6zm2 2v8h10V8H4zm14 0h4v8h-4V8z',
    korisnik: 'M12 3a4 4 0 110 8 4 4 0 010-8zm0 2a2 2 0 100 4 2 2 0 000-4zM4 21c0-4 3.6-7 8-7s8 3 8 7h-2c0-2.9-2.7-5-6-5s-6 2.1-6 5H4z',
    pretplata:'M3 5h18v14H3V5zm2.4 2L12 12l6.6-5H5.4zM5 8.5V17h14V8.5l-7 5.2-7-5.2z',
    posta:    'M3 5h18v14H3V5zm2 2v10h14V7H5zm2 2h10v2H7V9zm0 4h7v2H7v-2z',
    podesavanja:'M12 8a4 4 0 110 8 4 4 0 010-8zm0 2a2 2 0 100 4 2 2 0 000-4zm-1-8h2l.4 2.4 1.9.8 2-1.3 1.4 1.4-1.3 2 .8 1.9L21 10v2l-2.4.4-.8 1.9 1.3 2-1.4 1.4-2-1.3-1.9.8L13 22h-2l-.4-2.4-1.9-.8-2 1.3-1.4-1.4 1.3-2-.8-1.9L3 14v-2l2.4-.4.8-1.9-1.3-2 1.4-1.4 2 1.3 1.9-.8L11 2z',
    log:      'M4 3h16v18H4V3zm2 2v14h12V5H6zm2 2h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z',
    preuzeto: 'M12 3v9.2l3.6-3.6L17 10l-5 5-5-5 1.4-1.4L12 12.2V3h0zM4 19h16v2H4v-2z',
    statistika:'M4 20h16v1H4v-1zM6 12h3v7H6v-7zm5-6h3v13h-3V6zm5 3h3v10h-3V9z',
};

/*
 * SPISAK MENIJA — jedini spisak. Nova strana = jedan red.
 *
 * `grupa`   — naslov iznad, tih i sitan
 * `stavke`  — { putanja, naziv, ikona, podstavke? }
 *
 * NIJEDNA PUTANJA NE SME DA STOJI NA DVA MESTA. Ekrani statistike stajali su
 * ranije kao podstavke ispod Nadzorne ploče, pa su se „Galerije" i „Baneri"
 * ponavljali u dve grupe. Sada su u sopstvenoj grupi IZVJEŠTAJI, sa nazivima
 * koji kažu da su izveštaj, a ne isti ekran kao u ARHIVI i SADRŽAJU.
 */
export const MENI = [
    {
        grupa: 'PREGLED',
        stavke: [
            { putanja: '/account/dashboard', naziv: 'Nadzorna ploča', ikona: 'ploca' },
        ],
    },
    {
        grupa: 'ARHIVA',
        stavke: [
            { putanja: '/account/galleries',  naziv: 'Galerije',   ikona: 'galerija' },
            { putanja: '/account/categories', naziv: 'Kategorije', ikona: 'kategorija' },
            { putanja: '/account/watermarks', naziv: 'Žigovi',     ikona: 'zig' },
        ],
    },
    {
        grupa: 'SADRŽAJ',
        stavke: [
            { putanja: '/account/pages',         naziv: 'Stranice',          ikona: 'strana' },
            { putanja: '/account/announcements', naziv: 'Najave',            ikona: 'najava' },
            { putanja: '/account/banners',       naziv: 'Baneri',            ikona: 'baner' },
            { putanja: '/account/faq',           naziv: 'FAQ',               ikona: 'faq' },
            { putanja: '/account/faqCategories', naziv: 'Kategorije pitanja', ikona: 'kategorija' },
            { putanja: '/account/slides',        naziv: 'Slajder',           ikona: 'slajder' },
        ],
    },
    {
        grupa: 'LJUDI',
        stavke: [
            { putanja: '/account/users',       naziv: 'Korisnici',    ikona: 'korisnik' },
            { putanja: '/account/subscribers', naziv: 'Pretplatnici', ikona: 'pretplata' },
        ],
    },
    {
        grupa: 'PORUKE',
        stavke: [
            { putanja: '/account/newsletter', naziv: 'Newsletter', ikona: 'posta' },
        ],
    },
    {
        grupa: 'IZVJEŠTAJI',
        stavke: [
            { putanja: '/account/archive-stats',      naziv: 'Statistika arhive',     ikona: 'statistika' },
            { putanja: '/account/gallery-stats',      naziv: 'Statistika galerija',   ikona: 'statistika' },
            { putanja: '/account/photographer-stats', naziv: 'Statistika fotografa',  ikona: 'statistika' },
            { putanja: '/account/banner-stats',       naziv: 'Statistika banera',     ikona: 'statistika' },
            { putanja: '/account/today-visits',       naziv: 'Statistika posjeta',    ikona: 'statistika' },
        ],
    },
    {
        grupa: 'SISTEM',
        stavke: [
            { putanja: '/account/settings',       naziv: 'Podešavanja', ikona: 'podesavanja' },
            { putanja: '/account/logs',           naziv: 'Logovi',      ikona: 'log' },
            { putanja: '/account/download-logs',  naziv: 'Preuzimanja', ikona: 'preuzeto' },
        ],
    },
];

const ULOGE = {
    admin: 'Administrator',
    agency: 'Agencija',
    photographer: 'Fotograf',
    physicalPerson: 'Korisnik',
    legalPerson: 'Pravno lice',
};

function Ikona({ naziv }) {
    return (
        <svg className="z-adminokvir__ikona" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d={I[naziv] || I.ploca} fill="currentColor" />
        </svg>
    );
}

class AdminOkvir extends Component {
    constructor(props) {
        super(props);

        /*
         * Sklopljene grupe se pamte, da se ne otvaraju iznova pri svakom
         * prelasku na drugu stranu. `localStorage` ne postoji na serveru, pa
         * se čita tek u `componentDidMount`.
         */
        this.state = {
            sklopljene: {},
            fiokaOtvorena: false,
        };
    }

    componentDidMount() {
        /*
         * Dok je administracija na ekranu, javno zaglavlje i podnožje se
         * sklanjaju. Rade se KLASOM NA <body>, a ne izmenom `defaultLayout.js`
         * — tako se ne dira ni jedna ruta ni provera prava, a okvir sam čisti
         * za sobom pri napuštanju strane.
         */
        if (typeof document !== 'undefined') {
            document.body.classList.add('u-administraciji');
        }

        try {
            const zapamceno = localStorage.getItem('admin-sklopljene');
            if (zapamceno) this.setState({ sklopljene: JSON.parse(zapamceno) });
        } catch (e) { /* privatni režim */ }
    }

    componentWillUnmount() {
        if (typeof document !== 'undefined') {
            document.body.classList.remove('u-administraciji');
        }
    }

    prebaciGrupu = (ime) => {
        const sklopljene = Object.assign({}, this.state.sklopljene);
        sklopljene[ime] = !sklopljene[ime];
        this.setState({ sklopljene });
        try { localStorage.setItem('admin-sklopljene', JSON.stringify(sklopljene)); } catch (e) {}
    };

    render() {
        const l = this.props.lang;
        const putanja = this.props.putanja || '';
        const u = this.props.uData;
        const podesavanja = this.props.settings || {};

        // Aktivna je stavka čija putanja tačno odgovara, ili je koren tekuće
        // (npr. `/account/banners/5` označava „Baneri").
        const jeOvde = (p) => putanja === p || putanja.indexOf(p + '/') === 0;

        return (
            <div className={'z-adminokvir' + (this.state.fiokaOtvorena ? ' z-adminokvir--fioka' : '')}>

                {/* ── BOČNI MENI ─────────────────────────────────────── */}
                <nav className="z-adminokvir__meni" aria-label={'Meni administracije'.translate(l)}>

                    <div className="z-adminokvir__logo">
                        <span className="z-adminokvir__logo-natpis">
                            {podesavanja.logoText || 'ZIPAPHOTO'}
                        </span>
                        <span className="z-adminokvir__logo-uz">{'administracija'.translate(l)}</span>
                    </div>

                    <div className="z-adminokvir__grupe">
                        {MENI.map((g) => {
                            /*
                             * Grupa se sklapa samo ako ima šta da sakrije — više
                             * od jedne stavke ili stavku sa podstavkama. Grupa sa
                             * jednom golom stavkom (PREGLED → Nadzorna ploča) je
                             * običan naslov: strelica iznad jedne stavke izgleda
                             * kao da se ta stavka rasklapa, a nema u šta.
                             */
                            const sklopiva = g.stavke.length > 1 || g.stavke.some((s) => s.podstavke && s.podstavke.length);
                            const sklopljena = sklopiva && !!this.state.sklopljene[g.grupa];
                            return (
                                <div className="z-adminokvir__grupa" key={g.grupa}>
                                    {sklopiva ? (
                                        <button
                                            type="button"
                                            className="z-adminokvir__naslov-grupe"
                                            aria-expanded={!sklopljena}
                                            onClick={() => this.prebaciGrupu(g.grupa)}
                                        >
                                            <span>{g.grupa.translate(l)}</span>
                                            <span className={'z-adminokvir__strelica' + (sklopljena ? ' z-adminokvir__strelica--sklopljena' : '')} aria-hidden="true" />
                                        </button>
                                    ) : (
                                        <div className="z-adminokvir__naslov-grupe z-adminokvir__naslov-grupe--tih">
                                            <span>{g.grupa.translate(l)}</span>
                                        </div>
                                    )}

                                    {sklopljena ? null : (
                                        <ul className="z-adminokvir__stavke">
                                            {g.stavke.map((s) => (
                                                <li key={s.putanja}>
                                                    <Link
                                                        to={s.putanja}
                                                        className={'z-adminokvir__stavka' + (jeOvde(s.putanja) ? ' z-adminokvir__stavka--ovde' : '')}
                                                        aria-current={jeOvde(s.putanja) ? 'page' : null}
                                                        title={s.naziv.translate(l)}
                                                        onClick={() => this.setState({ fiokaOtvorena: false })}
                                                    >
                                                        <Ikona naziv={s.ikona} />
                                                        <span className="z-adminokvir__natpis">{s.naziv.translate(l)}</span>
                                                    </Link>

                                                    {/* Podstavke se pokazuju samo dok se stoji u toj grani. */}
                                                    {s.podstavke && jeOvde(s.putanja) ? (
                                                        <ul className="z-adminokvir__podstavke">
                                                            {s.podstavke.map((p) => (
                                                                <li key={p.putanja}>
                                                                    <Link
                                                                        to={p.putanja}
                                                                        className={'z-adminokvir__podstavka' + (jeOvde(p.putanja) ? ' z-adminokvir__podstavka--ovde' : '')}
                                                                        aria-current={jeOvde(p.putanja) ? 'page' : null}
                                                                        onClick={() => this.setState({ fiokaOtvorena: false })}
                                                                    >
                                                                        {p.naziv.translate(l)}
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : null}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── dno: ko je prijavljen ──────────────────────── */}
                    <div className="z-adminokvir__dno">
                        {u ? (
                            <div className="z-adminokvir__ko">
                                <span className="z-adminokvir__ko-ime">{u.name || u.email}</span>
                                <span className="z-adminokvir__ko-uloga">
                                    {(ULOGE[u.userRole] || u.userRole || '').translate(l)}
                                </span>
                            </div>
                        ) : null}

                        <button
                            type="button"
                            className="z-adminokvir__odjava"
                            onClick={() => this.props.signOut && this.props.signOut()}
                        >
                            {'Odjava'.translate(l)}
                        </button>
                    </div>
                </nav>

                {/* Zavesa iza fioke na telefonu. */}
                <div
                    className="z-adminokvir__zavesa"
                    aria-hidden="true"
                    onClick={() => this.setState({ fiokaOtvorena: false })}
                />

                {/* ── DESNA STRANA ───────────────────────────────────── */}
                <div className="z-adminokvir__desno">

                    {/* GORNJA TRAKA — tanka, bela. Namerno bez korpe, bez
                        pomoći i bez prekidača jezika sajta. */}
                    <header className="z-adminokvir__traka">
                        <button
                            type="button"
                            className="z-adminokvir__hamburger"
                            aria-label={'Meni'.translate(l)}
                            aria-expanded={this.state.fiokaOtvorena}
                            onClick={() => this.setState({ fiokaOtvorena: !this.state.fiokaOtvorena })}
                        >
                            <span /><span /><span />
                        </button>

                        <div className="z-adminokvir__gde">
                            <span className="z-adminokvir__putanja">
                                {'Administracija'.translate(l)}
                                {this.props.naslov ? ' / ' : ''}
                            </span>
                            {this.props.naslov ? (
                                <h1 className="z-adminokvir__naslov">{this.props.naslov}</h1>
                            ) : null}
                        </div>

                        <div className="z-adminokvir__traka-desno">
                            {this.props.radnja || null}

                            <a
                                className="z-adminokvir__vidi-sajt"
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {'Vidi sajt'.translate(l)}
                                {/* Znak „otvara se u novoj kartici". Crtan kao SVG, a ne
                                    kao zarotirane ivice — na 10px se to čitalo kao „^". */}
                                <svg className="z-adminokvir__van" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                                    <path d="M6 3h7v7h-2V6.4L6.7 10.7 5.3 9.3 9.6 5H6V3z" fill="currentColor" />
                                    <path d="M3 5h2v8h8v2H3V5z" fill="currentColor" />
                                </svg>
                            </a>
                        </div>
                    </header>

                    <main className="z-adminokvir__sadrzaj">
                        {this.props.children}
                    </main>
                </div>
            </div>
        );
    }
}

export default AdminOkvir;
