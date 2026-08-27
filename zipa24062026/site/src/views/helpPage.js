import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import Page from '../containers/page';

import { Container } from 'reactstrap';
import { API_ENDPOINT } from '../constants';

import help1 from '../assets/svg/help1.svg';
import help2 from '../assets/svg/help2.svg';
import help3 from '../assets/svg/help3.svg';
import cartIcon from '../assets/svg/cart.svg';
import downloadIcon from '../assets/svg/download.svg';
import userIcon from '../assets/svg/user-icon.svg';
import secureIcon from '../assets/svg/secure.svg';
import infoIcon from '../assets/svg/info.svg';
import searchIcon from '../assets/svg/search.svg';

/*
 * POMOĆ — /help
 *
 * Pretraga u vrhu, teme kao kartice sa ikonicom i brojem pitanja, pa najčešća
 * pitanja odmah ispod, u harmonici.
 *
 * Kategorije se dovlače kao i pre (`/faqCategories/all`). Pitanja dolaze
 * javnim pozivom `/faq/all` koji već postoji — bez njega se ne mogu ni
 * prebrojati pitanja po temi ni pretraživati sadržaj. Nijedna ruta nije
 * menjana.
 */

// Ikonice se dodeljuju po redu teme — arhiva nema polje za ikonicu, a
// prazna kartica bi bila samo naslov u okviru.
const IKONICE = [help1, help2, help3, cartIcon, downloadIcon, userIcon, secureIcon, infoIcon];

const NAJCESCA = 6;

class HelpPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            ...props.initialData,
            items: [],
            pitanja: [],
            pojam: '',
            otvoreno: null,
        };
    }

    init() {
        window.scrollTo(0, 0);

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, null, this.props.lang).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }
        fetch(`${API_ENDPOINT}/faqCategories/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                items: result
            })
        })

        fetch(`${API_ENDPOINT}/faq/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                pitanja: Array.isArray(result) ? result : []
            })
        }).catch(() => { })
    }

    componentDidMount() {
        this.init()
    }

    componentDidUpdate(prevProps) {
        if (prevProps[0].location.pathname != this.props[0].location.pathname) {
            this.init();
        }
    }

    // Gola verzija teksta — pitanja čuvaju HTML, a u pretrazi oznake smetaju.
    static golo(html) {
        return String(html || '').replace(/<[^>]*>/g, ' ');
    }

    render() {
        const l = this.props.lang;
        const pojam = this.state.pojam.trim().toLowerCase();

        // Broj pitanja po temi — stoji na kartici da se vidi ima li šta unutra.
        const brojPo = {};
        this.state.pitanja.forEach((p) => {
            const k = String(p.category);
            brojPo[k] = (brojPo[k] || 0) + 1;
        });

        const nadjena = pojam
            ? this.state.pitanja.filter((p) => {
                const naslov = String(Object.translate(p, 'name', l) || '').toLowerCase();
                const telo = HelpPage.golo(Object.translate(p, 'content', l)).toLowerCase();
                return naslov.indexOf(pojam) !== -1 || telo.indexOf(pojam) !== -1;
            })
            : [];

        // Bez pretrage — prvih nekoliko pitanja po redosledu iz administracije.
        const prikazana = pojam ? nadjena : this.state.pitanja.slice(0, NAJCESCA);

        // Tema kojoj pitanje pripada, da se iz rezultata može otići dalje.
        const temaZa = (pitanje) => this.state.items.find((t) => String(t._id) === String(pitanje.category));

        return (
            <div className="contact-wrap z-pomoc">

                <header className="z-pomoc__vrh">
                    <Container>
                        <h1 className="z-pomoc__naslov">{'Pomoć'.translate(l)}</h1>
                        <p className="z-pomoc__uvod">
                            {'Pretražite pitanja ili izaberite temu ispod.'.translate(l)}
                        </p>

                        <div className="z-pomoc__pretraga">
                            <Isvg src={searchIcon} />
                            <input
                                type="search"
                                className="z-pomoc__polje"
                                placeholder={'Šta vas zanima?'.translate(l)}
                                aria-label={'Pretraga kroz pomoć'.translate(l)}
                                value={this.state.pojam}
                                onChange={(e) => this.setState({ pojam: e.target.value, otvoreno: null })}
                            />
                        </div>
                    </Container>
                </header>

                <Container>

                    {/* ── teme ───────────────────────────────────────── */}
                    {!pojam && this.state.items.length ? (
                        <section className="z-pomoc__odeljak">
                            <h2 className="z-pomoc__odeljak-naslov">{'Teme'.translate(l)}</h2>

                            <div className="z-pomoc__teme">
                                {this.state.items.map((item, idx) => {
                                    const broj = brojPo[String(item._id)] || 0;
                                    return (
                                        <Link
                                            className="z-pomoc__tema"
                                            key={item._id || idx}
                                            to={`/faq/${Object.translate(item, 'alias', 'ba')}`}
                                        >
                                            <span className="z-pomoc__tema-ikonica">
                                                <Isvg src={IKONICE[idx % IKONICE.length]} />
                                            </span>
                                            <span className="z-pomoc__tema-naziv">
                                                {Object.translate(item, 'name', l)}
                                            </span>
                                            <span className="z-pomoc__tema-broj">
                                                {broj} {(broj === 1 ? 'pitanje' : 'pitanja').translate(l)}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    ) : null}

                    {/* ── pitanja ────────────────────────────────────── */}
                    <section className="z-pomoc__odeljak">
                        <h2 className="z-pomoc__odeljak-naslov">
                            {pojam
                                ? `${'Rezultati pretrage'.translate(l)} (${nadjena.length})`
                                : 'Najčešća pitanja'.translate(l)}
                        </h2>

                        {prikazana.length ? (
                            <div className="z-pomoc__harmonika">
                                {prikazana.map((p, idx) => {
                                    const otvoreno = this.state.otvoreno === idx;
                                    const tema = temaZa(p);

                                    return (
                                        <div className="z-pomoc__pitanje" key={p._id || idx}>
                                            <h3 className="z-pomoc__pitanje-naslov">
                                                <button
                                                    type="button"
                                                    className="z-pomoc__prekidac"
                                                    aria-expanded={otvoreno}
                                                    onClick={() => this.setState({ otvoreno: otvoreno ? null : idx })}
                                                >
                                                    <span>{Object.translate(p, 'name', l)}</span>
                                                    <span className="z-pomoc__znak" aria-hidden="true">
                                                        {otvoreno ? '–' : '+'}
                                                    </span>
                                                </button>
                                            </h3>

                                            {otvoreno ? (
                                                <div className="z-pomoc__odgovor">
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: String(Object.translate(p, 'content', l) || '').replace(/\n/g, '<br/>')
                                                        }}
                                                    />
                                                    {tema ? (
                                                        <Link
                                                            className="z-pomoc__dalje"
                                                            to={`/faq/${Object.translate(tema, 'alias', 'ba')}`}
                                                        >
                                                            {'Više iz teme'.translate(l)}: {Object.translate(tema, 'name', l)}
                                                        </Link>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="z-pomoc__prazno">
                                {pojam
                                    ? 'Ništa nije pronađeno. Pokušajte drugu riječ ili nam pišite.'.translate(l)
                                    : 'Pitanja još nisu unijeta.'.translate(l)}
                            </p>
                        )}
                    </section>

                    {/* ── kad pomoć ne pomogne ───────────────────────── */}
                    <section className="z-pomoc__pomoc-dalje">
                        <p className="z-pomoc__pomoc-tekst">
                            {'Niste našli odgovor?'.translate(l)}
                        </p>
                        <Link className="z-pomoc__radnja" to="/contact">
                            {'Pišite nam'.translate(l)}
                        </Link>
                    </section>
                </Container>
            </div>
        );
    }
}

export default Page(HelpPage);
