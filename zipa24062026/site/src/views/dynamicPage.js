import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Page from '../containers/page';

import { Container } from 'reactstrap';

/*
 * SADRŽAJNA STRANA — /page/:alias
 *
 * JEDAN IZGLED ZA SVE: o nama, uslovi korišćenja, impresum, fotografisanje,
 * prijatelji sajta, saradnja, ugovori. Sadržaj se unosi u administraciji kao
 * HTML, pa strana ne može da pretpostavlja strukturu — mora da lepo obuče
 * bilo šta što stigne: naslove, spiskove, citate, tabele i slike.
 *
 * Dovlačenje (`loadData`) i ruta su nepromenjeni.
 *
 * Sadržaj sa strane se izvodi IZ SAMOG TEKSTA: naslovima h2 i h3 se dodaje
 * `id` i od njih se pravi spisak. Ako tekst nema nijedan naslov, spiska nema
 * i tekst zauzima punu čitljivu širinu.
 */

// Naša slova u ASCII, da `id` u adresi ostane upotrebljiv.
const PRESLOVI = { 'č': 'c', 'ć': 'c', 'ž': 'z', 'š': 's', 'đ': 'dj' };

const kljuc = (tekst, redni) => {
    const golo = String(tekst || '')
        .replace(/<[^>]*>/g, '')
        .toLowerCase()
        .replace(/[čćžšđ]/g, (z) => PRESLOVI[z])
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return golo ? `${golo}-${redni}` : `odeljak-${redni}`;
};

/*
 * Prolaz kroz uneti HTML: h2 i h3 dobijaju `id`, a usput se skuplja spisak
 * za sadržaj sa strane. Radi nad tekstom, pa isto daje i na serveru i u
 * pregledaču — bez toga bi se prvo iscrtavanje razlikovalo.
 */
const obradi = (html) => {
    const izvor = String(html || '');
    const naslovi = [];
    let redni = 0;

    const obradjen = izvor.replace(
        /<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/gi,
        (ceo, oznaka, atributi, sadrzaj) => {
            // Ako je `id` već unet u administraciji, poštuje se.
            const postojeci = /id\s*=\s*["']([^"']+)["']/i.exec(atributi);
            const id = postojeci ? postojeci[1] : kljuc(sadrzaj, redni);
            redni += 1;

            naslovi.push({
                id,
                nivo: oznaka.toLowerCase() === 'h2' ? 2 : 3,
                tekst: String(sadrzaj).replace(/<[^>]*>/g, '').trim(),
            });

            return postojeci
                ? ceo
                : `<${oznaka}${atributi} id="${id}">${sadrzaj}</${oznaka}>`;
        }
    );

    return { html: obradjen, naslovi: naslovi.filter((n) => n.tekst) };
};

/*
 * Prazna strana je i dalje strana — mora da kaže šta dalje.
 *
 * „Prazno" nije samo nula znakova. „Saradnja" u bazi ima `<p>saradnja...</p>`,
 * a „Ugovori" `<p>Ugovori</p>` — nacrt, ne sadržaj. Ispod 40 znakova nema
 * sadržajne strane, pa je granica tu.
 */
const NAJMANJE = 40;

const prazna = (html) => {
    const tekst = String(html || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return tekst.length < NAJMANJE;
};

class DynamicPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            ...props.initialData
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
    }

    componentDidMount() {
        this.init()
    }

    componentDidUpdate(prevProps) {
        if (prevProps[0].location.pathname != this.props[0].location.pathname) {
            this.init();
        }
    }

    render() {
        const l = this.props.lang;
        const naziv = Object.translate(this.state.data, 'name', l);
        const sirov = Object.translate(this.state.data, 'content', l);

        const jePrazna = prazna(sirov);
        const { html, naslovi } = jePrazna ? { html: '', naslovi: [] } : obradi(sirov);

        return (
            <div className="contact-wrap z-strana">

                <header className="z-strana__vrh">
                    <Container>
                        <p className="z-strana__putanja">
                            <Link to="/">{'Početna'.translate(l)}</Link>
                        </p>
                        <h1 className="z-strana__naslov">{naziv}</h1>
                    </Container>
                </header>

                <Container>
                    {jePrazna ? (
                        /* ── prazno stanje ──────────────────────────── */
                        <div className="z-strana__prazno">
                            <h2 className="z-strana__prazno-naslov">
                                {'Ova strana se priprema'.translate(l)}
                            </h2>
                            <p className="z-strana__prazno-opis">
                                {'Sadržaj još nije objavljen. Ako vam treba baš ovaj podatak, javite nam se — odgovorićemo na pitanje i bez strane.'.translate(l)}
                            </p>
                            <div className="z-strana__prazno-radnje">
                                <Link className="z-strana__radnja z-strana__radnja--glavna" to="/contact">
                                    {'Pišite nam'.translate(l)}
                                </Link>
                                <Link className="z-strana__radnja" to="/galerije">
                                    {'Pretraži arhivu'.translate(l)}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className={'z-strana__raspored' + (naslovi.length > 1 ? '' : ' z-strana__raspored--bez-sadrzaja')}>

                            {/* ── sadržaj sa strane ──────────────────── */}
                            {naslovi.length > 1 ? (
                                <nav className="z-strana__sadrzaj" aria-label={'Sadržaj strane'.translate(l)}>
                                    <p className="z-strana__sadrzaj-naslov">{'Na ovoj strani'.translate(l)}</p>
                                    <ul className="z-strana__spisak">
                                        {naslovi.map((n) => (
                                            <li key={n.id}>
                                                <a
                                                    className={'z-strana__stavka' + (n.nivo === 3 ? ' z-strana__stavka--uvuceno' : '')}
                                                    href={`#${n.id}`}
                                                >
                                                    {n.tekst}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            ) : null}

                            {/* ── tekst ──────────────────────────────── */}
                            <main
                                className="z-strana__telo"
                                dangerouslySetInnerHTML={{ __html: html }}
                            />
                        </div>
                    )}
                </Container>
            </div>
        );
    }
}

export default Page(DynamicPage);
