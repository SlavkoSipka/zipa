import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Page from '../../containers/page';
import { posleprijave } from '../../posleprijave';

import { API_ENDPOINT, PHOTOS_ENDPOINT } from '../../constants';
import moment from 'moment';

/*
 * PRIJAVA
 *
 * Dve strane na širokom ekranu: levo obrazac, desno fotografija iz arhive sa
 * potpisom. Na telefonu ostaje samo obrazac.
 *
 * Varijante po izgledu naslovne (`prijava-a/b/c`) su UKLONJENE — boje sada
 * dolaze iz tokena, pa se razlika između tema dobija sama preko `data-tema`.
 *
 * Poziv ka API-ju i imena polja su nepromenjeni.
 */
class LoginPage extends Component {
    constructor(props) {
        super(props);
        this.submit = this.submit.bind(this);

        this.state = {
            email: '',
            password: '',
            remember: false,
            prikaziLozinku: false,
            salje: false,
            greskePolja: {},
        };
    }

    componentDidMount() {
        if (typeof window !== 'undefined') { window.scrollTo(0, 0); }
        this.props.updateMeta(this.props.generateSeoTags(null));
    }

    /*
     * Provera pre slanja — da bi greška mogla da stoji ispod polja na koje se
     * odnosi. Server i dalje proverava sve isto; ovo mu samo štedi put kad je
     * očigledno da nešto nedostaje.
     */
    proveri() {
        const l = this.props.lang;
        const greske = {};

        if (!this.state.email.trim()) {
            greske.email = 'Unesite e-mail adresu.'.translate(l);
        } else if (this.state.email.indexOf('@') === -1 || this.state.email.indexOf('.') === -1) {
            greske.email = 'Adresa nije ispravna — provjerite da li ste je tačno unijeli.'.translate(l);
        }

        if (!this.state.password) {
            greske.password = 'Unesite lozinku.'.translate(l);
        }

        this.setState({ greskePolja: greske });
        return Object.keys(greske).length === 0;
    }

    submit(e) {
        if (e) e.preventDefault();
        if (this.state.salje) return;      // ne može dvaput
        if (!this.proveri()) return;

        let cart = localStorage.getItem('cart');
        if (!cart) {
            cart = [];
        } else {
            cart = JSON.parse(cart);
        }

        this.setState({ salje: true, error: null });

        fetch(`${API_ENDPOINT}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: this.state.email,
                password: this.state.password,
                rememberMe: this.state.remember,
                cart
            })
        }).then(res => res.json()).then((result) => {
            if (result.error) {
                this.setState({ error: result.error, salje: false })
            } else {
                localStorage.setItem('authToken', result.token);
                localStorage.removeItem('cart');

                /*
                 * Kuda posle prijave zavisi od uloge: administrator ide na
                 * nadzornu ploču u administratorskom okviru, svi ostali na
                 * svoj nalog. Zato se čeka `verifyUser` — do tada se uloga
                 * još ne zna. Ako provera padne, ide se na nalog, kao i do
                 * sada.
                 */
                Promise.resolve(this.props.verifyUser()).then((u) => {
                    this.props[0].history.push(posleprijave(u));
                });
            }
        }).catch(() => {
            this.setState({
                error: 'Nema veze sa serverom. Provjerite internet i pokušajte ponovo.'.translate(this.props.lang),
                salje: false
            });
        })
    }

    render() {
        const l = this.props.lang;
        const g = this.state.greskePolja;

        /* Fotografija dolazi iz najnovije galerije — iste koju `App.js` već
           dovlači za traku najave i naslovni blok. Bez novog poziva. */
        /* Galerija izabrana u administraciji (*Stranice → Prijava i
           registracija*); bez izbora ide najnovija, kao i do sada. */
        const galerija = this.props.prijavaGalerija || this.props.najava;
        const slika = galerija && galerija.photos && galerija.photos[0]
            ? `${PHOTOS_ENDPOINT}/photos/700x/${galerija.photos[0].image}`
            : null;

        return (
            <div className="login-wrap z-prijava">

                <div className="z-prijava__strana">
                    <div className="z-prijava__okvir">
                        <h1 className="z-prijava__naslov">
                            {'Dobrodošli nazad'.translate(l)}
                        </h1>
                        <p className="z-prijava__uvod">
                            {'Prijavite se da biste koristili usluge našeg foto servisa.'.translate(l)}
                        </p>

                        {this.state.error ? (
                            <p className="z-prijava__greska">
                                {this.state.error}
                                {' '}
                                {'Za sva pitanja pišite nam na'.translate(l)}{' '}
                                <a href="mailto:info@zipaphoto.net">info@zipaphoto.net</a>{' '}
                                {'ili pozovite +387 66 00 11 22.'.translate(l)}
                            </p>
                        ) : null}

                        <form className="login-form" onSubmit={this.submit} noValidate>

                            <div className="z-prijava__polje">
                                <label className="z-prijava__oznaka" htmlFor="prijava-email">
                                    {'E-mail adresa'.translate(l)}
                                </label>
                                <input
                                    id="prijava-email"
                                    type="email"
                                    className={'z-prijava__unos' + (g.email ? ' z-prijava__unos--greska' : '')}
                                    placeholder={'ime@domain.com'.translate(l)}
                                    value={this.state.email}
                                    aria-invalid={!!g.email}
                                    aria-describedby={g.email ? 'greska-email' : null}
                                    onChange={(e) => this.setState({ email: e.target.value })}
                                    onBlur={() => { if (this.state.email) this.proveri(); }}
                                />
                                {g.email ? (
                                    <span className="z-prijava__greska-polja" id="greska-email">
                                        {g.email}
                                    </span>
                                ) : null}
                            </div>

                            <div className="z-prijava__polje">
                                <label className="z-prijava__oznaka" htmlFor="prijava-lozinka">
                                    {'Lozinka'.translate(l)}
                                </label>
                                <div className="z-prijava__polje-lozinka">
                                    <input
                                        id="prijava-lozinka"
                                        type={this.state.prikaziLozinku ? 'text' : 'password'}
                                        className={'z-prijava__unos' + (g.password ? ' z-prijava__unos--greska' : '')}
                                        placeholder={'Unesite lozinku'.translate(l)}
                                        value={this.state.password}
                                        aria-invalid={!!g.password}
                                        aria-describedby={g.password ? 'greska-lozinka' : null}
                                        onChange={(e) => this.setState({ password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="z-prijava__prikazi"
                                        aria-pressed={this.state.prikaziLozinku}
                                        onClick={() => this.setState({ prikaziLozinku: !this.state.prikaziLozinku })}
                                    >
                                        {this.state.prikaziLozinku
                                            ? 'Sakrij'.translate(l)
                                            : 'Prikaži'.translate(l)}
                                    </button>
                                </div>
                                {g.password ? (
                                    <span className="z-prijava__greska-polja" id="greska-lozinka">
                                        {g.password}
                                    </span>
                                ) : null}
                            </div>

                            <div className="z-prijava__red-opcija">
                                <label className="z-prijava__zapamti">
                                    <input
                                        type="checkbox"
                                        checked={this.state.remember}
                                        onChange={(e) => this.setState({ remember: e.target.checked })}
                                    />
                                    {'Zapamti me'.translate(l)}
                                </label>

                                <Link className="z-prijava__veza" to="/reset-password">
                                    {'Zaboravljena lozinka'.translate(l)}
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="z-prijava__dugme"
                                disabled={this.state.salje}
                            >
                                {this.state.salje
                                    ? 'Prijavljivanje…'.translate(l)
                                    : 'Prijavi se'.translate(l)}
                            </button>
                        </form>

                        <p className="z-prijava__dno">
                            {'Niste registrovani?'.translate(l)}{' '}
                            <Link to="/register">{'Kreirajte nalog'.translate(l)}</Link>
                        </p>
                    </div>
                </div>

                {/* Fotografija iz arhive sa potpisom — reklama za agenciju. */}
                {slika ? (
                    <div className="z-prijava__slika">
                        <img src={slika} alt="" loading="lazy" decoding="async" />
                        <div className="z-prijava__potpis">
                            <p className="z-prijava__potpis-naslov">
                                {Object.translate(galerija, 'name', l)}
                            </p>
                            <p className="z-prijava__potpis-podaci">
                                {galerija.user ? galerija.user : null}
                                {galerija.user && galerija.location ? ' · ' : null}
                                {galerija.location ? galerija.location : null}
                                {(galerija.user || galerija.location) && galerija.date ? ' · ' : null}
                                {galerija.date ? moment.unix(galerija.date).format('YYYY.') : null}
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }
}

export default Page(LoginPage);
