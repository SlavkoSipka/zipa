import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';

import Page from '../../containers/page';
import { API_ENDPOINT } from '../../constants';

/*
 * POTVRDA ADRESE — /account/verify/:uid/:kod
 *
 * Prva strana koju novi korisnik vidi posle registracije.
 *
 * Ranije je iscrtavala `null` i odmah preusmeravala na `/login` — korisnik bi
 * video prijavu bez ijedne reči o tome da li je potvrda uspela, i bez razloga
 * da ostane. Sada strana ostaje: potvrda, pa jedan jasan sledeći korak.
 *
 * Poziv `/user/email/verify/:uid/:kod` je NEPROMENJEN. Promenjeno je samo šta
 * se dešava posle odgovora: umesto preusmerenja se iscrtava poruka.
 *
 * Strana je i dobila `Page(...)` — bez toga se prikazivala bez zaglavlja i
 * podnožja, kao da je ispala iz sajta.
 */
class EmailVerifyPage extends Component {
    constructor(props) {
        super(props);
        this.state = { stanje: 'radim', error: null };
    }

    componentDidMount() {
        window.scrollTo(0, 0);

        fetch(`${API_ENDPOINT}/user/email/verify/${this.props[0].match.params.uid}/${this.props[0].match.params.emailVerificationCode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(res => res.json()).then((result) => {
            if (result.error) {
                this.setState({ stanje: 'neispravna', error: result.error })
            } else {
                localStorage.removeItem('cart');
                this.setState({ stanje: 'potvrdjena' });
            }
        }).catch(() => {
            this.setState({ stanje: 'greska' });
        })
    }

    render() {
        const l = this.props.lang;
        const { stanje } = this.state;

        return (
            <div className="login-wrap z-potvrda">
                <Container>
                    <div className="z-potvrda__okvir">

                        {stanje === 'radim' ? (
                            <>
                                <h1 className="z-potvrda__naslov">{'Provjeravamo…'.translate(l)}</h1>
                                <p className="z-potvrda__tekst">{'Samo trenutak.'.translate(l)}</p>
                            </>
                        ) : null}

                        {stanje === 'potvrdjena' ? (
                            <>
                                <span className="z-potvrda__znak" aria-hidden="true" />

                                <h1 className="z-potvrda__naslov">
                                    {'Dobrodošli u arhivu'.translate(l)}
                                </h1>

                                {/*
                                  * NE piše „nalog je otvoren" i NE nudi prijavu.
                                  * Registracija upisuje `accountEnabled: false`, a
                                  * `/user/login` odbija takav nalog porukom da čeka
                                  * odobrenje administratora — dugme ka prijavi bi
                                  * vodilo pravo u tu poruku.
                                  *
                                  * Pretraga arhive radi i bez naloga, pa je ona
                                  * jedini korak koji ovde zaista vodi negde.
                                  */}
                                <p className="z-potvrda__tekst">
                                    {'Vaša adresa je potvrđena. Nalog sada čeka odobrenje agencije — javićemo vam se čim bude spreman. Do tada arhivu možete pretraživati i bez prijave: preko 200.000 fotografija iz Banje Luke i okoline, od 1990. do danas.'.translate(l)}
                                </p>

                                <div className="z-potvrda__radnje">
                                    <Link className="z-potvrda__radnja z-potvrda__radnja--glavna" to="/galerije">
                                        {'Pretražite arhivu'.translate(l)}
                                    </Link>
                                    <Link className="z-potvrda__radnja" to="/contact">
                                        {'Pišite nam'.translate(l)}
                                    </Link>
                                </div>
                            </>
                        ) : null}

                        {stanje === 'neispravna' ? (
                            <>
                                <h1 className="z-potvrda__naslov">
                                    {'Veza više ne važi'.translate(l)}
                                </h1>
                                <p className="z-potvrda__tekst">
                                    {'Veza za potvrdu adrese važi jednom. Ova je već iskorišćena — ako ste nalog već potvrdili, samo se prijavite. Ako niste, javite nam se i poslaćemo novu.'.translate(l)}
                                </p>

                                <div className="z-potvrda__radnje">
                                    <Link className="z-potvrda__radnja z-potvrda__radnja--glavna" to="/login">
                                        {'Prijavite se'.translate(l)}
                                    </Link>
                                    <Link className="z-potvrda__radnja" to="/contact">
                                        {'Pišite nam'.translate(l)}
                                    </Link>
                                </div>
                            </>
                        ) : null}

                        {stanje === 'greska' ? (
                            <>
                                <h1 className="z-potvrda__naslov">{'Nešto nije u redu'.translate(l)}</h1>
                                <p className="z-potvrda__tekst">
                                    {'Potvrda trenutno nije uspjela. Pokušajte ponovo za koji trenutak ili nam pišite na'.translate(l)}{' '}
                                    <a className="z-potvrda__veza" href="mailto:info@zipaphoto.net">info@zipaphoto.net</a>.
                                </p>
                            </>
                        ) : null}
                    </div>
                </Container>
            </div>
        );
    }
}

export default Page(EmailVerifyPage);
