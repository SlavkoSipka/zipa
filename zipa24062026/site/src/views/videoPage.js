import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';
import ReactPaginate from 'react-paginate';

import Page from '../containers/page';
import { YouTubePlejer } from '../components/youtube';
import UcitajJos from '../components/ucitajJos';

/* Broj snimaka po strani (2026-10-14) — 36 je podrazumevano. Bira se u
   adresi (`?ipp=90&page=2`), kao na /galerije, pa se strana može poslati. */
const PO_STRANI = [36, 90, 200];

const datum = (t) => {
    const d = new Date(t * 1000);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`;
};

/*
 * VIDEO — /video
 *
 * Snimci se ne postavljaju na naš server nego se povlače sa YouTube kanala
 * agencije: u administraciji se unosi adresa i naslov, a sličicu sistem sam
 * izvlači iz adrese (`slicicaSaYouTube` u `api/admin/admin.js`).
 *
 * Dovlačenje (`/videos/all`) i ruta su nepromenjeni.
 *
 * DUŽINA TRAJANJA: zapis snimka u bazi ima `title`, `link`, `thumbnail`,
 * `position` i `isActive` — trajanja NEMA. Iscrtava se samo ako polje
 * `duration` jednog dana bude uneto; ne izmišlja se broj.
 *
 * Strana je danas prazna (u bazi nema nijednog snimka), pa je prazno stanje
 * glavni prikaz, a ne rub slučaj.
 */
class VideoPage extends Component {
    constructor(props) {
        super(props);
        // `dodatoDoStrane` — poslednja strana dodata kroz „Prikaži još".
        this.state = { videos: [], dodatoDoStrane: null, ...props.initialData };
    }

    componentDidUpdate(prev) {
        if (prev[0].location.search !== this.props[0].location.search && this.state.dodatoDoStrane !== null) {
            this.setState({ dodatoDoStrane: null });
        }
    }

    componentDidMount() {
        window.scrollTo(0, 0);

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match).then((data) => {
                this.setState({ ...data }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                });
            });
        }
    }

    // Adresa iste strane sa izmenjenim parametrima; `null` briše parametar.
    veza = (izmene) => {
        const loc = this.props[0] && this.props[0].location;
        const upit = new URLSearchParams(loc ? loc.search : '');
        Object.keys(izmene).forEach((k) => (izmene[k] === null ? upit.delete(k) : upit.set(k, izmene[k])));
        const tekst = upit.toString();
        return '/video' + (tekst ? '?' + tekst : '');
    };

    render() {
        const l = this.props.lang;
        const snimci = this.state.videos || [];

        const loc = this.props[0] && this.props[0].location;
        const upit = new URLSearchParams(loc ? loc.search : '');
        const trazeno = Number(upit.get('ipp'));
        const poStrani = PO_STRANI.indexOf(trazeno) !== -1 ? trazeno : PO_STRANI[0];
        const brojStrana = Math.max(1, Math.ceil(snimci.length / poStrani));
        const strana = Math.min(Math.max(0, parseInt(upit.get('page'), 10) || 0), brojStrana - 1);
        // Snimci su već svi ovde, pa „Prikaži još" samo produži isečak.
        const doStrane = Math.min(Math.max(strana, this.state.dodatoDoStrane || 0), brojStrana - 1);
        const naStrani = snimci.slice(strana * poStrani, (doStrane + 1) * poStrani);

        // Isti izbor gore i dole; promena broja vraća na prvu stranu.
        const izborPoStrani = (
            <div className="z-alatna-traka__po-strani">
                <span className="z-alatna-traka__po-strani-natpis">{'Po strani'.translate(l)}</span>
                <div className="z-alatna-traka__prekidac">
                    {PO_STRANI.map((n, i) => (
                        <Link key={n}
                              to={this.veza({ ipp: i === 0 ? null : String(n), page: null })}
                              className={'z-alatna-traka__prekidac-dugme' + (n === poStrani ? ' z-alatna-traka__prekidac-dugme--aktivan' : '')}>
                            {n}
                        </Link>
                    ))}
                </div>
            </div>
        );

        return (
            <div className="video-strana z-video">

                <header className="z-video__vrh">
                    <Container>
                        <h1 className="z-video__naslov">{'Video'.translate(l)}</h1>
                        <p className="z-video__uvod">
                            {'Snimci sa kanala agencije ZIPA PHOTO.'.translate(l)}
                        </p>
                    </Container>
                </header>

                <Container>
                    {snimci.length ? (
                        <>
                        <div className="z-video__alati">
                            <span className="z-video__ukupno">
                                {snimci.length} {'snimaka'.translate(l)}
                            </span>
                            {izborPoStrani}
                        </div>

                        {/* Tri snimka u redu, široko. Naslov, grad i datum i opis
                            stoje IZNAD snimka; plejer se učitava tek na klik
                            (`components/youtube.js`). — 2026-10-10 */}
                        <div className="z-video__mreza">
                            {naStrani.map((v, i) => {
                                const naslov = Object.translate(v, 'title', l) || '';
                                const opis = v.opis ? Object.translate(v, 'opis', l) : '';
                                return (
                                    <article key={v._id || i} className="z-video__snimak">
                                        <div className="z-video__tekst">
                                            {naslov ? <h2 className="z-video__ime">{naslov}</h2> : null}
                                            {v.grad || v.datum ? (
                                                <p className="z-video__podaci">
                                                    {v.grad ? <span>{v.grad}</span> : null}
                                                    {v.grad && v.datum ? ' · ' : null}
                                                    {v.datum ? <span>{datum(v.datum)}</span> : null}
                                                </p>
                                            ) : null}
                                            {opis ? <p className="z-video__opis">{opis}</p> : null}
                                        </div>
                                        <YouTubePlejer link={v.link} slicica={v.thumbnail} naslov={naslov} lang={l} />
                                    </article>
                                );
                            })}
                        </div>

                        <UcitajJos
                            key={loc ? loc.search : ''}
                            lang={l}
                            imaJos={doStrane + 1 < brojStrana}
                            ucitava={false}
                            naUcitaj={() => this.setState({ dodatoDoStrane: doStrane + 1 })}
                        />

                        <div className="z-podela-dno">
                            {brojStrana > 1 ? (
                                <ReactPaginate
                                    previousLabel={''}
                                    nextLabel={''}
                                    breakLabel={'...'}
                                    breakClassName={'break-me'}
                                    pageCount={brojStrana}
                                    forcePage={doStrane}
                                    marginPagesDisplayed={1}
                                    pageRangeDisplayed={2}
                                    onPageChange={(p) => {
                                        if (p.selected === doStrane) return;
                                        this.props[0].history.push(this.veza({ page: p.selected ? String(p.selected) : null }));
                                        window.scrollTo(0, 0);
                                    }}
                                    containerClassName={'pagination'}
                                    activeClassName={'active'}
                                    hrefBuilder={(p) => this.veza({ page: p > 1 ? String(p - 1) : null })}
                                />
                            ) : <span />}
                            {izborPoStrani}
                        </div>
                        </>
                    ) : (
                        /* ── prazno stanje ─────────────────────────────── */
                        <div className="z-video__prazno">
                            <span className="z-video__prazno-znak" aria-hidden="true" />

                            <h2 className="z-video__prazno-naslov">
                                {'Snimci tek stižu'.translate(l)}
                            </h2>
                            <p className="z-video__prazno-opis">
                                {'Ovdje će stajati snimci sa terena — konferencije, utakmice, dešavanja u gradu. Do tada, arhiva fotografija je otvorena.'.translate(l)}
                            </p>

                            <div className="z-video__prazno-radnje">
                                <Link className="z-video__radnja z-video__radnja--glavna" to="/galerije">
                                    {'Pretraži arhivu'.translate(l)}
                                </Link>
                                <Link className="z-video__radnja" to="/contact">
                                    {'Naručite snimanje'.translate(l)}
                                </Link>
                            </div>
                        </div>
                    )}
                </Container>
            </div>
        );
    }
}

// Kroz `Page` stranica dobija zaglavlje, podnožje i podešavanja sajta.
export default Page(VideoPage);
