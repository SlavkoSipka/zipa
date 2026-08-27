import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';

/*
 * ZAJEDNIČKI OKVIR ZA STRANE NALOGA
 *
 * Bočni meni levo, sadržaj desno. Na telefonu meni postaje red vodoravnih
 * kartica koje se prevlače.
 *
 * KAKO SE KORISTI — u bilo kojoj strani pod `/account/*`:
 *
 *     import NalogOkvir from '../../components/nalogOkvir';
 *
 *     render() {
 *         return (
 *             <NalogOkvir
 *                 lang={this.props.lang}
 *                 uData={this.props.uData}
 *                 putanja={this.props[0].location.pathname}
 *                 signOut={this.props.signOut}
 *                 naslov={'Preuzimanja'.translate(this.props.lang)}
 *             >
 *                 …sadržaj strane…
 *             </NalogOkvir>
 *         );
 *     }
 *
 * `putanja` služi samo da se označi aktivna stavka menija — okvir NE bira
 * rutu i ne dira `signOut`, samo ga prosleđuje dalje.
 *
 * Spisak stavki je namerno ovde, a ne u svakoj strani: kad se doda nova
 * strana naloga, dopiše se jedan red u `STAVKE` i pojavi se svuda.
 */

const STAVKE = [
    { putanja: '/account/profile',         naziv: 'Profil' },
    { putanja: '/account/downloads',       naziv: 'Preuzimanja' },
    { putanja: '/account/edit',            naziv: 'Izmjena podataka' },
    { putanja: '/account/change-password', naziv: 'Promjena lozinke' },
];

class NalogOkvir extends Component {
    render() {
        const l = this.props.lang;
        const putanja = this.props.putanja || '';

        return (
            <div className="account-wrap z-nalog">
                <Container>
                    <div className="z-nalog__raspored">

                        {/* ── bočni meni ─────────────────────────────── */}
                        <nav className="z-nalog__meni" aria-label={'Meni naloga'.translate(l)}>
                            {this.props.uData ? (
                                <div className="z-nalog__korisnik">
                                    <span className="z-nalog__korisnik-ime">
                                        {this.props.uData.name}
                                    </span>
                                    <span className="z-nalog__korisnik-mejl">
                                        {this.props.uData.email}
                                    </span>
                                </div>
                            ) : null}

                            <ul className="z-nalog__stavke">
                                {STAVKE.map((s) => (
                                    <li key={s.putanja}>
                                        <Link
                                            to={s.putanja}
                                            className={
                                                'z-nalog__stavka' +
                                                (putanja === s.putanja ? ' z-nalog__stavka--ovde' : '')
                                            }
                                            aria-current={putanja === s.putanja ? 'page' : null}
                                        >
                                            {s.naziv.translate(l)}
                                        </Link>
                                    </li>
                                ))}

                                <li>
                                    <button
                                        type="button"
                                        className="z-nalog__stavka z-nalog__stavka--odjava"
                                        onClick={() => this.props.signOut && this.props.signOut()}
                                    >
                                        {'Odjava'.translate(l)}
                                    </button>
                                </li>
                            </ul>
                        </nav>

                        {/* ── sadržaj ────────────────────────────────── */}
                        <main className="z-nalog__sadrzaj">
                            {this.props.naslov ? (
                                <h1 className="z-nalog__naslov">{this.props.naslov}</h1>
                            ) : null}
                            {this.props.children}
                        </main>
                    </div>
                </Container>
            </div>
        );
    }
}

export default NalogOkvir;
