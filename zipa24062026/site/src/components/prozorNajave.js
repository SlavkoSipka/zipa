import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';

/*
 * PROZOR NAJAVE (2026-10-13)
 *
 * U traci iznad navbara stoje dve najave — „Obaveštenje 1" levo i
 * „Obaveštenje 2" desno (`header.js`). Dugme uz svaku otvara ovaj prozor:
 * pun naslov (`naslov`, a ako nije unet — natpis iz trake `content`), opis
 * (`text`) i, ako je upisana veza, dugme „Pogledaj".
 *
 * Prozor se crta u <body> preko portala: zaglavlje ima svoj sloj
 * (`--sloj-padajuce`), pa bi prozor unutar njega ostao ispod svega što je na
 * strani više. Zatvara se na Esc, klik pored kartice i dugmetom; fokus ostaje
 * u prozoru dok je otvoren i vraća se na dugme koje ga je otvorilo.
 */

/*
 * `text` najave je u bazi STRING koji sadrži JSON po jezicima
 * (`"{\"ba\": \"<p>…</p>\"}"`), ne objekat kao ostale višejezične vrednosti.
 * Raspakuje se ovde; ako nije JSON, uzima se kako stoji.
 */
export const teloNajave = (data, l) => {
    const sirovo = data && data.text;
    if (!sirovo) return '';

    // Već je objekat po jezicima — normalan slučaj za ostatak sajta.
    if (typeof sirovo === 'object') {
        return Object.translate(data, 'text', l) || '';
    }

    if (typeof sirovo === 'string') {
        const s = sirovo.trim();
        if (s.charAt(0) === '{') {
            try {
                const raspakovano = JSON.parse(s);
                return raspakovano[l] || raspakovano.ba || '';
            } catch (e) {
                return sirovo;   // nije JSON — piše se kako stoji
            }
        }
        return sirovo;
    }

    return '';
};

// Pun naslov za prozor; prazan `naslov` znači „isti kao natpis u traci".
export const naslovNajave = (data, l) =>
    (data && data.naslov && Object.translate(data, 'naslov', l))
    || (data && data.content && Object.translate(data, 'content', l))
    || '';

class ProzorNajave extends Component {
    componentDidMount() {
        this.prethodniFokus = document.activeElement;
        this.skrolPre = document.body.style.overflowY;
        document.body.style.overflowY = 'hidden';
        document.addEventListener('keydown', this.naTaster);
        if (this.dugmeZatvori) this.dugmeZatvori.focus();
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.naTaster);
        document.body.style.overflowY = this.skrolPre || '';
        if (this.prethodniFokus && this.prethodniFokus.focus) this.prethodniFokus.focus();
    }

    naTaster = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
            this.props.onZatvori();
            return;
        }
        // Tab ostaje u prozoru.
        if (e.key !== 'Tab' || !this.kartica) return;
        const fokusabilni = this.kartica.querySelectorAll('a[href], button');
        if (!fokusabilni.length) return;
        const prvi = fokusabilni[0];
        const poslednji = fokusabilni[fokusabilni.length - 1];
        if (e.shiftKey && document.activeElement === prvi) {
            e.preventDefault();
            poslednji.focus();
        } else if (!e.shiftKey && document.activeElement === poslednji) {
            e.preventDefault();
            prvi.focus();
        }
    };

    render() {
        const { najava, oznaka, lang: l, onZatvori } = this.props;
        if (typeof document === 'undefined' || !najava) return null;

        const naslov = naslovNajave(najava, l);
        const telo = teloNajave(najava, l);

        return ReactDOM.createPortal(
            <div className="z-prozor-najave"
                 onMouseDown={(e) => { if (e.target === e.currentTarget) onZatvori(); }}>
                <div className="z-prozor-najave__kartica"
                     role="dialog"
                     aria-modal="true"
                     aria-labelledby="z-prozor-najave-naslov"
                     ref={(n) => this.kartica = n}>

                    <button type="button"
                            className="z-prozor-najave__x"
                            aria-label={'Zatvori'.translate(l)}
                            ref={(n) => this.dugmeZatvori = n}
                            onClick={onZatvori}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>

                    {oznaka ? <p className="z-prozor-najave__oznaka">{oznaka}</p> : null}
                    <h2 id="z-prozor-najave-naslov" className="z-prozor-najave__naslov">{naslov}</h2>

                    {telo ?
                        <div className="z-prozor-najave__telo" dangerouslySetInnerHTML={{ __html: telo }}/>
                        : null}

                    <div className="z-prozor-najave__radnje">
                        {najava.link ?
                            <Link className="z-dugme z-dugme--glavno" to={najava.link} onClick={onZatvori}>
                                {'Pogledaj'.translate(l)}
                            </Link>
                            : null}
                        <button type="button" className="z-dugme z-dugme--sporedno" onClick={onZatvori}>
                            {'Zatvori'.translate(l)}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    }
}

export default ProzorNajave;
