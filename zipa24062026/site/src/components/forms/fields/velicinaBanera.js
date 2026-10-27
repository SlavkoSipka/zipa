import React, { Component } from 'react';

import {
    VISINE, NAJMANJA_SIRINA, SIRINA_SADRZAJA, MOBILNA, PRAG_ZA_TELEFON, RAZMAK_SLIKA, najvecaSirina,
} from '../../baner';

/*
 * IZBOR VELIČINE ŠIROKOG BANERA (2026-10-27).
 *
 * Administrator izabere jednu od tri visine i širinu klizačem — širina je
 * ograničena sadržajem strane i odnosom 12 : 1 (`components/baner.js`). Odmah
 * ispod piše TAČNA mera slike u pikselima koju treba napraviti, i vidi se
 * pregled: kako baner stoji u širini strane na računaru i kako izgleda na
 * telefonu (sa slikom za telefon ili bez nje).
 *
 * Postavljene slike se proveravaju: ako im se odnos stranica ne poklapa sa
 * izabranim, piše koliko je slika i da će se seći po ivicama.
 */

// Širina sadržaja na telefonu od 375px (16px sa strane).
const SIRINA_TELEFONA = 343;
const ODSTUPANJE = 0.03;

const odnosSePoklapa = (w, h, cw, ch) => Math.abs((w / h) - (cw / ch)) / (cw / ch) <= ODSTUPANJE;

class VelicinaBanera extends Component {
    constructor(props) {
        super(props);
        this.state = { mere: {} };
    }

    componentDidMount() { this.izmeriSlike(); }
    componentDidUpdate() { this.izmeriSlike(); }

    // Stvarne mere postavljenih slika — učitavaju se u pozadini, jednom po adresi.
    izmeriSlike() {
        if (typeof window === 'undefined') return;
        const adrese = [];
        (this.props.slike || []).forEach((s) => {
            if (s && s.image) adrese.push(s.image);
            if (s && s.mobilna) adrese.push(s.mobilna);
        });
        adrese.forEach((adresa) => {
            if (this.state.mere[adresa] !== undefined) return;
            this.setState((st) => ({ mere: Object.assign({}, st.mere, { [adresa]: null }) }));
            const img = new window.Image();
            img.onload = () => this.setState((st) => ({ mere: Object.assign({}, st.mere, { [adresa]: { w: img.naturalWidth, h: img.naturalHeight } }) }));
            img.src = adresa;
        });
    }

    izaberiVisinu = (px) => {
        const n = (this.props.slike || []).filter(Boolean).length;
        const maks = najvecaSirina(px, n);
        const sad = parseInt(this.props.sirina, 10);
        this.props.onVisina(px);
        // Bez širine (ili preširoka za novu visinu) — postavi najveću dozvoljenu.
        if (!sad || sad > maks) this.props.onSirina(maks);
    };

    postaviSirinu = (vrednost, maks) => {
        let w = parseInt(vrednost, 10);
        if (isNaN(w)) { this.props.onSirina(''); return; }
        this.props.onSirina(Math.min(Math.max(w, NAJMANJA_SIRINA), maks));
    };

    render() {
        const visina = parseInt(this.props.visina, 10) || null;
        const slike = (this.props.slike || []).filter(Boolean);
        const n = Math.max(1, slike.length);
        const maks = najvecaSirina(visina, n);
        const sirina = Math.min(parseInt(this.props.sirina, 10) || maks, maks);

        // Pregled na računaru: baner u širini sadržaja strane, u procentima.
        const udeo = (sirina / SIRINA_SADRZAJA) * 100;
        const razmak = (RAZMAK_SLIKA / SIRINA_SADRZAJA) * 100;
        const mestaZaPregled = slike.length ? slike : [null];

        // Na telefonu: koliko visoka bude traka bez slike za telefon.
        const naTelefonuVisina = Math.round(Math.min(sirina, SIRINA_TELEFONA) * visina / sirina);
        const trebaTelefon = sirina >= PRAG_ZA_TELEFON;

        const upozorenja = [];
        slike.forEach((s, i) => {
            const m = this.state.mere[s.image];
            if (visina && m && !odnosSePoklapa(m.w, m.h, sirina, visina)) {
                upozorenja.push(`Slika ${i + 1} je ${m.w} × ${m.h} px, a baner je ${sirina} × ${visina} px — pri prikazu se seče po ivicama.`);
            }
            const mm = s.mobilna && this.state.mere[s.mobilna];
            if (mm && !odnosSePoklapa(mm.w, mm.h, MOBILNA.sirina, MOBILNA.visina)) {
                upozorenja.push(`Slika za telefon uz sliku ${i + 1} je ${mm.w} × ${mm.h} px, a treba ${MOBILNA.sirina} × ${MOBILNA.visina} px — seče se po ivicama.`);
            }
        });

        return (
            <div className="z-velicina-banera">
                <h4 className="z-velicina-banera__naslov">Veličina banera</h4>

                <div className="z-velicina-banera__korak">1. Visina</div>
                <div className="z-velicina-banera__visine" role="radiogroup" aria-label="Visina banera">
                    {VISINE.map((v) => (
                        <button key={v.px} type="button" role="radio" aria-checked={visina === v.px}
                                className={'z-velicina-banera__visina' + (visina === v.px ? ' z-velicina-banera__visina--izabrana' : '')}
                                onClick={() => this.izaberiVisinu(v.px)}>
                            <span className="z-velicina-banera__visina-oblik" style={{ height: `${Math.round(v.px / 5)}px` }} />
                            <b>{v.naziv}</b>
                            <span>{v.px} px</span>
                        </button>
                    ))}
                </div>

                {visina ? (
                    <>
                        <div className="z-velicina-banera__korak">2. Širina — od {NAJMANJA_SIRINA} do {maks} px</div>
                        <div className="z-velicina-banera__sirina">
                            <input type="range" min={NAJMANJA_SIRINA} max={maks} step="10" value={sirina}
                                   aria-label="Širina banera u pikselima"
                                   onChange={(e) => this.postaviSirinu(e.target.value, maks)} />
                            <label className="z-velicina-banera__broj">
                                <input type="number" min={NAJMANJA_SIRINA} max={maks} step="10" value={sirina}
                                       onChange={(e) => this.postaviSirinu(e.target.value, maks)} />
                                <span>px</span>
                            </label>
                        </div>

                        <div className="z-velicina-banera__mera">
                            <span>Napravite sliku tačno</span>
                            <b>{sirina} × {visina} px</b>
                            <span className="z-velicina-banera__tiho">
                                JPG ili PNG. Za oštriji prikaz na retina ekranima može i duplo: {sirina * 2} × {visina * 2} px.
                                {slike.length > 1 ? ` U ovom baneru su ${slike.length} slike jedna do druge — svaka je ove mere.` : ''}
                            </span>
                        </div>

                        {/* ── pregled ───────────────────────────────────── */}
                        <div className="z-velicina-banera__pregledi">
                            <div className="z-velicina-banera__pregled">
                                <div className="z-velicina-banera__korak">Na računaru — u širini strane</div>
                                <div className="z-velicina-banera__strana">
                                    <div className="z-velicina-banera__red" style={{ gap: `${razmak}%` }}>
                                        {mestaZaPregled.map((s, i) => (
                                            <div key={i} className="z-velicina-banera__okvir"
                                                 style={{ width: `${udeo}%`, aspectRatio: `${sirina} / ${visina}` }}>
                                                {s && s.image
                                                    ? <img src={s.image} alt="" />
                                                    : <span>{sirina} × {visina}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="z-velicina-banera__pregled z-velicina-banera__pregled--telefon">
                                <div className="z-velicina-banera__korak">Na telefonu</div>
                                <div className="z-velicina-banera__telefon">
                                    {mestaZaPregled.map((s, i) => (
                                        s && s.mobilna ? (
                                            <div key={i} className="z-velicina-banera__okvir" style={{ aspectRatio: `${MOBILNA.sirina} / ${MOBILNA.visina}` }}>
                                                <img src={s.mobilna} alt="" />
                                            </div>
                                        ) : (
                                            <div key={i} className="z-velicina-banera__okvir"
                                                 style={{ width: `${Math.min(100, (sirina / SIRINA_TELEFONA) * 100)}%`, aspectRatio: `${sirina} / ${visina}` }}>
                                                {s && s.image ? <img src={s.image} alt="" /> : <span>{naTelefonuVisina} px</span>}
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>

                        {trebaTelefon ? (
                            <p className="z-velicina-banera__telefon-savet">
                                Na telefonu bi ovaj baner bio traka visoka oko {naTelefonuVisina} px. Dodajte i
                                <b> sliku za telefon, {MOBILNA.sirina} × {MOBILNA.visina} px</b> — ista mera za svaki baner
                                i svaki telefon. Kliknite na sliku banera ispod, pa „Slika za telefon".
                            </p>
                        ) : null}

                        {upozorenja.map((u, i) => (
                            <p key={i} className="z-velicina-banera__upozorenje" role="alert">{u}</p>
                        ))}
                    </>
                ) : (
                    <p className="z-velicina-banera__tiho">
                        Izaberite visinu — tada se bira širina i ispisuje tačna mera slike. Bez izbora baner se
                        prikazuje kao do sada (do 980 px širine, visina kakva je slika).
                    </p>
                )}
            </div>
        );
    }
}

export default VelicinaBanera;
