import React, { Component } from 'react';
import { API_ENDPOINT } from '../constants';

/*
 * LICENCE U PROZORU FOTOGRAFIJE (2026-10-10), po uzoru na AP Newsroom.
 *
 * Ispod veličina stoji „Prikaži više opcija": otvara spisak namena
 * korišćenja (Televizija, Štampa i portali…) sa cenom i opisom. Licenca se
 * NE dodaje u korpu — izbor otvara kratak obrazac (ime i prezime, firma,
 * telefon, e-mail) i šalje UPIT agenciji. Upit stiže u administraciju
 * (*Poruke → Upiti za licence*); prenos materijala i dozvole agencija
 * dogovara sa kupcem.
 *
 * Cena, redom: upisana na samoj fotografiji (`foto.cene[<id licence>]`),
 * pa za celu galeriju (`galerija.cene`), pa opšta cena licence. Bez ijedne
 * — „Na upit".
 */
class UpitLicence extends Component {
    constructor(props) {
        super(props);
        this.state = {
            otvoreno: false,
            izabrana: null,
            ime: '', firma: '', telefon: '', email: '', poruka: '',
            salje: false,
            greska: null,
            poslato: false,
        };
    }

    componentDidUpdate(prethodni) {
        // Druga fotografija — počinje se iznova.
        if (prethodni.photoId !== this.props.photoId) {
            this.setState({ izabrana: null, poslato: false, greska: null });
        }
    }

    cenaLicence = (lic) => {
        const foto = this.props.foto;
        const naFoto = foto && foto.cene ? foto.cene[String(lic._id)] : null;
        if (naFoto !== null && naFoto !== undefined && naFoto !== '') return parseFloat(naFoto);
        const zaGaleriju = this.props.ceneGalerije ? this.props.ceneGalerije[String(lic._id)] : null;
        if (zaGaleriju !== null && zaGaleriju !== undefined && zaGaleriju !== '') return parseFloat(zaGaleriju);
        if (lic.cena !== null && lic.cena !== undefined && lic.cena !== '') return parseFloat(lic.cena);
        return null;
    };

    posalji = (e) => {
        e.preventDefault();
        const l = this.props.lang;
        const { ime, firma, telefon, email, poruka, izabrana } = this.state;

        if (!ime.trim() || !firma.trim() || !telefon.trim() || email.indexOf('@') === -1) {
            this.setState({ greska: 'Popunite ime i prezime, firmu, telefon i ispravnu e-mail adresu.'.translate(l) });
            return;
        }

        this.setState({ salje: true, greska: null });
        fetch(`${API_ENDPOINT}/upiti/licenca`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ime, firma, telefon, email, poruka,
                galleryId: this.props.galleryId,
                photoId: this.props.photoId,
                licencaId: izabrana,
            }),
        }).then((res) => res.json().then((telo) => ({ ok: res.ok, telo })))
            .then(({ ok, telo }) => {
                if (!ok || (telo && telo.error)) {
                    this.setState({ salje: false, greska: (telo && telo.error) || 'Upit nije poslat. Pokušajte ponovo.'.translate(l) });
                    return;
                }
                this.setState({ salje: false, poslato: true });
            })
            .catch(() => this.setState({ salje: false, greska: 'Upit nije poslat. Pokušajte ponovo.'.translate(l) }));
    };

    polje(ime, natpis, tip = 'text', obavezno = true) {
        return (
            <label className="z-licence__polje">
                <span>{natpis.translate(this.props.lang)}{obavezno ? ' *' : ''}</span>
                <input
                    type={tip}
                    value={this.state[ime]}
                    required={obavezno}
                    onChange={(e) => this.setState({ [ime]: e.target.value })}
                />
            </label>
        );
    }

    render() {
        const l = this.props.lang;
        const licence = this.props.licence || [];
        if (!licence.length) return null;

        const { otvoreno, izabrana, poslato } = this.state;

        return (
            <div className="z-licence">
                <button
                    type="button"
                    className="z-licence__prekidac"
                    aria-expanded={otvoreno}
                    onClick={() => this.setState({ otvoreno: !otvoreno })}
                >
                    <span className="z-licence__crta" aria-hidden="true" />
                    <span>{(otvoreno ? 'Prikaži manje opcija' : 'Prikaži više opcija').translate(l)}</span>
                    <span className="z-licence__crta" aria-hidden="true" />
                </button>

                {otvoreno ? (
                    <>
                        <span className="z-prozor__oznaka-grupe">{'Namjena korišćenja'.translate(l)}</span>

                        <div className="z-prozor__rezolucije">
                            {licence.map((lic) => {
                                const cena = this.cenaLicence(lic);
                                const jeIzabrana = izabrana === String(lic._id);
                                return (
                                    <button
                                        type="button"
                                        key={lic._id}
                                        aria-pressed={jeIzabrana}
                                        className={'z-prozor__rezolucija' + (jeIzabrana ? ' z-prozor__rezolucija--izabrana' : '')}
                                        onClick={() => this.setState({ izabrana: String(lic._id), poslato: false, greska: null })}
                                    >
                                        <span className="z-prozor__rez-levo">
                                            <span className="z-prozor__rez-naziv">{Object.translate(lic, 'naziv', l)}</span>
                                            <span className="z-prozor__rez-opis">{Object.translate(lic, 'opis', l)}</span>
                                        </span>
                                        <span className="z-prozor__rez-cena">
                                            {cena !== null ? `${cena.formatPrice(2)} KM` : 'Na upit'.translate(l)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {izabrana && poslato ? (
                            <p className="z-licence__poslato" role="status">
                                {'Upit je poslat. Agencija će vas kontaktirati u najkraćem roku.'.translate(l)}
                            </p>
                        ) : null}

                        {izabrana && !poslato ? (
                            <form className="z-licence__obrazac" onSubmit={this.posalji} noValidate>
                                <p className="z-licence__uvod">
                                    {'Ostavite podatke — agencija će vam poslati ponudu i uslove korišćenja.'.translate(l)}
                                </p>
                                {this.polje('ime', 'Ime i prezime')}
                                {this.polje('firma', 'Firma')}
                                {this.polje('telefon', 'Telefon', 'tel')}
                                {this.polje('email', 'E-mail', 'email')}
                                <label className="z-licence__polje">
                                    <span>{'Napomena'.translate(l)}</span>
                                    <textarea
                                        rows="3"
                                        value={this.state.poruka}
                                        onChange={(e) => this.setState({ poruka: e.target.value })}
                                    />
                                </label>

                                {this.state.greska ? (
                                    <p className="z-licence__greska" role="alert">{this.state.greska}</p>
                                ) : null}

                                <button type="submit" className="z-prozor__glavna-radnja" disabled={this.state.salje}>
                                    {(this.state.salje ? 'Šaljem…' : 'Pošalji upit').translate(l)}
                                </button>
                            </form>
                        ) : null}
                    </>
                ) : null}
            </div>
        );
    }
}

export default UpitLicence;
