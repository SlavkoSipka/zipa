import React, { Component } from 'react';
import Page from '../../containers/page';

import NalogOkvir from '../../components/nalogOkvir';
import SlikaProfila from '../../components/forms/fields/profilePhoto';
import ZEMLJE from '../../components/forms/zemlje';
import { API_ENDPOINT } from '../../constants';

/*
 * IZMJENA PODATAKA
 *
 * Obrazac je podeljen na tri odeljka umesto jednog niza od četrnaest polja.
 * Redux-form je zamenjen običnim kontrolisanim poljima — kao na prijavi i
 * registraciji — ali IMENA POLJA I POZIV KA `/user/edit` SU NEPROMENJENI,
 * pa server ne vidi nikakvu razliku.
 *
 * Postavljanje slike i dalje radi ista komponenta (`fields/profilePhoto`),
 * netaknuta.
 */

// Polja koja se šalju — redosled ovde je i redosled u obrascu.
const POLJA = [
    'name', 'email', 'phoneNumber', 'businessPhoneNumber', 'webSite',
    'skype', 'twitter', 'facebook', 'instagram',
    'country', 'city', 'address', 'biography', 'profilePhoto',
];

class EditAccountPage extends Component {
    constructor(props) {
        super(props);
        this.submit = this.submit.bind(this);

        const u = props.uData || {};
        const podaci = {};
        POLJA.forEach((p) => { podaci[p] = u[p] || ''; });

        this.state = {
            ...props.initialData,
            podaci,
            greskePolja: {},
            salje: false,
            sacuvano: false,
        };
    }

    componentDidMount() {
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

    componentDidUpdate(prevProps) {
        // `uData` stiže posle prvog iscrtavanja — popuni polja kad stigne,
        // ali samo ako korisnik još ništa nije kucao.
        if (!prevProps.uData && this.props.uData && !this.state.dirnuto) {
            const u = this.props.uData;
            const podaci = {};
            POLJA.forEach((p) => { podaci[p] = u[p] || ''; });
            this.setState({ podaci });
        }
    }

    postavi = (ime, vrednost) => {
        this.setState({
            podaci: { ...this.state.podaci, [ime]: vrednost },
            dirnuto: true,
            sacuvano: false,
        });
    };

    /*
     * Provera pre slanja služi samo da greška može da stoji ispod polja na
     * koje se odnosi. Server proverava sve isto.
     */
    proveri() {
        const l = this.props.lang;
        const g = {};
        const p = this.state.podaci;

        if (!String(p.name || '').trim()) {
            g.name = 'Unesite ime i prezime.'.translate(l);
        }
        if (!String(p.email || '').trim()) {
            g.email = 'Unesite e-mail adresu.'.translate(l);
        } else if (p.email.indexOf('@') === -1 || p.email.indexOf('.') === -1) {
            g.email = 'Adresa nije ispravna — provjerite da li ste je tačno unijeli.'.translate(l);
        }

        this.setState({ greskePolja: g });
        return Object.keys(g).length === 0;
    }

    submit(e) {
        if (e) e.preventDefault();
        if (this.state.salje) return;
        if (!this.proveri()) return;

        this.setState({ salje: true, error: null });

        fetch(`${API_ENDPOINT}/user/edit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(this.state.podaci)
        }).then(res => res.json()).then((result) => {
            if (result.error) {
                this.setState({ error: result.error, salje: false })
            } else {
                this.props.verifyUser();
                this.setState({ salje: false, sacuvano: true, dirnuto: false });
            }
        }).catch(() => {
            this.setState({
                error: 'Nema veze sa serverom. Provjerite internet i pokušajte ponovo.'.translate(this.props.lang),
                salje: false
            });
        })
    }

    // Jedno tekstualno polje — da se ista tri reda ne prepisuju dvanaest puta.
    unos = (ime, natpis, dodatno = {}) => {
        const l = this.props.lang;
        const greska = this.state.greskePolja[ime];
        const id = `nalog-${ime}`;

        return (
            <div className="z-prijava__polje" key={ime}>
                <label className="z-prijava__oznaka" htmlFor={id}>
                    {natpis.translate(l)}
                    {dodatno.neobavezno ? (
                        <span className="z-prijava__neobavezno">
                            {'— neobavezno'.translate(l)}
                        </span>
                    ) : null}
                </label>
                <input
                    id={id}
                    type={dodatno.tip || 'text'}
                    className={'z-prijava__unos' + (greska ? ' z-prijava__unos--greska' : '')}
                    placeholder={dodatno.primer || ''}
                    value={this.state.podaci[ime] || ''}
                    aria-invalid={!!greska}
                    aria-describedby={greska ? `greska-${ime}` : null}
                    onChange={(e) => this.postavi(ime, e.target.value)}
                />
                {greska ? (
                    <span className="z-prijava__greska-polja" id={`greska-${ime}`}>
                        {greska}
                    </span>
                ) : null}
            </div>
        );
    };

    render() {
        const l = this.props.lang;
        const fotograf = this.props.uData && this.props.uData.userRole === 'photographer';

        return (
            <NalogOkvir
                lang={l}
                uData={this.props.uData}
                putanja={this.props[0].location.pathname}
                signOut={this.props.signOut}
                naslov={'Izmjena podataka'.translate(l)}
            >
                {this.state.error ? (
                    <p className="z-prijava__greska">{this.state.error}</p>
                ) : null}

                {this.state.sacuvano ? (
                    <p className="z-nalog__uspjeh">
                        {'Podaci su sačuvani.'.translate(l)}
                    </p>
                ) : null}

                <form className="z-nalog__obrazac" onSubmit={this.submit} noValidate>

                    {/* ── ko ste ─────────────────────────────────────────── */}
                    <section className="z-nalog__odeljak">
                        <h2 className="z-nalog__odeljak-naslov">{'Ko ste'.translate(l)}</h2>

                        <div className="z-nalog__slika-red">
                            <SlikaProfila
                                value={this.state.podaci.profilePhoto}
                                onChange={(v) => this.postavi('profilePhoto', v)}
                                lang={l}
                                /* `/upload` je od 2026-08-28 zaključan na
                                   administratora; slika profila ide svojom
                                   rutom, sa istom provjerom sadržaja. */
                                ruta="/upload/avatar"
                            />
                            <p className="z-nalog__napomena">
                                {'Slika profila se vidi uz vaše galerije. Kliknite na kvadrat da je zamijenite.'.translate(l)}
                            </p>
                        </div>

                        <div className="z-nalog__par">
                            {this.unos('name', 'Ime i prezime')}
                            {this.unos('email', 'E-mail adresa', { tip: 'email', primer: 'ime@domain.com' })}
                        </div>

                        {fotograf ? (
                            <div className="z-prijava__polje">
                                <label className="z-prijava__oznaka" htmlFor="nalog-biography">
                                    {'Biografija'.translate(l)}
                                    <span className="z-prijava__neobavezno">
                                        {'— neobavezno'.translate(l)}
                                    </span>
                                </label>
                                <textarea
                                    id="nalog-biography"
                                    className="z-prijava__unos z-nalog__tekst"
                                    rows="5"
                                    value={this.state.podaci.biography || ''}
                                    onChange={(e) => this.postavi('biography', e.target.value)}
                                />
                            </div>
                        ) : null}
                    </section>

                    {/* ── kontakt ────────────────────────────────────────── */}
                    <section className="z-nalog__odeljak">
                        <h2 className="z-nalog__odeljak-naslov">{'Kontakt'.translate(l)}</h2>

                        <div className="z-nalog__par">
                            {this.unos('phoneNumber', 'Mobilni telefon', { tip: 'tel', neobavezno: true })}
                            {this.unos('businessPhoneNumber', 'Poslovni telefon', { tip: 'tel', neobavezno: true })}
                        </div>

                        <div className="z-nalog__par">
                            {this.unos('city', 'Grad', { neobavezno: true })}

                            <div className="z-prijava__polje">
                                <label className="z-prijava__oznaka" htmlFor="nalog-country">
                                    {'Zemlja'.translate(l)}
                                    <span className="z-prijava__neobavezno">
                                        {'— neobavezno'.translate(l)}
                                    </span>
                                </label>
                                <select
                                    id="nalog-country"
                                    className="z-prijava__unos"
                                    value={this.state.podaci.country || ''}
                                    onChange={(e) => this.postavi('country', e.target.value)}
                                >
                                    <option value="">{'Izaberite zemlju'.translate(l)}</option>
                                    {ZEMLJE.map(([kod, naziv]) => (
                                        <option value={kod} key={kod}>{naziv}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {this.unos('address', 'Adresa', { neobavezno: true })}
                    </section>

                    {/* ── na mreži ───────────────────────────────────────── */}
                    <section className="z-nalog__odeljak">
                        <h2 className="z-nalog__odeljak-naslov">{'Na mreži'.translate(l)}</h2>

                        <div className="z-nalog__par">
                            {this.unos('webSite', 'Web sajt', { primer: 'https://', neobavezno: true })}
                            {this.unos('facebook', 'Facebook', { neobavezno: true })}
                        </div>
                        <div className="z-nalog__par">
                            {this.unos('instagram', 'Instagram', { neobavezno: true })}
                            {this.unos('twitter', 'Twitter', { neobavezno: true })}
                        </div>
                        {this.unos('skype', 'Skype', { neobavezno: true })}
                    </section>

                    <div className="z-nalog__dno-obrasca">
                        <button
                            type="submit"
                            className="z-prijava__dugme"
                            disabled={this.state.salje}
                        >
                            {this.state.salje
                                ? 'Čuvanje…'.translate(l)
                                : 'Sačuvaj podatke'.translate(l)}
                        </button>
                    </div>
                </form>
            </NalogOkvir>
        );
    }
}

export default Page(EditAccountPage);
