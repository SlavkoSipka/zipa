import React, { Component } from 'react';

/*
 * STANJA I PORUKE
 *
 * Tri oblika koje administracija koristi svuda: prozor za potvrdu, obaveštenja
 * u uglu i prazno stanje.
 *
 *     import { Potvrda, Obavestenja, Prazno } from '../../components/admin/Stanja';
 */

/* ═══════════════════════════════════════════════════════════════════════════
   POTVRDA
   ═══════════════════════════════════════════════════════════════════════════
   Zatečeni prozor je pisao samo „Potvrdite brisanje" — bez ijedne reči o tome
   ŠTA se briše i šta se time gubi. Ovde je posledica obavezna.

       <Potvrda
           lang={lang}
           otvoren={!!this.state.zaBrisanje}
           naslov="Brisanje banera"
           tekst={<>Baner <strong>{ime}</strong> se briše trajno.</>}
           opasno
           natpisPotvrde="Obriši"
           naPotvrdu={() => …}
           naOdustani={() => this.setState({ zaBrisanje: null })}
       />

   `opasno` boji dugme potvrde u crveno. Odustajanje je uvek tiho i uvek je
   prvo u redosledu fokusa — da se Enter ne pretvori u nesreću.
*/
export class Potvrda extends Component {
    componentDidMount() {
        if (typeof document !== 'undefined') document.addEventListener('keydown', this.naTaster);
    }
    componentWillUnmount() {
        if (typeof document !== 'undefined') document.removeEventListener('keydown', this.naTaster);
    }

    naTaster = (e) => {
        if (!this.props.otvoren) return;
        if (e.key === 'Escape' || e.keyCode === 27) {
            this.props.naOdustani && this.props.naOdustani();
        }
    };

    render() {
        if (!this.props.otvoren) return null;
        const l = this.props.lang;

        return (
            <div
                className="z-potvrda"
                role="dialog"
                aria-modal="true"
                aria-label={(this.props.naslov || 'Potvrda').translate(l)}
                onClick={(e) => {
                    // Klik IZVAN okvira zatvara; klik unutar ne propada do zavese.
                    if (e.target === e.currentTarget) this.props.naOdustani && this.props.naOdustani();
                }}
            >
                <div className="z-potvrda__okvir">
                    <h2 className="z-potvrda__naslov">
                        {(this.props.naslov || 'Potvrda').translate(l)}
                    </h2>

                    <p className="z-potvrda__tekst">{this.props.tekst}</p>

                    <div className="z-potvrda__dugmad">
                        <button
                            type="button"
                            className="z-dugme z-dugme--sporedno"
                            onClick={() => this.props.naOdustani && this.props.naOdustani()}
                            autoFocus
                        >
                            {(this.props.natpisOdustanka || 'Odustani').translate(l)}
                        </button>

                        <button
                            type="button"
                            className={'z-dugme ' + (this.props.opasno ? 'z-dugme--opasno' : 'z-dugme--glavno')}
                            onClick={() => this.props.naPotvrdu && this.props.naPotvrdu()}
                        >
                            {(this.props.natpisPotvrde || 'Potvrdi').translate(l)}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   OBAVEŠTENJA U UGLU
   ═══════════════════════════════════════════════════════════════════════════
       <Obavestenja lang={lang} poruke={this.state.poruke}
                    naZatvaranje={(id) => …} />

   `poruke` je niz `{ id, vrsta: 'uspeh'|'greska'|'upozorenje', tekst }`.
   Same nestaju posle `trajanje` (podrazumevano 5 s); klikom se sklanjaju
   ranije. Greške se NE gase same — one traže da ih neko pročita.
*/
export class Obavestenja extends Component {
    constructor(props) {
        super(props);
        this.tajmeri = {};
    }

    componentDidUpdate() { this.zakaziGasenje(); }
    componentDidMount() { this.zakaziGasenje(); }

    componentWillUnmount() {
        Object.keys(this.tajmeri).forEach((k) => clearTimeout(this.tajmeri[k]));
    }

    zakaziGasenje() {
        (this.props.poruke || []).forEach((p) => {
            if (this.tajmeri[p.id]) return;
            if (p.vrsta === 'greska') return;   // greška ostaje dok se ne sklo­ni
            this.tajmeri[p.id] = setTimeout(() => {
                delete this.tajmeri[p.id];
                this.props.naZatvaranje && this.props.naZatvaranje(p.id);
            }, this.props.trajanje || 5000);
        });
    }

    render() {
        const poruke = this.props.poruke || [];
        if (!poruke.length) return null;
        const l = this.props.lang;

        return (
            <div className="z-obavestenja" role="status" aria-live="polite">
                {poruke.map((p) => (
                    <div key={p.id} className={'z-obavestenje z-obavestenje--' + (p.vrsta || 'uspeh')}>
                        <span className="z-obavestenje__tekst">{p.tekst}</span>
                        <button
                            type="button"
                            className="z-obavestenje__zatvori"
                            aria-label={'Zatvori'.translate(l)}
                            onClick={() => this.props.naZatvaranje && this.props.naZatvaranje(p.id)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        );
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRAZNO STANJE
   ═══════════════════════════════════════════════════════════════════════════
   Ikonica, rečenica i radnja — nikad broj `0`, koji je do sada ispisivao
   obrazac `items.length && items.map(...)`.

   `Tabela` ovo koristi sama kad joj je spisak prazan; ovde stoji izdvojeno za
   ekrane koji nisu tabela.
*/
export function Prazno({ lang, znak, naslov, tekst, radnja }) {
    return (
        <div className="z-prazno">
            <span className="z-prazno__znak" aria-hidden="true">{znak || '—'}</span>
            <h2 className="z-prazno__naslov">{(naslov || 'Nema zapisa').translate(lang)}</h2>
            {tekst ? <p className="z-prazno__tekst">{tekst.translate(lang)}</p> : null}
            {radnja ? <div className="z-prazno__radnje">{radnja}</div> : null}
        </div>
    );
}

/*
 * Sitna pomoć: držanje obaveštenja u stanju ekrana bez ponavljanja istog koda.
 *
 *     this.poruke = napraviPoruke(this);   // u konstruktoru
 *     this.poruke.dodaj('uspeh', 'Sačuvano.');
 */
export function napraviPoruke(komponenta, poljeStanja = 'poruke') {
    let brojac = 0;
    if (!komponenta.state) komponenta.state = {};
    if (!komponenta.state[poljeStanja]) komponenta.state[poljeStanja] = [];

    return {
        dodaj(vrsta, tekst) {
            const id = 'p' + (++brojac) + '-' + Date.now();
            komponenta.setState((s) => ({
                [poljeStanja]: (s[poljeStanja] || []).concat({ id, vrsta, tekst }),
            }));
            return id;
        },
        skloni(id) {
            komponenta.setState((s) => ({
                [poljeStanja]: (s[poljeStanja] || []).filter((p) => p.id !== id),
            }));
        },
    };
}

export default { Potvrda, Obavestenja, Prazno, napraviPoruke };
