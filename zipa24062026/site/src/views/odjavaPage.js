import React, { Component } from 'react';
import { Container, Row, Col } from 'reactstrap';

import Page from '../containers/page';
import { API_ENDPOINT } from '../constants';

/**
 * Odjava sa liste za obaveštenja.
 *
 * Otvara se iz veze u samoj pošti. Odjava se izvršava odmah — ne traži se
 * prijava ni potvrda, jer primalac pošte najčešće nije korisnik sajta, a
 * svaki dodatni korak do odjave je razlog da poštu prijavi kao nepoželjnu.
 */
class OdjavaPage extends Component {
    constructor(props) {
        super(props);
        this.state = { stanje: 'radim', adresa: null };
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

    render() {
        const { stanje, adresa } = this.state;

        return (
            <div className="odjava-strana">
                <Container>
                    <Row>
                        <Col lg="12">
                            {stanje === 'radim' ? (
                                <>
                                    <h1>Odjavljujem…</h1>
                                    <p>Samo trenutak.</p>
                                </>
                            ) : null}

                            {stanje === 'odjavljen' ? (
                                <>
                                    <h1>Odjavljeni ste</h1>
                                    <p>
                                        Adresa <b>{adresa}</b> je uklonjena sa liste.
                                        Više Vam nećemo slati obaveštenja o novim galerijama.
                                    </p>
                                    <p className="sitno">
                                        Ako se predomislite, možete se ponovo prijaviti u podnožju sajta.
                                    </p>
                                </>
                            ) : null}

                            {stanje === 'neispravna' ? (
                                <>
                                    <h1>Veza nije ispravna</h1>
                                    <p>
                                        Ova veza za odjavu nije ispravna ili je istekla.
                                        Javite nam se na <a href="mailto:info@zipaphoto.net">info@zipaphoto.net</a> i
                                        odjavićemo Vas ručno.
                                    </p>
                                </>
                            ) : null}

                            {stanje === 'greska' ? (
                                <>
                                    <h1>Nešto nije u redu</h1>
                                    <p>
                                        Odjava trenutno nije uspela. Pokušajte ponovo za koji trenutak
                                        ili nam pišite na <a href="mailto:info@zipaphoto.net">info@zipaphoto.net</a>.
                                    </p>
                                </>
                            ) : null}
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}

export default Page(OdjavaPage);
