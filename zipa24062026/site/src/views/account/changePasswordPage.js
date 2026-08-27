import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Page from '../../containers/page';

import { API_ENDPOINT } from '../../constants';

/*
 * NOVA LOZINKA SA VEZE IZ MEJLA — /reset-password/:uid/:kod
 *
 * Centrirana kolona, bez fotografije. Ruta, `uid`, kod iz veze i imena polja
 * (`newPassword`, `retypedPassword`) su nepromenjeni.
 *
 * ISTEKLA VEZA: kod se u bazi briše čim se jednom iskoristi, pa druga posjeta
 * istoj vezi vraća `Wrong verification code`. To je engleska poruka iz API-ja
 * i ne kaže korisniku šta da radi — ovde se prevodi u objašnjenje i vezu ka
 * `/reset-password` da zatraži novu. Server nije diran.
 */

const USLOVI = [
    { kljuc: 'duzina', natpis: 'Od 6 do 16 znakova', proba: (v) => v.length >= 6 && v.length <= 16 },
    { kljuc: 'veliko', natpis: 'Bar jedno veliko slovo', proba: (v) => /[A-ZŠĐČĆŽ]/.test(v) },
    { kljuc: 'broj',   natpis: 'Bar jedan broj',        proba: (v) => /[0-9]/.test(v) },
    { kljuc: 'znak',   natpis: 'Bar jedan poseban znak (!, ?, #…)', proba: (v) => /[^A-Za-z0-9ŠĐČĆŽšđčćž]/.test(v) },
];

class ChangePasswordPage extends Component {
    constructor(props) {
        super(props);
        this.submit = this.submit.bind(this);

        this.state = {
            newPassword: '',
            retypedPassword: '',
            prikazi: false,
            greskePolja: {},
            error: null,
            istekla: false,
            salje: false,
        };
    }

    componentDidMount() {
        if (typeof window !== 'undefined') { window.scrollTo(0, 0); }
        this.props.updateMeta(this.props.generateSeoTags(null));
    }

    proveri() {
        const l = this.props.lang;
        const g = {};

        if (!this.state.newPassword) {
            g.newPassword = 'Unesite novu lozinku.'.translate(l);
        } else if (!USLOVI.every((u) => u.proba(this.state.newPassword))) {
            g.newPassword = 'Lozinka ne ispunjava sve uslove ispod.'.translate(l);
        }
        if (this.state.newPassword !== this.state.retypedPassword) {
            g.retypedPassword = 'Lozinke se ne podudaraju.'.translate(l);
        }

        this.setState({ greskePolja: g });
        return Object.keys(g).length === 0;
    }

    submit(e) {
        if (e) e.preventDefault();
        if (this.state.salje) return;
        if (!this.proveri()) return;

        const l = this.props.lang;
        this.setState({ salje: true, error: null });

        fetch(`${API_ENDPOINT}/user/reset-password/${this.props[0].match.params.uid}/${this.props[0].match.params.resetPasswordVerificationCode}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                newPassword: this.state.newPassword,
                retypedPassword: this.state.retypedPassword,
            })
        }).then(res => res.json()).then((result) => {
            if (result.error) {
                // Neupotrebljiva veza — kod je pogrešan, već iskorišćen ili
                // je nalog u međuvremenu obrisan.
                const potrosena = result.error === 'Wrong verification code'
                    || result.error === 'User not exists';

                this.setState({
                    istekla: potrosena,
                    error: potrosena ? null : result.error,
                    salje: false,
                });
            } else {
                localStorage.setItem('authToken', result.token);
                localStorage.removeItem('cart');
                this.props.verifyUser();
                this.props[0].history.push('/')
            }
        }).catch(() => {
            this.setState({
                error: 'Nema veze sa serverom. Provjerite internet i pokušajte ponovo.'.translate(l),
                salje: false
            });
        })
    }

    polje = (ime, natpis) => {
        const l = this.props.lang;
        const greska = this.state.greskePolja[ime];
        const id = `nova-${ime}`;

        return (
            <div className="z-prijava__polje">
                <label className="z-prijava__oznaka" htmlFor={id}>{natpis.translate(l)}</label>
                <div className="z-prijava__polje-lozinka">
                    <input
                        id={id}
                        type={this.state.prikazi ? 'text' : 'password'}
                        className={'z-prijava__unos' + (greska ? ' z-prijava__unos--greska' : '')}
                        value={this.state[ime]}
                        autoComplete="new-password"
                        aria-invalid={!!greska}
                        aria-describedby={greska ? `greska-${ime}` : null}
                        onChange={(e) => this.setState({ [ime]: e.target.value })}
                    />
                    <button
                        type="button"
                        className="z-prijava__prikazi"
                        aria-pressed={this.state.prikazi}
                        onClick={() => this.setState({ prikazi: !this.state.prikazi })}
                    >
                        {this.state.prikazi ? 'Sakrij'.translate(l) : 'Prikaži'.translate(l)}
                    </button>
                </div>
                {greska ? (
                    <span className="z-prijava__greska-polja" id={`greska-${ime}`}>{greska}</span>
                ) : null}
            </div>
        );
    };

    render() {
        const l = this.props.lang;
        const nova = this.state.newPassword;

        return (
            <div className="login-wrap z-prijava z-prijava--sama">
                <div className="z-prijava__strana">
                    <div className="z-prijava__okvir">

                        {this.state.istekla ? (
                            /* ── veza više ne važi ──────────────────────── */
                            <>
                                <h1 className="z-prijava__naslov">
                                    {'Veza više ne važi'.translate(l)}
                                </h1>
                                <p className="z-prijava__uvod">
                                    {'Veza za promjenu lozinke važi jednom. Ova je već iskorišćena ili je zamijenjena novijom. Zatražite novu i pokušajte ponovo.'.translate(l)}
                                </p>
                                <Link className="z-prijava__dugme" to="/reset-password">
                                    {'Zatraži novu vezu'.translate(l)}
                                </Link>
                            </>
                        ) : (
                            <>
                                <h1 className="z-prijava__naslov">
                                    {'Postavite novu lozinku'.translate(l)}
                                </h1>
                                <p className="z-prijava__uvod">
                                    {'Izaberite lozinku koju ranije niste koristili.'.translate(l)}
                                </p>

                                {this.state.error ? (
                                    <p className="z-prijava__greska">{this.state.error}</p>
                                ) : null}

                                <form onSubmit={this.submit} noValidate>
                                    {this.polje('newPassword', 'Nova lozinka')}

                                    <ul className="z-prijava__uslovi">
                                        {USLOVI.map((u) => {
                                            const ispunjen = nova ? u.proba(nova) : false;
                                            return (
                                                <li
                                                    className={'z-prijava__uslov' + (ispunjen ? ' z-prijava__uslov--ispunjen' : '')}
                                                    key={u.kljuc}
                                                >
                                                    {u.natpis.translate(l)}
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {this.polje('retypedPassword', 'Ponovite lozinku')}

                                    <button
                                        type="submit"
                                        className="z-prijava__dugme"
                                        disabled={this.state.salje}
                                    >
                                        {this.state.salje
                                            ? 'Čuvanje…'.translate(l)
                                            : 'Sačuvaj lozinku'.translate(l)}
                                    </button>
                                </form>
                            </>
                        )}

                        <p className="z-prijava__dno">
                            {'Sjetili ste se lozinke?'.translate(l)}{' '}
                            <Link to="/login">{'Prijavite se'.translate(l)}</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}

export default Page(ChangePasswordPage);
