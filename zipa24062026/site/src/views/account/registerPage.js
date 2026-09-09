import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';

import ZEMLJE from '../../components/forms/zemlje';
import emailSent from '../../assets/svg/email-sent.svg';
import { API_ENDPOINT, PHOTOS_ENDPOINT } from '../../constants';
import moment from 'moment';

/*
 * REGISTRACIJA
 *
 * Isti tok kao do sada — jedan obrazac, jedno slanje. Menja se izgled i to
 * kada se greška pokazuje: uslovi za lozinku se čekiraju UŽIVO dok se kuca,
 * a ne stižu kao poruka posle slanja.
 *
 * Imena polja i poziv ka API-ju su NEPROMENJENI: server čita `email`,
 * `password`, `name` i `type`. `country` se šalje kao i ranije, ali je
 * označeno kao neobavezno jer ga server ne čita.
 */

// Pravila lozinke prepisana iz `api/users/users.js` (`checkPassword`), da bi
// korisnik video šta se traži PRE slanja, a ne posle odbijanja.
const USLOVI_LOZINKE = [
    { kljuc: 'duzina', tekst: 'od 6 do 16 znakova', vazi: (v) => v.length >= 6 && v.length <= 16 },
    { kljuc: 'malo',   tekst: 'malo slovo',        vazi: (v) => /[a-z]/.test(v) },
    { kljuc: 'veliko', tekst: 'veliko slovo',      vazi: (v) => /[A-Z]/.test(v) },
    { kljuc: 'cifra',  tekst: 'cifra',             vazi: (v) => /\d/.test(v) },
    { kljuc: 'znak',   tekst: 'specijalan znak',   vazi: (v) => /[^a-zA-Z0-9]/.test(v) },
    { kljuc: 'razmak', tekst: 'bez razmaka',       vazi: (v) => v.length > 0 && !/\s/.test(v) },
];

const TIPOVI = [
    { value: 'agency',         naziv: 'Mediji',        opis: 'Štampani mediji, novinske agencije, web portali, radio stanice' },
    { value: 'legalPerson',    naziv: 'Pravna lica',   opis: 'Državne institucije, kompanije i registrovani poslovni subjekti' },
    { value: 'physicalPerson', naziv: 'Privatno lice', opis: '' },
    { value: 'photographer',   naziv: 'Fotografi',     opis: '' },
];

class RegisterPage extends Component {
    constructor(props) {
        super(props);
        this.submit = this.submit.bind(this);

        this.state = {
            type: '',
            email: '',
            name: '',
            country: '',
            password: '',
            termsAndConditions: false,

            prikaziLozinku: false,
            salje: false,
            greskePolja: {},
            // Polja kroz koja je korisnik već prošao — greška se pokazuje tek
            // kad izađe iz polja, ne dok kuca.
            dodirnuta: {},
        };
    }

    componentDidMount() {
        if (typeof window !== 'undefined') { window.scrollTo(0, 0); }
        this.props.updateMeta(this.props.generateSeoTags(null));
    }

    lozinkaVazi(v) {
        return USLOVI_LOZINKE.every((u) => u.vazi(v));
    }

    // Vraća greške za sva polja; koje će se PRIKAZATI odlučuje `dodirnuta`.
    greske() {
        const l = this.props.lang;
        const g = {};

        if (!this.state.type) {
            g.type = 'Izaberite tip naloga.'.translate(l);
        }
        if (!this.state.email.trim()) {
            g.email = 'Unesite e-mail adresu.'.translate(l);
        } else if (this.state.email.indexOf('@') === -1 || this.state.email.indexOf('.') === -1) {
            g.email = 'Adresa nije ispravna — provjerite da li ste je tačno unijeli.'.translate(l);
        }
        if (!this.state.name.trim()) {
            g.name = 'Unesite ime i prezime.'.translate(l);
        }
        if (!this.state.password) {
            g.password = 'Unesite lozinku.'.translate(l);
        } else if (!this.lozinkaVazi(this.state.password)) {
            g.password = 'Lozinka ne ispunjava sve uslove ispod.'.translate(l);
        }
        if (!this.state.termsAndConditions) {
            g.termsAndConditions = 'Morate prihvatiti uslove korištenja.'.translate(l);
        }

        return g;
    }

    dodirni(polje) {
        this.setState((prev) => ({
            dodirnuta: { ...prev.dodirnuta, [polje]: true },
            greskePolja: this.greske(),
        }));
    }

    submit(e) {
        if (e) e.preventDefault();
        if (this.state.salje) return;

        const g = this.greske();
        if (Object.keys(g).length) {
            // Pri slanju se pokazuju sve greške, ne samo dodirnuta polja.
            this.setState({
                greskePolja: g,
                dodirnuta: { type: true, email: true, name: true, password: true, termsAndConditions: true },
            });
            return;
        }

        this.setState({ salje: true, error: null });

        fetch(`${API_ENDPOINT}/user/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: this.state.type,
                email: this.state.email,
                name: this.state.name,
                country: this.state.country,
                password: this.state.password,
                termsAndConditions: this.state.termsAndConditions,
            })
        }).then(res => res.json()).then((result) => {
            if (result.error) {
                this.setState({ error: result.error, salje: false })
            } else {
                this.setState({ done: true, salje: false })
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
        const d = this.state.dodirnuta;
        const pokazi = (polje) => (d[polje] ? g[polje] : null);

        const ispunjeni = USLOVI_LOZINKE.filter((u) => u.vazi(this.state.password)).length;

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

                        {this.state.done ? (
                            /* Šta sledi — konkretno, sa adresom na koju je poruka
                               poslata, da korisnik zna gde da je traži. */
                            <div className="z-prijava__poslato">
                                <Isvg src={emailSent} />
                                <h1 className="z-prijava__poslato-naslov">
                                    {'Poslali smo vam poruku'.translate(l)}
                                </h1>
                                <p className="z-prijava__poslato-opis">
                                    {'Otvorite poruku na'.translate(l)}{' '}
                                    <strong>{this.state.email}</strong>{' '}
                                    {'i potvrdite nalog. Nakon toga nalog odobravamo ručno, pa vas molimo za malo strpljenja.'.translate(l)}
                                </p>
                            </div>
                        ) : (
                            <>
                                <h1 className="z-prijava__naslov">
                                    {'Kreirajte nalog'.translate(l)}
                                </h1>
                                <p className="z-prijava__uvod">
                                    {'Besplatna registracija na prvi foto servis u Bosni i Hercegovini.'.translate(l)}
                                </p>

                                {this.state.error ? (
                                    <p className="z-prijava__greska">{this.state.error}</p>
                                ) : null}

                                <form className="login-form" onSubmit={this.submit} noValidate>

                                    {/* ── tip naloga ─────────────────────── */}
                                    <div className="z-prijava__polje">
                                        <span className="z-prijava__oznaka">
                                            {'Tip naloga'.translate(l)}
                                        </span>
                                        <div className="z-prijava__tipovi">
                                            {TIPOVI.map((t) => (
                                                <button
                                                    type="button"
                                                    key={t.value}
                                                    aria-pressed={this.state.type === t.value}
                                                    className={'z-prijava__tip' + (this.state.type === t.value ? ' z-prijava__tip--izabran' : '')}
                                                    onClick={() => this.setState(
                                                        { type: t.value },
                                                        () => this.dodirni('type')
                                                    )}
                                                >
                                                    <span className="z-prijava__tip-naziv">
                                                        {t.naziv.translate(l)}
                                                    </span>
                                                    {t.opis ? (
                                                        <span className="z-prijava__tip-opis">
                                                            {t.opis.translate(l)}
                                                        </span>
                                                    ) : null}
                                                </button>
                                            ))}
                                        </div>
                                        {pokazi('type') ? (
                                            <span className="z-prijava__greska-polja">{g.type}</span>
                                        ) : null}
                                    </div>

                                    {/* ── e-mail ─────────────────────────── */}
                                    <div className="z-prijava__polje">
                                        <label className="z-prijava__oznaka" htmlFor="reg-email">
                                            {'E-mail adresa'.translate(l)}
                                        </label>
                                        <input
                                            id="reg-email"
                                            type="email"
                                            className={'z-prijava__unos' + (pokazi('email') ? ' z-prijava__unos--greska' : '')}
                                            placeholder={'ime@domain.com'.translate(l)}
                                            value={this.state.email}
                                            aria-invalid={!!pokazi('email')}
                                            onChange={(e) => this.setState({ email: e.target.value }, () => {
                                                if (d.email) this.setState({ greskePolja: this.greske() });
                                            })}
                                            onBlur={() => this.dodirni('email')}
                                        />
                                        {pokazi('email') ? (
                                            <span className="z-prijava__greska-polja">{g.email}</span>
                                        ) : null}
                                    </div>

                                    {/* ── ime ────────────────────────────── */}
                                    <div className="z-prijava__polje">
                                        <label className="z-prijava__oznaka" htmlFor="reg-ime">
                                            {'Ime i prezime'.translate(l)}
                                        </label>
                                        <input
                                            id="reg-ime"
                                            type="text"
                                            className={'z-prijava__unos' + (pokazi('name') ? ' z-prijava__unos--greska' : '')}
                                            placeholder={'Unesite Vaše ime i prezime'.translate(l)}
                                            value={this.state.name}
                                            aria-invalid={!!pokazi('name')}
                                            onChange={(e) => this.setState({ name: e.target.value }, () => {
                                                if (d.name) this.setState({ greskePolja: this.greske() });
                                            })}
                                            onBlur={() => this.dodirni('name')}
                                        />
                                        {pokazi('name') ? (
                                            <span className="z-prijava__greska-polja">{g.name}</span>
                                        ) : null}
                                    </div>

                                    {/* ── lozinka sa uslovima uživo ──────── */}
                                    <div className="z-prijava__polje">
                                        <label className="z-prijava__oznaka" htmlFor="reg-lozinka">
                                            {'Lozinka'.translate(l)}
                                        </label>
                                        <div className="z-prijava__polje-lozinka">
                                            <input
                                                id="reg-lozinka"
                                                type={this.state.prikaziLozinku ? 'text' : 'password'}
                                                className={'z-prijava__unos' + (pokazi('password') ? ' z-prijava__unos--greska' : '')}
                                                placeholder={'Unesite lozinku'.translate(l)}
                                                value={this.state.password}
                                                aria-invalid={!!pokazi('password')}
                                                onChange={(e) => this.setState({ password: e.target.value }, () => {
                                                    if (d.password) this.setState({ greskePolja: this.greske() });
                                                })}
                                                onBlur={() => this.dodirni('password')}
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

                                        <div className="z-prijava__snaga">
                                            <div className="z-prijava__snaga-traka" aria-hidden="true">
                                                {USLOVI_LOZINKE.map((u, i) => (
                                                    <span
                                                        key={u.kljuc}
                                                        className={'z-prijava__snaga-deo' + (i < ispunjeni ? ' z-prijava__snaga-deo--ispunjen' : '')}
                                                    />
                                                ))}
                                            </div>
                                            <ul className="z-prijava__uslovi">
                                                {USLOVI_LOZINKE.map((u) => {
                                                    const ok = u.vazi(this.state.password);
                                                    return (
                                                        <li
                                                            key={u.kljuc}
                                                            className={'z-prijava__uslov' + (ok ? ' z-prijava__uslov--ispunjen' : '')}
                                                        >
                                                            {u.tekst.translate(l)}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>

                                        {pokazi('password') ? (
                                            <span className="z-prijava__greska-polja">{g.password}</span>
                                        ) : null}
                                    </div>

                                    {/* ── zemlja, neobavezno ─────────────── */}
                                    <div className="z-prijava__polje">
                                        <label className="z-prijava__oznaka" htmlFor="reg-zemlja">
                                            {'Zemlja'.translate(l)}
                                            <span className="z-prijava__neobavezno">
                                                {'— neobavezno'.translate(l)}
                                            </span>
                                        </label>
                                        <select
                                            id="reg-zemlja"
                                            className="z-prijava__izbor"
                                            value={this.state.country}
                                            onChange={(e) => this.setState({ country: e.target.value })}
                                        >
                                            <option value="">{'Izaberite zemlju'.translate(l)}</option>
                                            {ZEMLJE.map(([kod, naziv]) => (
                                                <option key={kod} value={kod}>{naziv}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* ── saglasnost ─────────────────────── */}
                                    <label className="z-prijava__saglasnost">
                                        <input
                                            type="checkbox"
                                            checked={this.state.termsAndConditions}
                                            aria-invalid={!!pokazi('termsAndConditions')}
                                            onChange={(e) => this.setState(
                                                { termsAndConditions: e.target.checked },
                                                () => this.dodirni('termsAndConditions')
                                            )}
                                        />
                                        <span>
                                            {'Slažem se sa'.translate(l)}{' '}
                                            <Link to="/page/uslovi-koriscenja">
                                                {'uslovima korištenja'.translate(l)}
                                            </Link>
                                        </span>
                                    </label>
                                    {pokazi('termsAndConditions') ? (
                                        <span className="z-prijava__greska-polja">
                                            {g.termsAndConditions}
                                        </span>
                                    ) : null}

                                    <button
                                        type="submit"
                                        className="z-prijava__dugme"
                                        disabled={this.state.salje}
                                    >
                                        {this.state.salje
                                            ? 'Slanje…'.translate(l)
                                            : 'Registruj se'.translate(l)}
                                    </button>
                                </form>
                            </>
                        )}

                        <p className="z-prijava__dno">
                            {'Već imate nalog?'.translate(l)}{' '}
                            <Link to="/login">{'Prijavite se'.translate(l)}</Link>
                        </p>
                    </div>
                </div>

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

export default Page(RegisterPage);
