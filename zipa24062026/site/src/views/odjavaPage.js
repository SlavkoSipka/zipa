import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';

import Page from '../containers/page';
import { API_ENDPOINT } from '../constants';

/*
 * ODJAVA SA LISTE — /odjava
 *
 * Otvara se iz veze u samoj pošti. Odjava se izvršava ODMAH — ne traži se
 * prijava ni potvrda, jer primalac pošte najčešće nije korisnik sajta, a
 * svaki dodatni korak do odjave je razlog da poštu prijavi kao nepoželjnu.
 * Ta odluka je zatečena i nije menjana.
 *
 * Novo je samo šta se vidi: jedna centrirana poruka umesto reda teksta preko
 * cele širine, i tiho dugme za povratak na listu — za one koji su kliknuli
 * greškom. Povratak koristi ISTI poziv (`/newsletter/subscribe`) koji koristi
 * i obrazac u podnožju.
 */
class OdjavaPage extends Component {
    constructor(props) {
        super(props);
        this.state = { stanje: 'radim', adresa: null, vracam: false, vracen: false };
    }

    componentDidMount() {
        window.scrollTo(0, 0);

        const upit = new URLSearchParams(this.props[0].location.search);
        const email = upit.get('email');
        const k = upit.get('k');

        if (!email || !k) {
            this.setState({ stanje: 'neispravna' });
            return;
        }

        this.setState({ adresa: email });

        fetch(`${API_ENDPOINT}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&k=${encodeURIComponent(k)}`)
            .then((r) => this.setState({ stanje: r.ok ? 'odjavljen' : 'neispravna' }))
            .catch(() => this.setState({ stanje: 'greska' }));
    }

    // „Ipak me vratite na listu" — isti poziv kao obrazac u podnožju.
    vratiNaListu = () => {
        if (this.state.vracam || !this.state.adresa) return;
        this.setState({ vracam: true });

        fetch(`${API_ENDPOINT}/newsletter/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: this.state.adresa })
        })
            .then((r) => this.setState({ vracam: false, vracen: r.ok }))
            .catch(() => this.setState({ vracam: false }));
    };

    render() {
        const l = this.props.lang;
        const { stanje, adresa } = this.state;

        return (
            <div className="odjava-strana z-odjava">
                <Container>
                    <div className="z-odjava__okvir">

                        {stanje === 'radim' ? (
                            <>
                                <h1 className="z-odjava__naslov">{'Odjavljujem…'.translate(l)}</h1>
                                <p className="z-odjava__tekst">{'Samo trenutak.'.translate(l)}</p>
                            </>
                        ) : null}

                        {stanje === 'odjavljen' ? (
                            this.state.vracen ? (
                                <>
                                    <span className="z-odjava__znak z-odjava__znak--uspjeh" aria-hidden="true" />
                                    <h1 className="z-odjava__naslov">{'Vratili smo vas na listu'.translate(l)}</h1>
                                    <p className="z-odjava__tekst">
                                        {'Adresa'.translate(l)} <b>{adresa}</b>{' '}
                                        {'ponovo prima obavještenja o novim galerijama.'.translate(l)}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <span className="z-odjava__znak" aria-hidden="true" />
                                    <h1 className="z-odjava__naslov">{'Odjavljeni ste'.translate(l)}</h1>
                                    <p className="z-odjava__tekst">
                                        {'Adresa'.translate(l)} <b>{adresa}</b>{' '}
                                        {'je uklonjena sa liste. Više vam nećemo slati obavještenja o novim galerijama.'.translate(l)}
                                    </p>

                                    <button
                                        type="button"
                                        className="z-odjava__tiho-dugme"
                                        disabled={this.state.vracam}
                                        onClick={this.vratiNaListu}
                                    >
                                        {this.state.vracam
                                            ? 'Vraćam…'.translate(l)
                                            : 'Ipak me vratite na listu'.translate(l)}
                                    </button>
                                </>
                            )
                        ) : null}

                        {stanje === 'neispravna' ? (
                            <>
                                <h1 className="z-odjava__naslov">{'Veza nije ispravna'.translate(l)}</h1>
                                <p className="z-odjava__tekst">
                                    {'Ova veza za odjavu nije ispravna ili je istekla. Javite nam se i odjavićemo vas ručno.'.translate(l)}{' '}
                                    <a className="z-odjava__veza" href="mailto:info@zipaphoto.net">info@zipaphoto.net</a>
                                </p>
                            </>
                        ) : null}

                        {stanje === 'greska' ? (
                            <>
                                <h1 className="z-odjava__naslov">{'Nešto nije u redu'.translate(l)}</h1>
                                <p className="z-odjava__tekst">
                                    {'Odjava trenutno nije uspjela. Pokušajte ponovo za koji trenutak ili nam pišite na'.translate(l)}{' '}
                                    <a className="z-odjava__veza" href="mailto:info@zipaphoto.net">info@zipaphoto.net</a>.
                                </p>
                            </>
                        ) : null}

                        <p className="z-odjava__dno">
                            <Link className="z-odjava__veza" to="/">{'Nazad na naslovnu'.translate(l)}</Link>
                        </p>
                    </div>
                </Container>
            </div>
        );
    }
}

export default Page(OdjavaPage);
