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

/*
 * Fotograf ima svoje strane — galerije koje postavlja i pregledi njegovih
 * fotografija. Do sada su stajale u vodoravnoj traci `account-nav` u
 * zaglavlju; spisak je prenesen ovde NEPROMENJEN, uključujući i uslov da se
 * „Korisnici" vide samo uz dozvolu `*`. Okvir ne proverava prava — samo
 * pokazuje iste veze koje je i traka pokazivala.
 */
const STAVKE_FOTOGRAF = [
    { putanja: '/account/profile',         naziv: 'Profil' },
    { putanja: '/account/galleries',       naziv: 'Fotografije' },
    { putanja: '/account/photo-visits',    naziv: 'Pregledi' },
    { putanja: '/account/users',           naziv: 'Korisnici', samoSaSvimPravima: true },
    { putanja: '/account/edit',            naziv: 'Izmjena podataka' },
    { putanja: '/account/change-password', naziv: 'Promjena lozinke' },
];

function stavkeZa(u) {
    if (!u || u.userRole !== 'photographer') return STAVKE;

    const svaPrava = !!(u.permissions && u.permissions.indexOf('*') !== -1);
    return STAVKE_FOTOGRAF.filter((s) => !s.samoSaSvimPravima || svaPrava);
}

class NalogOkvir extends Component {
    render() {
        const l = this.props.lang;
        const putanja = this.props.putanja || '';
        const u = this.props.uData;
        const stavke = stavkeZa(u);
        const jeFotograf = !!(u && u.userRole === 'photographer');

        return (
            <div className="account-wrap z-nalog">
                <Container>
                    <div className="z-nalog__raspored">

                        {/* ── bočni meni ─────────────────────────────── */}
                        <nav className="z-nalog__meni" aria-label={'Meni naloga'.translate(l)}>
                            {u ? (
                                <div className="z-nalog__korisnik">
                                    <span className="z-nalog__korisnik-ime">
                                        {u.name}
                                    </span>
                                    <span className="z-nalog__korisnik-mejl">
                                        {u.email}
                                    </span>
                                </div>
                            ) : null}

                            {jeFotograf ? (
                                <Link to="/account/gallery/new" className="z-nalog__radnja">
                                    {'Dodaj fotografiju'.translate(l)}
                                </Link>
                            ) : null}

                            <ul className="z-nalog__stavke">
                                {stavke.map((s) => (
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
                                        onClick={() => {
                                            /*
                                             * Odjava mora i da ODVEDE korisnika.
                                             *
                                             * `signOut` samo brise token i cisti
                                             * `uData`. Vecina strana pod
                                             * `/account` ima `loginNeeded`, pa se
                                             * tada same prebace na prijavu — ali
                                             * pet ih nema (`/account/dashboard`,
                                             * `/account/archive-stats`,
                                             * `/account/watermarks`,
                                             * `/account/subscription`). Tamo se
                                             * posle klika NISTA nije menjalo:
                                             * strana ostaje, okvir i dalje stoji,
                                             * pa dugme deluje kao da ne radi.
                                             *
                                             * `location.href` namerno, ne
                                             * `history.push`: odjava treba da
                                             * baci i sve sto je ostalo u memoriji
                                             * (dovucene galerije, korpa, podaci
                                             * korisnika), a ne samo da promeni
                                             * adresu.
                                             */
                                            if (this.props.signOut) this.props.signOut();
                                            if (typeof window !== 'undefined') {
                                                window.location.href = '/';
                                            }
                                        }}
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
