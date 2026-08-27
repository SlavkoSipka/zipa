import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';

import emailSent from '../../assets/svg/email-sent.svg';
import { API_ENDPOINT } from '../../constants';

/*
 * ZABORAVLJENA LOZINKA — traženje veze
 *
 * Jedna centrirana kolona, bez fotografije: strana ima tačno jedan zadatak.
 * Poziv ka `/user/reset-password` i ime polja `email` su nepromenjeni.
 *
 * Posle slanja se ne vraća obrazac nego potvrda — sa dugmetom „pošalji
 * ponovo" koje se otključava tek posle 60 sekundi, da uzastopni klikovi ne
 * zatrpaju sanduče istim mejlom.
 */

const CEKANJE = 60;   // sekundi do ponovnog slanja

class ResetPasswordPage extends Component {
    constructor(props) {
        super(props);
        this.submit = this.submit.bind(this);

        this.state = {
            email: '',
            greska: null,
            error: null,
            salje: false,
            poslato: false,
            preostalo: 0,
        };
    }

    componentDidMount() {
        if (typeof window !== 'undefined') { window.scrollTo(0, 0); }
        this.props.updateMeta(this.props.generateSeoTags(null));
    }

    componentWillUnmount() {
        if (this.otkucaj) clearInterval(this.otkucaj);
    }

    pokreniOdbrojavanje() {
        if (this.otkucaj) clearInterval(this.otkucaj);
        this.setState({ preostalo: CEKANJE });

        this.otkucaj = setInterval(() => {
            if (this.state.preostalo <= 1) {
                clearInterval(this.otkucaj);
                this.setState({ preostalo: 0 });
            } else {
                this.setState({ preostalo: this.state.preostalo - 1 });
            }
        }, 1000);
    }

    submit(e) {
        if (e) e.preventDefault();
        if (this.state.salje || this.state.preostalo > 0) return;

        const l = this.props.lang;
        const email = this.state.email.trim();

        if (!email) {
            this.setState({ greska: 'Unesite e-mail adresu.'.translate(l) });
            return;
        }
        if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
            this.setState({ greska: 'Adresa nije ispravna — provjerite da li ste je tačno unijeli.'.translate(l) });
            return;
        }

        this.setState({ salje: true, greska: null, error: null });

        fetch(`${API_ENDPOINT}/user/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        }).then(res => res.json()).then((result) => {
            if (result.error) {
                this.setState({
                    // Server javlja `User not exists` — na engleskom i previše
                    // otvoreno. Ne odajemo da li adresa postoji.
                    error: 'Ako nalog sa ovom adresom postoji, veza je poslata. Provjerite i neželjenu poštu.'.translate(this.props.lang),
                    salje: false,
                    poslato: true,
                });
                this.pokreniOdbrojavanje();
            } else {
                this.setState({ poslato: true, salje: false });
                this.pokreniOdbrojavanje();
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

        return (
            <div className="login-wrap z-prijava z-prijava--sama">
                <div className="z-prijava__strana">
                    <div className="z-prijava__okvir">

                        {!this.state.poslato ? (
                            <>
                                <h1 className="z-prijava__naslov">
                                    {'Zaboravljena lozinka'.translate(l)}
                                </h1>
                                <p className="z-prijava__uvod">
                                    {'Unesite adresu kojom se prijavljujete i poslaćemo vam vezu za postavljanje nove lozinke.'.translate(l)}
                                </p>

                                {this.state.error ? (
                                    <p className="z-prijava__greska">{this.state.error}</p>
                                ) : null}

                                <form onSubmit={this.submit} noValidate>
                                    <div className="z-prijava__polje">
                                        <label className="z-prijava__oznaka" htmlFor="reset-email">
                                            {'E-mail adresa'.translate(l)}
                                        </label>
                                        <input
                                            id="reset-email"
                                            type="email"
                                            className={'z-prijava__unos' + (this.state.greska ? ' z-prijava__unos--greska' : '')}
                                            placeholder={'ime@domain.com'.translate(l)}
                                            value={this.state.email}
                                            aria-invalid={!!this.state.greska}
                                            aria-describedby={this.state.greska ? 'greska-reset' : null}
                                            onChange={(e) => this.setState({ email: e.target.value })}
                                        />
                                        {this.state.greska ? (
                                            <span className="z-prijava__greska-polja" id="greska-reset">
                                                {this.state.greska}
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
                                            : 'Pošalji vezu'.translate(l)}
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* ── potvrda ────────────────────────────────── */
                            <div className="z-prijava__poslato">
                                <Isvg src={emailSent} />
                                <h1 className="z-prijava__poslato-naslov">
                                    {'Provjerite sanduče'.translate(l)}
                                </h1>
                                <p className="z-prijava__poslato-opis">
                                    {'Ako nalog sa adresom'.translate(l)}{' '}
                                    <strong>{this.state.email}</strong>{' '}
                                    {'postoji, veza za novu lozinku je poslata. Pogledajte i neželjenu poštu.'.translate(l)}
                                </p>

                                <button
                                    type="button"
                                    className="z-prijava__dugme"
                                    disabled={this.state.preostalo > 0 || this.state.salje}
                                    onClick={this.submit}
                                >
                                    {this.state.preostalo > 0
                                        ? `${'Pošalji ponovo za'.translate(l)} ${this.state.preostalo} s`
                                        : 'Pošalji ponovo'.translate(l)}
                                </button>
                            </div>
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

export default Page(ResetPasswordPage);
