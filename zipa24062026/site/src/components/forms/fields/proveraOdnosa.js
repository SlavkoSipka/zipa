import React, { Component } from 'react';

/*
 * PROVERA MERE SLIKE (2026-10-27) — za hero fotografiju naslovne C.
 *
 * Hero na izgledu C ima stalan odnos stranica (16 : 9), pa se slika TOG
 * odnosa vidi cela, bez sečenja, na svakom ekranu. Ovde administrator odmah
 * posle postavljanja vidi kolika je slika i da li odgovara — a ako ne
 * odgovara, koliko će se i gde odseći.
 */
const ODSTUPANJE = 0.01;

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
                poruka = `Slika je ${m.w} × ${m.h} px, a treba odnos 16 : 9 (${sirina} × ${visina} px). `
                    + `Ovako će se odseći oko ${deo}% ${visa ? 'visine — gore i dole' : 'širine — levo i desno'}.`;
            }
        }

        return (
            <div className={`z-provera-odnosa z-provera-odnosa--${vrsta}`}>
                <p className="z-provera-odnosa__mera">
                    Napravite sliku tačno <b>{sirina} × {visina} px</b> (odnos 16 : 9).
                </p>
                <p className="z-provera-odnosa__tekst">
                    Tada se na naslovnoj vidi CELA, bez ikakvog sečenja, na svakom ekranu. Slika drugačijeg
                    odnosa biće malo isečena po ivicama. Najmanje 1920 × 1080 px, JPG do 5 MB.
                </p>
                {poruka ? <p className="z-provera-odnosa__nalaz" role="status">{poruka}</p> : null}
            </div>
        );
    }
}

export default ProveraOdnosa;
