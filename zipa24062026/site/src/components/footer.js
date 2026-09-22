import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import znakZipaTamni from '../assets/svg/logo.svg';

import social1 from '../assets/svg/social1.svg';
import social2 from '../assets/svg/social2.svg';
import social3 from '../assets/svg/social3.svg';
import social4 from '../assets/svg/social4.svg';
import social5 from '../assets/svg/social5.svg';
import social6 from '../assets/svg/social6.svg';

import newsletterIcon from '../assets/svg/newsletter-icon.svg';

import phoneIcon from '../assets/svg/footer-phone.svg';
import locationIcon from '../assets/svg/footer-location.svg';

import {
    Container,
    Row,
    Col
} from 'reactstrap';
import { API_ENDPOINT } from '../constants';

/*
 * PODNOŽJE
 *
 * Sajt se zatvara istim tonom kojim je otvoren — podnožje nosi `--boja-traka`,
 * isto kao zaglavlje. Izgled je u `scss/_podnozje.scss`; tamo se tokeni
 * preusmeravaju u opsegu podnožja, pa veze, polja i okviri fokusa potamne
 * odjednom.
 *
 * Klasa `podnozje-sajta` ostaje uz novu `z-podnozje`: `_global.scss` cilja
 * podnožje po toj klasi (`footer:where(.podnozje-sajta)`), pa bi njeno
 * uklanjanje promenilo šta se gasi pri štampi.
 */

// Društvene mreže — ikonica, polje u podešavanjima i naziv za čitač ekrana.
// Ako mreža nema adresu u podešavanjima, ne iscrtava se uopšte.
const MREZE = [
    { kljuc: 'facebook',  ikona: social1, naziv: 'Facebook' },
    { kljuc: 'instagram', ikona: social2, naziv: 'Instagram' },
    { kljuc: 'twitter',   ikona: social3, naziv: 'X (Twitter)' },
    { kljuc: 'pinterest', ikona: social4, naziv: 'Pinterest' },
    { kljuc: 'tumblr',    ikona: social5, naziv: 'Tumblr' },
    { kljuc: 'linkedin',  ikona: social6, naziv: 'LinkedIn' },
];

class Footer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            email: '',
            _done: null,
            _error: null,
        };
    }

    /*
     * Prijava na newsletter.
     *
     * Poziv ka API-ju je NEPROMENJEN. Dodata je samo provera pre slanja, da
     * bi poruka mogla da kaže šta je tačno pošlo naopako: API vraća samo
     * `{error: true}`, bez razloga, pa se prazna i neispravna adresa inače
     * ne bi mogle razlikovati.
     */
    prijaviSe = () => {
        const email = (this.state.email || '').trim();
        const l = this.props.lang;

        if (!email) {
            this.setState({ _done: null, _error: 'Unesite e-mail adresu.'.translate(l) });
            return;
        }

        if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
            this.setState({
                _done: null,
                _error: 'Adresa nije ispravna — proverite da li ste je tačno unijeli.'.translate(l)
            });
            return;
        }

        fetch(`${API_ENDPOINT}/newsletter/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: this.state.email })
        }).then((res) => res.json()).then((result) => {
            if (!result.error) {
                this.setState({
                    _done: 'Prijavljeni ste. Hvala vam!'.translate(l),
                    _error: null,
                })
            } else {
                this.setState({
                    _error: 'Prijava nije uspjela. Pokušajte ponovo za koji trenutak.'.translate(l),
                    _done: null
                })
            }
        }).catch(() => {
            this.setState({
                _error: 'Nema veze sa serverom. Provjerite internet i pokušajte ponovo.'.translate(l),
                _done: null
            })
        })
    };

    render() {
        const l = this.props.lang;
        const p = this.props.settings || {};

        const mreze = MREZE.filter((m) => p[m.kljuc]);

        // Arhiva ide od 1990; druga godina je uvek tekuća.
        const godina = new Date().getFullYear();

        return (
            <>

                {p.enableInfoBlocks ?
                    <section className="section-info-blocks">

                        <Container>
                            <Row>
                                {
                                    p.infoblock.map((item, idx) => {
                                        return (
                                            <Col lg="3" className="item" key={idx}>
                                                <Isvg src={item.icon} />
                                                <div>
                                                    <h6>{Object.translate(item, 'value', l)}</h6>
                                                    <p>{Object.translate(item, 'name', l)}</p>
                                                </div>
                                            </Col>
                                        )
                                    })
                                }

                            </Row>
                        </Container>
                    </section>
                    : null
                }

                <footer className="podnozje-sajta z-podnozje">
                    <div className="z-podnozje__sirina">

                        {/* ── newsletter ───────────────────────────────── */}
                        {!p.enableInfoBlocks ?
                            <div className="z-podnozje__newsletter">
                                <div className="z-podnozje__newsletter-tekst">
                                    <h2 className="z-podnozje__newsletter-naslov">
                                        {'Prijavite se na naš newsletter'.translate(l)}
                                    </h2>
                                    <p className="z-podnozje__newsletter-opis">
                                        {'Nove galerije iz arhive, jednom mjesečno. Odjava je moguća u svakom trenutku.'.translate(l)}
                                    </p>
                                </div>

                                <div className="z-podnozje__newsletter-obrazac">
                                    <div className="z-podnozje__polje-red">
                                        <input
                                            type="email"
                                            className="z-podnozje__unos"
                                            value={this.state.email}
                                            aria-label={'Vaša e-mail adresa'.translate(l)}
                                            placeholder={'Unesite svoju e-mail adresu'.translate(l)}
                                            onChange={(e) => this.setState({ email: e.target.value })}
                                            onKeyDown={(e) => { if (e.key === 'Enter') this.prijaviSe(); }}
                                        />
                                        <button type="button"
                                                className="z-podnozje__dugme"
                                                onClick={this.prijaviSe}>
                                            {'Prijavi se'.translate(l)}
                                        </button>
                                    </div>

                                    {/* `role="status"` da čitač ekrana pročita ishod
                                        bez pomjeranja fokusa. */}
                                    {this.state._done ?
                                        <p className="z-podnozje__poruka z-podnozje__poruka--uspeh" role="status">
                                            {this.state._done}
                                        </p>
                                        : null}
                                    {this.state._error ?
                                        <p className="z-podnozje__poruka z-podnozje__poruka--greska" role="status">
                                            {this.state._error}
                                        </p>
                                        : null}
                                </div>
                            </div>
                            : null}

                        {/* ── stupci ───────────────────────────────────── */}
                        <div className="z-podnozje__stupci">

                            <div>
                                {p.footerLogo ?
                                    <div className="z-podnozje__logo">
                                        <span className="z-znak z-znak--svetli"><Isvg src={p.footerLogo} /></span>
                                        {/* Na svetlom podnožju (tema C) — tamni znak iz sajta. */}
                                        <img className="z-znak z-znak--tamni" src={znakZipaTamni} alt="" />
                                    </div>
                                    : null}
                                <p className="z-podnozje__o-nama">
                                    {'Prva foto agencija u Bosni i Hercegovini. Zipa Agency nudi profesionalno fotografisanje, video i dron snimanje svih događaja u zemlji i okruženju, prema potrebama medijskih kuća, pravnih i fizičkih lica. Pogledajte arhivu fotografija od 1990. godine pa do danas.'.translate(l)}
                                </p>

                                {mreze.length ?
                                    <div className="z-podnozje__mreze">
                                        {mreze.map((m) => (
                                            <a key={m.kljuc}
                                               className="z-podnozje__mreza"
                                               href={p[m.kljuc]}
                                               target="_blank"
                                               rel="noopener noreferrer"
                                               aria-label={m.naziv}>
                                                <Isvg src={m.ikona} />
                                            </a>
                                        ))}
                                    </div>
                                    : null}
                            </div>

                            <div>
                                <h2 className="z-podnozje__naslov-stupca">{'Navigacija'.translate(l)}</h2>
                                <ul className="z-podnozje__spisak">
                                    <li><Link className="z-podnozje__veza" to="/">{'Početna'.translate(l)}</Link></li>
                                    <li><Link className="z-podnozje__veza" to="/galerije">{'Galerije'.translate(l)}</Link></li>
                                    <li><Link className="z-podnozje__veza" to="/video">{'Video'.translate(l)}</Link></li>
                                    <li><Link className="z-podnozje__veza" to="/page/o-nama">{'Agencija'.translate(l)}</Link></li>
                                    <li><Link className="z-podnozje__veza" to="/help">{'Pomoć'.translate(l)}</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="z-podnozje__naslov-stupca">{'Pravno'.translate(l)}</h2>
                                <ul className="z-podnozje__spisak">
                                    <li><Link className="z-podnozje__veza" to="/page/uslovi-koriscenja">{'Uslovi korišćenja'.translate(l)}</Link></li>
                                    <li><Link className="z-podnozje__veza" to="/page/impresum">{'Impresum'.translate(l)}</Link></li>
                                    <li><Link className="z-podnozje__veza" to="/page/ugovori">{'Ugovori'.translate(l)}</Link></li>
                                    <li><Link className="z-podnozje__veza" to="/odjava">{'Odjava sa newslettera'.translate(l)}</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="z-podnozje__naslov-stupca">{'Kontakt'.translate(l)}</h2>

                                {p.phoneNumber ?
                                    <div className="z-podnozje__kontakt-stavka">
                                        <Isvg src={phoneIcon} />
                                        <p><a className="z-podnozje__veza" href={`tel:${String(p.phoneNumber).replace(/\s/g, '')}`}>{p.phoneNumber}</a></p>
                                    </div>
                                    : null}

                                {p.location ?
                                    <div className="z-podnozje__kontakt-stavka">
                                        <Isvg src={locationIcon} />
                                        <p dangerouslySetInnerHTML={{ __html: p.location.replace(/\n/g, '<br/>') }} />
                                    </div>
                                    : null}

                                <div className="z-podnozje__kontakt-stavka">
                                    <Isvg src={newsletterIcon} />
                                    <p><a className="z-podnozje__veza" href="mailto:info@zipaphoto.net">info@zipaphoto.net</a></p>
                                </div>
                            </div>
                        </div>

                        {this.props.footerBanner ?
                            <div className="z-podnozje__baner">
                                {
                                    this.props.footerBanner.images.map((item, idx) => {
                                        return (
                                            <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer"
                                               onClick={() => this.props.bannerClick(item.link)}>
                                                <img src={item.image} alt="" />
                                            </a>
                                        )
                                    })
                                }
                            </div>
                            : null
                        }

                        {/* ── donji red ────────────────────────────────── */}
                        <div className="z-podnozje__dno">
                            <p>{`Copyright © ZIPA PHOTO AGENCY — 1990–${godina}. `}{'Sva prava zadržana.'.translate(l)}</p>
                            <p>
                                {'Izrada'.translate(l)}{' '}
                                <a href="https://aisajt.com" target="_blank" rel="noopener noreferrer">AiSajt</a>
                            </p>
                        </div>
                    </div>
                </footer>
            </>
        );
    }
}

export default Footer;
