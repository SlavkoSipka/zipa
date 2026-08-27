import React, { Component } from 'react';
import Page from '../../containers/page';

import NalogOkvir from '../../components/nalogOkvir';
import { API_ENDPOINT } from '../../constants';

/*
 * PROMJENA LOZINKE (prijavljen korisnik)
 *
 * Ista ruta i ista tri imena polja kao pre — `oldPassword`, `newPassword`,
 * `newPasswordRetyped` ka `/user/edit`. Promenjeno je samo šta korisnik
 * vidi: uslovi za lozinku se prikazuju UNAPRED i pale se dok kuca, umesto
 * da server posle vrati jednu rečenicu sa svim pravilima odjednom.
 *
 * Pravila su prepisana sa servera (`api/users/users.js`, `checkPassword`):
 * 6–16 znakova, veliko slovo, broj i poseban znak.
 */

const USLOVI = [
    { kljuc: 'duzina', natpis: 'Od 6 do 16 znakova', proba: (v) => v.length >= 6 && v.length <= 16 },
    { kljuc: 'veliko', natpis: 'Bar jedno veliko slovo', proba: (v) => /[A-ZŠĐČĆŽ]/.test(v) },
    { kljuc: 'broj',   natpis: 'Bar jedan broj',        proba: (v) => /[0-9]/.test(v) },
    { kljuc: 'znak',   natpis: 'Bar jedan poseban znak (!, ?, #…)', proba: (v) => /[^A-Za-z0-9ŠĐČĆŽšđčćž]/.test(v) },
];

class ChangePassword extends Component {
    constructor(props) {
        super(props);
        this.submit = this.submit.bind(this);

        this.state = {
            ...props.initialData,
            oldPassword: '',
            newPassword: '',
            newPasswordRetyped: '',
            prikazi: false,
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

    proveri() {
        const l = this.props.lang;
        const g = {};

        if (!this.state.oldPassword) {
            g.oldPassword = 'Unesite trenutnu lozinku.'.translate(l);
        }
        if (!this.state.newPassword) {
            g.newPassword = 'Unesite novu lozinku.'.translate(l);
        } else if (!USLOVI.every((u) => u.proba(this.state.newPassword))) {
            g.newPassword = 'Nova lozinka ne ispunjava sve uslove ispod.'.translate(l);
        }
        if (this.state.newPassword !== this.state.newPasswordRetyped) {
            g.newPasswordRetyped = 'Lozinke se ne podudaraju.'.translate(l);
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
            body: JSON.stringify({
                oldPassword: this.state.oldPassword,
                newPassword: this.state.newPassword,
                newPasswordRetyped: this.state.newPasswordRetyped,
            })
        }).then(res => res.json()).then((result) => {
            if (result.error) {
                this.setState({ error: result.error, salje: false })
            } else {
                this.props.verifyUser();
                this.setState({
                    salje: false,
                    sacuvano: true,
                    oldPassword: '',
                    newPassword: '',
                    newPasswordRetyped: '',
                });
            }
        }).catch(() => {
            this.setState({
                error: 'Nema veze sa serverom. Provjerite internet i pokušajte ponovo.'.translate(this.props.lang),
                salje: false
            });
        })
    }

    polje = (ime, natpis) => {
        const l = this.props.lang;
        const greska = this.state.greskePolja[ime];
        const id = `lozinka-${ime}`;

        return (
            <div className="z-prijava__polje">
                <label className="z-prijava__oznaka" htmlFor={id}>{natpis.translate(l)}</label>
                <div className="z-prijava__polje-lozinka">
                    <input
                        id={id}
                        type={this.state.prikazi ? 'text' : 'password'}
                        className={'z-prijava__unos' + (greska ? ' z-prijava__unos--greska' : '')}
                        value={this.state[ime]}
                        autoComplete={ime === 'oldPassword' ? 'current-password' : 'new-password'}
                        aria-invalid={!!greska}
                        aria-describedby={greska ? `greska-${ime}` : null}
                        onChange={(e) => this.setState({ [ime]: e.target.value, sacuvano: false })}
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
            <NalogOkvir
                lang={l}
                uData={this.props.uData}
                putanja={this.props[0].location.pathname}
                signOut={this.props.signOut}
                naslov={'Promjena lozinke'.translate(l)}
            >
                {this.state.error ? (
                    <p className="z-prijava__greska">{this.state.error}</p>
                ) : null}

                {this.state.sacuvano ? (
                    <p className="z-nalog__uspjeh">
                        {'Lozinka je promijenjena. Sljedeći put se prijavite novom.'.translate(l)}
                    </p>
                ) : null}

                <form className="z-nalog__obrazac z-nalog__obrazac--usko" onSubmit={this.submit} noValidate>
                    {this.polje('oldPassword', 'Trenutna lozinka')}

                    {this.polje('newPassword', 'Nova lozinka')}

                    {/* Uslovi stoje ispod polja i pale se dok korisnik kuca. */}
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

                    {this.polje('newPasswordRetyped', 'Ponovite novu lozinku')}

                    <div className="z-nalog__dno-obrasca">
                        <button
                            type="submit"
                            className="z-prijava__dugme"
                            disabled={this.state.salje}
                        >
                            {this.state.salje
                                ? 'Mijenjanje…'.translate(l)
                                : 'Promijeni lozinku'.translate(l)}
                        </button>
                    </div>
                </form>
            </NalogOkvir>
        );
    }
}

export default Page(ChangePassword);
