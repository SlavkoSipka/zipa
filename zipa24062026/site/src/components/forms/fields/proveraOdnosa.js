import React, { Component } from 'react';

/*
 * PROVERA MERE SLIKE (2026-10-27) — za hero fotografiju naslovne C.
 *
 * Hero na izgledu C ispuni tačno ono što ostane od ekrana ispod trake sa
 * navigacijom, pa mu je odnos stranica oko 2 : 1 (na 1920×1080 ostane
 * 1920×930, na 1440×900 oko 1440×670). Slika tog odnosa se vidi cela.
 * Ovde administrator odmah posle postavljanja vidi kolika je slika i da li
 * odgovara — a ako ne odgovara, koliko će se i gde odseći.
 */
const ODSTUPANJE = 0.01;

// „2400 × 1200" → „2 : 1"; samo za natpis, da mera i odnos uvek idu zajedno.
const odnosTekst = (sirina, visina) => {
    const nzd = (a, b) => (b ? nzd(b, a % b) : a);
    const d = nzd(sirina, visina) || 1;
    return `${sirina / d} : ${visina / d}`;
};

class ProveraOdnosa extends Component {
    constructor(props) {
        super(props);
        this.state = { mera: null, adresa: null };
    }

    componentDidMount() { this.izmeri(); }
    componentDidUpdate() { this.izmeri(); }

    izmeri() {
        const adresa = this.props.url;
        if (typeof window === 'undefined' || !adresa || adresa === this.state.adresa) return;
        this.setState({ adresa, mera: null });
        const img = new window.Image();
        img.onload = () => this.setState({ mera: { w: img.naturalWidth, h: img.naturalHeight } });
        img.src = adresa;
    }

    render() {
        const { sirina, visina } = this.props;
        const m = this.props.url ? this.state.mera : null;
        const cilj = sirina / visina;

        let poruka = null;
        let vrsta = 'savet';
        if (m) {
            const odnos = m.w / m.h;
            if (Math.abs(odnos - cilj) / cilj <= ODSTUPANJE) {
                vrsta = m.w < 1920 ? 'upozorenje' : 'uspeh';
                poruka = m.w < 1920
                    ? `Slika je ${m.w} × ${m.h} px — odnos je tačan, ali je uska, pa će na velikim ekranima biti mutna. Bolje ${sirina} × ${visina} px.`
                    : `Slika je ${m.w} × ${m.h} px — odnos je tačan, vidi se cela, bez sečenja.`;
            } else {
                vrsta = 'upozorenje';
                const visa = odnos < cilj;
                const deo = Math.round((visa ? 1 - odnos / cilj : 1 - cilj / odnos) * 100);
                poruka = `Slika je ${m.w} × ${m.h} px, a treba odnos ${odnosTekst(sirina, visina)} (${sirina} × ${visina} px). `
                    + `Ovako će se odseći oko ${deo}% ${visa ? 'visine — gore i dole' : 'širine — levo i desno'}.`;
            }
        }

        return (
            <div className={`z-provera-odnosa z-provera-odnosa--${vrsta}`}>
                <p className="z-provera-odnosa__mera">
                    Napravite sliku tačno <b>{sirina} × {visina} px</b> (odnos {odnosTekst(sirina, visina)}).
                </p>
                <p className="z-provera-odnosa__tekst">
                    Hero ispuni tačno prostor između navigacije i donje ivice ekrana, pa se slika ovog
                    odnosa vidi cela. Slika drugačijeg odnosa biće malo isečena po ivicama. Najmanje
                    1920 × 960 px, JPG do 5 MB.
                </p>
                {poruka ? <p className="z-provera-odnosa__nalaz" role="status">{poruka}</p> : null}
            </div>
        );
    }
}

export default ProveraOdnosa;
