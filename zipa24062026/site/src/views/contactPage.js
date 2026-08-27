import React, { Component } from 'react';
import Page from '../containers/page';

import { Container } from 'reactstrap';
import ZEMLJE from '../components/forms/zemlje';
import { API_ENDPOINT } from '../constants';

/*
 * KONTAKT — /contact
 *
 * Dve kolone: obrazac levo, podaci agencije desno.
 *
 * Redux-form je zamenjen kontrolisanim poljima, kao na prijavi i stranama
 * naloga, ali SVIH DESET IMENA POLJA i poziv `POST /contact` su nepromenjeni
 * — mejl koji server sastavlja izgleda isto.
 *
 * Obavezna polja su ista koja su i ranije imala `validate={[required]}`:
 * ime, prezime, e-mail, poslovni telefon, kompanija i poruka.
 */

const POSAO = [
    'Fotograf', 'Štampani mediji,', 'Digitalni mediji', 'Novinska', 'Agencija,',
    'Foto agencija', 'WEB portali,', 'Radio stanica', 'Državna institucija,',
    'Kompanija,', 'Poslovni subjekat', 'Privatno lice',
];

const POZICIJA = [
    'Fotograf', 'Novinar', 'Urednik', 'Direktor', 'Menadzer',
    'Odgovorno lice', 'Privatno lice',
];

const INDUSTRIJA = [
    'Stampa/izdavac', 'Digitalni mediji', 'Televizija/radio', 'Agencije/PR', 'Ostalo',
];

const PRAZNO = {
    firstName: '', lastName: '', email: '', bussinessPhone: '', country: '',
    jobeRole: '', jobLevel: '', industry: '', company: '', message: '',
};

class ContactPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            ...props.initialData,
            podaci: { ...PRAZNO },
            greskePolja: {},
            salje: false,
            done: false,
            greska: null,
        };
    }

    init() {
        window.scrollTo(0, 0);

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname).then((data) => {
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

    postavi = (ime, vrednost) => {
        this.setState({ podaci: { ...this.state.podaci, [ime]: vrednost } });
    };

    proveri() {
        const l = this.props.lang;
        const p = this.state.podaci;
        const g = {};

        if (!p.firstName.trim()) g.firstName = 'Unesite ime.'.translate(l);
        if (!p.lastName.trim()) g.lastName = 'Unesite prezime.'.translate(l);

        if (!p.email.trim()) {
            g.email = 'Unesite e-mail adresu.'.translate(l);
        } else if (p.email.indexOf('@') === -1 || p.email.indexOf('.') === -1) {
            g.email = 'Adresa nije ispravna — provjerite da li ste je tačno unijeli.'.translate(l);
        }

        if (!p.bussinessPhone.trim()) g.bussinessPhone = 'Unesite broj telefona.'.translate(l);
        if (!p.company.trim()) g.company = 'Unesite naziv kompanije ili medija.'.translate(l);
        if (!p.message.trim()) g.message = 'Napišite poruku.'.translate(l);

        this.setState({ greskePolja: g });
        return Object.keys(g).length === 0;
    }

    submit = (e) => {
        if (e) e.preventDefault();
        if (this.state.salje) return;
        if (!this.proveri()) return;

        this.setState({ salje: true, greska: null });

        fetch(`${API_ENDPOINT}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(this.state.podaci)
        }).then(res => res.json()).then(() => {
            this.setState({ done: true, salje: false, podaci: { ...PRAZNO } });
            window.scrollTo(0, 0);
        }).catch(() => {
            // Ranije se „poslato" pisalo i kad slanje padne.
            this.setState({
                salje: false,
                greska: 'Poruka nije poslata. Provjerite internet i pokušajte ponovo, ili nam pišite na info@zipaphoto.net.'.translate(this.props.lang),
            });
        })
    };

    unos = (ime, natpis, dodatno = {}) => {
        const l = this.props.lang;
        const greska = this.state.greskePolja[ime];
        const id = `kontakt-${ime}`;

        return (
            <div className="z-prijava__polje">
                <label className="z-prijava__oznaka" htmlFor={id}>
                    {natpis.translate(l)}
                    {dodatno.neobavezno ? (
                        <span className="z-prijava__neobavezno">{'— neobavezno'.translate(l)}</span>
                    ) : null}
                </label>
                <input
                    id={id}
                    type={dodatno.tip || 'text'}
                    className={'z-prijava__unos' + (greska ? ' z-prijava__unos--greska' : '')}
                    placeholder={dodatno.primer || ''}
                    value={this.state.podaci[ime]}
                    aria-invalid={!!greska}
                    aria-describedby={greska ? `greska-${ime}` : null}
                    onChange={(e) => this.postavi(ime, e.target.value)}
                />
                {greska ? (
                    <span className="z-prijava__greska-polja" id={`greska-${ime}`}>{greska}</span>
                ) : null}
            </div>
        );
    };

    izbor = (ime, natpis, vrednosti) => {
        const l = this.props.lang;
        const id = `kontakt-${ime}`;

        return (
            <div className="z-prijava__polje">
                <label className="z-prijava__oznaka" htmlFor={id}>
                    {natpis.translate(l)}
                    <span className="z-prijava__neobavezno">{'— neobavezno'.translate(l)}</span>
                </label>
                <select
                    id={id}
                    className="z-prijava__unos"
                    value={this.state.podaci[ime]}
                    onChange={(e) => this.postavi(ime, e.target.value)}
                >
                    <option value="">{'Izaberite'.translate(l)}</option>
                    {vrednosti.map((v) => (
                        Array.isArray(v)
                            ? <option value={v[0]} key={v[0]}>{v[1]}</option>
                            : <option value={v} key={v}>{v}</option>
                    ))}
                </select>
            </div>
        );
    };

    render() {
        const l = this.props.lang;
        const s = this.props.settings || {};
        const adresa = s.location ? String(s.location).replace(/\n/g, ', ') : null;

        return (
            <div className="contact-wrap z-kontakt">

                <header className="z-kontakt__vrh">
                    <Container>
                        <h1 className="z-kontakt__naslov">{'Kontakt'.translate(l)}</h1>
                        <p className="z-kontakt__uvod">
                            {'Pišite nam za ponudu, licencu ili pomoć oko arhive. Odgovaramo u toku radnog dana.'.translate(l)}
                        </p>
                    </Container>
                </header>

                <Container>
                    <div className="z-kontakt__raspored">

                        {/* ── obrazac ────────────────────────────────── */}
                        <div className="z-kontakt__obrazac">
                            {this.state.done ? (
                                <div className="z-kontakt__uspjeh" role="status">
                                    <h2 className="z-kontakt__uspjeh-naslov">
                                        {'Poruka je poslata'.translate(l)}
                                    </h2>
                                    <p className="z-kontakt__uspjeh-opis">
                                        {'Javljamo se na adresu koju ste ostavili, obično isti radni dan.'.translate(l)}
                                    </p>
                                    <button
                                        type="button"
                                        className="z-kontakt__radnja"
                                        onClick={() => this.setState({ done: false })}
                                    >
                                        {'Pošaljite još jednu'.translate(l)}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h2 className="z-kontakt__odeljak-naslov">
                                        {'Pošaljite poruku'.translate(l)}
                                    </h2>

                                    {this.state.greska ? (
                                        <p className="z-prijava__greska">{this.state.greska}</p>
                                    ) : null}

                                    <form onSubmit={this.submit} noValidate>
                                        <div className="z-kontakt__par">
                                            {this.unos('firstName', 'Ime')}
                                            {this.unos('lastName', 'Prezime')}
                                        </div>

                                        <div className="z-kontakt__par">
                                            {this.unos('email', 'E-mail adresa', { tip: 'email', primer: 'ime@domain.com' })}
                                            {this.unos('bussinessPhone', 'Poslovni telefon', { tip: 'tel' })}
                                        </div>

                                        <div className="z-kontakt__par">
                                            {this.unos('company', 'Kompanija ili medij')}
                                            {this.izbor('country', 'Zemlja', ZEMLJE)}
                                        </div>

                                        <div className="z-kontakt__par">
                                            {this.izbor('jobeRole', 'Posao', POSAO)}
                                            {this.izbor('jobLevel', 'Pozicija', POZICIJA)}
                                        </div>

                                        {this.izbor('industry', 'Industrija', INDUSTRIJA)}

                                        <div className="z-prijava__polje">
                                            <label className="z-prijava__oznaka" htmlFor="kontakt-message">
                                                {'Poruka'.translate(l)}
                                            </label>
                                            <textarea
                                                id="kontakt-message"
                                                rows="6"
                                                className={'z-prijava__unos z-kontakt__tekst' + (this.state.greskePolja.message ? ' z-prijava__unos--greska' : '')}
                                                placeholder={'O čemu se radi?'.translate(l)}
                                                value={this.state.podaci.message}
                                                aria-invalid={!!this.state.greskePolja.message}
                                                aria-describedby={this.state.greskePolja.message ? 'greska-message' : null}
                                                onChange={(e) => this.postavi('message', e.target.value)}
                                            />
                                            {this.state.greskePolja.message ? (
                                                <span className="z-prijava__greska-polja" id="greska-message">
                                                    {this.state.greskePolja.message}
                                                </span>
                                            ) : null}
                                        </div>

                                        <button
                                            type="submit"
                                            className="z-prijava__dugme"
                                            disabled={this.state.salje}
                                        >
                                            {this.state.salje
                                                ? 'Slanje…'.translate(l)
                                                : 'Pošaljite poruku'.translate(l)}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>

                        {/* ── podaci agencije ────────────────────────── */}
                        <aside className="z-kontakt__podaci">
                            <h2 className="z-kontakt__odeljak-naslov">
                                {'Podaci'.translate(l)}
                            </h2>

                            {s.location ? (
                                <div className="z-kontakt__stavka">
                                    <span className="z-kontakt__stavka-naziv">{'Adresa'.translate(l)}</span>
                                    <p
                                        className="z-kontakt__stavka-vrednost"
                                        dangerouslySetInnerHTML={{ __html: s.location.replace(/\n/g, '<br/>') }}
                                    />
                                </div>
                            ) : null}

                            {s.phoneNumber ? (
                                <div className="z-kontakt__stavka">
                                    <span className="z-kontakt__stavka-naziv">{'Telefon'.translate(l)}</span>
                                    <p className="z-kontakt__stavka-vrednost">
                                        <a className="z-kontakt__veza" href={`tel:${String(s.phoneNumber).replace(/\s/g, '')}`}>
                                            {s.phoneNumber}
                                        </a>
                                    </p>
                                </div>
                            ) : null}

                            <div className="z-kontakt__stavka">
                                <span className="z-kontakt__stavka-naziv">{'E-mail'.translate(l)}</span>
                                <p className="z-kontakt__stavka-vrednost">
                                    <a className="z-kontakt__veza" href="mailto:info@zipaphoto.net">info@zipaphoto.net</a>
                                    <br />
                                    <a className="z-kontakt__veza" href="mailto:zipaphoto@gmail.com">zipaphoto@gmail.com</a>
                                </p>
                            </div>

                            {/* Radno vreme se iscrtava samo ako je uneto u
                                Podešavanjima sajta — polje danas ne postoji,
                                pa se radno vreme ne izmišlja. */}
                            {s.workingHours ? (
                                <div className="z-kontakt__stavka">
                                    <span className="z-kontakt__stavka-naziv">{'Radno vrijeme'.translate(l)}</span>
                                    <p
                                        className="z-kontakt__stavka-vrednost"
                                        dangerouslySetInnerHTML={{ __html: String(s.workingHours).replace(/\n/g, '<br/>') }}
                                    />
                                </div>
                            ) : null}

                            {adresa ? (
                                <div className="z-kontakt__mapa">
                                    <iframe
                                        title={'Mapa'.translate(l)}
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(adresa)}&z=15&output=embed`}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                            ) : null}
                        </aside>
                    </div>
                </Container>
            </div>
        );
    }
}

export default Page(ContactPage);
