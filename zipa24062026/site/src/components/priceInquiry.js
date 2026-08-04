import React, { Component } from 'react';
import { API_ENDPOINT } from '../constants';

/**
 * Upit za cenu arhivske fotografije.
 *
 * Starije fotografije nemaju jedinstvenu cenu, pa se umesto iznosa nudi
 * slanje upita: kupac ostavi svoju adresu, agenciji stigne poruka sa
 * podacima o fotografiji i odgovara ponudom.
 */
class PriceInquiry extends Component {
    constructor(props) {
        super(props);
        this.posalji = this.posalji.bind(this);
        this.state = {
            otvoren: false,
            email: '',
            poruka: '',
            slanje: false,
            poslato: false,
            greska: null
        };
    }

    posalji(e) {
        e.preventDefault();
        if (this.state.slanje) return;

        this.setState({ slanje: true, greska: null });

        fetch(`${API_ENDPOINT}/price-inquiry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: this.state.email,
                message: this.state.poruka,
                galleryId: this.props.galleryId,
                photoId: this.props.photoId,
                resolution: this.props.resolution
            })
        })
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (!ok || (data && data.error)) {
                    this.setState({ slanje: false, greska: (data && data.error) || 'Slanje nije uspelo. Pokušajte ponovo.' });
                } else {
                    this.setState({ slanje: false, poslato: true });
                }
            })
            .catch(() => {
                this.setState({ slanje: false, greska: 'Slanje nije uspelo. Pokušajte ponovo.' });
            });
    }

    render() {
        const { lang } = this.props;
        const prevedi = (tekst) => (typeof tekst.translate === 'function' ? tekst.translate(lang) : tekst);

        if (this.state.poslato) {
            return (
                <div className="price-inquiry price-inquiry-done">
                    <h4>{prevedi('Upit je poslat')}</h4>
                    <p>{prevedi('Javićemo Vam se sa ponudom na navedenu e-mail adresu.')}</p>
                </div>
            );
        }

        return (
            <div className="price-inquiry">
                <h4>{prevedi('Cijena na upit')}</h4>
                <p>{prevedi('Ova fotografija je iz arhive i nema fiksnu cijenu. Ostavite svoju e-mail adresu i javićemo Vam se sa ponudom.')}</p>

                {!this.state.otvoren ? (
                    <button type="button" className="inquiry-btn" onClick={() => this.setState({ otvoren: true })}>
                        {prevedi('Pošalji upit za cijenu')}
                    </button>
                ) : (
                    <form onSubmit={this.posalji}>
                        <input
                            type="email"
                            required
                            placeholder={prevedi('Vaša e-mail adresa')}
                            value={this.state.email}
                            onChange={(e) => this.setState({ email: e.target.value })}
                        />
                        <textarea
                            rows="3"
                            placeholder={prevedi('Poruka (nije obavezno)')}
                            value={this.state.poruka}
                            onChange={(e) => this.setState({ poruka: e.target.value })}
                        />
                        {this.state.greska ? <p className="inquiry-error">{this.state.greska}</p> : null}
                        <button type="submit" className="inquiry-btn" disabled={this.state.slanje}>
                            {this.state.slanje ? prevedi('Šaljem…') : prevedi('Pošalji upit')}
                        </button>
                    </form>
                )}
            </div>
        );
    }
}

export default PriceInquiry;
