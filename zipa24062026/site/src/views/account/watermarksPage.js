import React, { Component } from 'react';
import { Container, Row, Col } from 'reactstrap';

import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import { API_ENDPOINT } from '../../constants';

/**
 * Zbirka žigova za pregledne fotografije.
 *
 * Klijent je pitao može li sam povremeno menjati logotip. Do sada je postojao
 * samo jedan, pa je za svaku promenu morao ponovo da postavlja fajl. Ovde ih
 * čuva više i prebacuje jednim klikom.
 */
class WatermarksPage extends Component {
    constructor(props) {
        super(props);
        this.state = { zigovi: [], ucitava: true, greska: null, poruka: null, naziv: '', salje: false };
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        this.ucitaj();
    }

    zaglavlje() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        };
    }

    ucitaj = () => {
        fetch(`${API_ENDPOINT}/watermarks/all`, { method: 'GET', headers: this.zaglavlje() })
            .then((r) => {
                if (r.status === 401 || r.status === 403) throw new Error('prijava');
                if (!r.ok) throw new Error('server');
                return r.json();
            })
            .then((zigovi) => this.setState({ zigovi, ucitava: false, greska: null }))
            .catch((e) => this.setState({
                ucitava: false,
                greska: e.message === 'prijava'
                    ? 'Za ovaj pregled je potrebna prijava administratorskim nalogom.'
                    : 'Podaci trenutno nisu dostupni.'
            }));
    };

    // Postavljanje novog žiga: prvo se šalje fajl, pa se zapamti uz naziv.
    posalji = (e) => {
        const fajl = e.target.files && e.target.files[0];
        if (!fajl) return;

        const naziv = (this.state.naziv || '').trim() || fajl.name.replace(/\.[^.]+$/, '');
        this.setState({ salje: true, poruka: null, greska: null });

        const podaci = new FormData();
        podaci.append('file', fajl);

        fetch(`${API_ENDPOINT}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
            body: podaci
        })
            // Ruta za otpremanje vraća adresu kao običan tekst, ne kao JSON.
            .then((r) => {
                if (!r.ok) throw new Error('upload');
                return r.text();
            })
            .then((odgovor) => {
                const adresa = (odgovor || '').trim();
                if (!adresa || adresa.indexOf('http') !== 0) throw new Error('upload');
                return fetch(`${API_ENDPOINT}/watermarks/update/new`, {
                    method: 'POST',
                    headers: this.zaglavlje(),
                    body: JSON.stringify({ name: naziv, image: adresa })
                });
            })
            .then(() => this.setState({ salje: false, naziv: '', poruka: 'Žig je sačuvan.' }, this.ucitaj))
            .catch(() => this.setState({ salje: false, greska: 'Slanje nije uspelo. Provjerite da je fajl PNG.' }));
    };

    ukljuci = (id) => {
        fetch(`${API_ENDPOINT}/watermarks/activate/${id}`, { method: 'POST', headers: this.zaglavlje() })
            .then(() => this.setState({ poruka: 'Žig je uključen. Važi za galerije postavljene od sada.' }, this.ucitaj))
            .catch(() => this.setState({ greska: 'Uključivanje nije uspelo.' }));
    };

    obrisi = (id) => {
        fetch(`${API_ENDPOINT}/watermarks/delete/${id}`, { method: 'DELETE', headers: this.zaglavlje() })
            .then(async (r) => {
                if (!r.ok) {
                    const o = await r.json().catch(() => ({}));
                    throw new Error(o.error || 'Brisanje nije uspelo.');
                }
                this.setState({ poruka: 'Žig je obrisan.' }, this.ucitaj);
            })
            .catch((e) => this.setState({ greska: e.message }));
    };

    render() {
        const { zigovi, ucitava, greska, poruka, salje } = this.state;

        return (
            <AdminOkvir
                lang={this.props.lang}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Žigovi'.translate(this.props.lang)}
            >
                <div className="account-wrap zigovi-strana">
                <Container>
                    <Row>
                        <Col lg="12">
                            <p className="uvod">
                                Ovdje čuvate više žigova i prebacujete koji se koristi.
                                Uključeni žig se ugrađuje u pregledne fotografije
                                <b> u trenutku postavljanja galerije</b> — promjena važi za
                                galerije postavljene od tada, ranije zadržavaju svoj.
                            </p>

                            <div className="napomena">
                                <b>Kako pripremiti:</b> PNG sa providnom pozadinom, širine
                                najmanje 700 a najbolje oko 1000 tačaka. Žig se sam smanjuje
                                na polovinu širine fotografije i staje u sredinu, pa najbolje
                                radi širok i nizak oblik.
                            </div>

                            {greska ? <div className="napomena upozorenje">{greska}</div> : null}
                            {poruka ? <div className="napomena uspeh">{poruka}</div> : null}

                            {!greska ? (
                                <div className="dodavanje">
                                    <input
                                        type="text"
                                        placeholder="Naziv žiga (npr. redovni, godišnjica)"
                                        value={this.state.naziv}
                                        onChange={(e) => this.setState({ naziv: e.target.value })}
                                    />
                                    <label className="dugme-fajl">
                                        {salje ? 'Šaljem…' : 'Izaberi PNG i sačuvaj'}
                                        <input type="file" accept="image/png" onChange={this.posalji} disabled={salje} />
                                    </label>
                                </div>
                            ) : null}

                            {ucitava ? <p className="uvod">Učitavam…</p> : null}

                            {!ucitava && !greska && !zigovi.length ? (
                                <p className="prazno">
                                    Nema nijednog žiga, pa se fotografije postavljaju
                                    <b> bez žiga</b>. Dodajte PNG iznad.
                                </p>
                            ) : null}

                            <div className="mreza-zigova">
                                {zigovi.map((z) => (
                                    <div className={z.ukljucen ? 'zig ukljucen' : 'zig'} key={z._id}>
                                        <div className="slika">
                                            {z.image ? <img src={z.image} alt={z.name} /> : null}
                                        </div>
                                        <div className="telo">
                                            <b>{z.name}</b>
                                            {z.ukljucen ? <span className="oznaka">uključen</span> : null}
                                        </div>
                                        <div className="radnje">
                                            {/*
                                              * „Zatečen" je žig koji stoji u podešavanjima
                                              * još od starog sajta, a nikad nije upisan kao
                                              * zapis. Prikazuje se da bi se vidjelo šta se
                                              * zaista utiskuje u fotografije; ne može se
                                              * uključiti (već jeste) ni obrisati.
                                              */}
                                            {z.zatecen ? (
                                                <span className="napomena-mala">
                                                    {z.fajlPostoji === false
                                                        ? 'Datoteka žiga NE POSTOJI na serveru — fotografije se postavljaju bez žiga.'
                                                        : 'Zatečen iz podešavanja, nije sačuvan kao zapis. Dodajte ga iznad ako želite da ga čuvate uz ostale.'}
                                                </span>
                                            ) : !z.ukljucen ? (
                                                <>
                                                    <button type="button" onClick={() => this.ukljuci(z._id)}>Uključi</button>
                                                    <button type="button" className="brisi" onClick={() => this.obrisi(z._id)}>Obriši</button>
                                                </>
                                            ) : (
                                                <span className="napomena-mala">Da biste ga obrisali, prvo uključite drugi.</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Col>
                    </Row>
                </Container>
                </div>
            </AdminOkvir>
        );
    }
}

export default Page(WatermarksPage);
