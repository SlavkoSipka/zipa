import React, { Component } from 'react';

/*
 * TRAKA KOJA SE SAMA POMERA
 *
 * Omotač oko `.traka` iz predloga C. Radi dve stvari:
 *
 * 1. POMERA SE SAMA — na svakih `razmak` milisekundi klizne za TAČNO JEDNU
 *    karticu ulevo, glatko. Kad dođe do kraja, vraća se na početak.
 *
 * 2. NIKAD NE STAJE NA POLA KARTICE — korak se meri iz same kartice
 *    (`offsetWidth` + razmak između), pa se ne pogađa. Uz
 *    `scroll-snap-type: x mandatory` u SCSS-u, i ručno prevlačenje staje na
 *    ivicu kartice.
 *
 * Staje kad treba: dok je miš iznad trake, dok je fokus u njoj (tastatura),
 * dok korisnik prevlači prstom, i dok je kartica pregledača u pozadini.
 * Poštuje `prefers-reduced-motion` — tada se ne pomera uopšte, ni glatko ni
 * naglo, i traka ostaje obična traka koja se prevlači rukom.
 */

const RAZMAK = 4500;   // pauza između koraka
const MIRUJ  = 6000;   // koliko se čeka posle ručnog dodira pre nastavka

class Traka extends Component {
    constructor(props) {
        super(props);
        this.okvir = null;
        this.otkucaj = null;
        this.mirovanje = null;
        this.stoji = false;
    }

    componentDidMount() {
        if (typeof window === 'undefined') return;

        // Ko je tražio manje pokreta, ne dobija nijedan.
        const upit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
        if (upit && upit.matches) return;

        this.pokreni();
        document.addEventListener('visibilitychange', this.naVidljivost);
    }

    componentWillUnmount() {
        this.zaustavi();
        clearTimeout(this.mirovanje);
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.naVidljivost);
        }
    }

    pokreni = () => {
        clearInterval(this.otkucaj);
        this.otkucaj = setInterval(this.korak, RAZMAK);
    };

    zaustavi = () => {
        clearInterval(this.otkucaj);
        this.otkucaj = null;
    };

    naVidljivost = () => {
        if (document.hidden) this.zaustavi();
        else if (!this.stoji) this.pokreni();
    };

    // Ručni dodir ima prednost: traka miruje dok korisnik gleda gde je stao.
    odmori = () => {
        this.zaustavi();
        clearTimeout(this.mirovanje);
        this.mirovanje = setTimeout(() => {
            if (!this.stoji) this.pokreni();
        }, MIRUJ);
    };

    zadrzi = () => {
        this.stoji = true;
        this.zaustavi();
    };

    pusti = () => {
        this.stoji = false;
        clearTimeout(this.mirovanje);
        this.pokreni();
    };

    /*
     * Jedan korak = širina kartice + razmak između dve kartice.
     *
     * Razmak se čita iz stvarnog razmaka između prve dve kartice, a ne iz
     * `gap`-a — tako radi i ako se `gap` jednog dana promeni u SCSS-u.
     */
    korak = () => {
        const t = this.okvir;
        if (!t || !t.children.length) return;

        const prva = t.children[0];
        const druga = t.children[1];
        const sirina = prva.offsetWidth;
        const razmak = druga ? (druga.offsetLeft - prva.offsetLeft - sirina) : 0;
        const korak = sirina + razmak;
        if (korak <= 0) return;

        const kraj = t.scrollWidth - t.clientWidth;

        // Dva piksela tolerancije — zaokruživanje pri uvećanju strane.
        const naKraju = t.scrollLeft >= kraj - 2;
        const cilj = naKraju ? 0 : Math.min(t.scrollLeft + korak, kraj);

        if (t.scrollTo) t.scrollTo({ left: cilj, behavior: 'smooth' });
        else t.scrollLeft = cilj;
    };

    render() {
        return (
            <div
                className={'traka' + (this.props.klasa ? ' ' + this.props.klasa : '')}
                ref={(n) => this.okvir = n}
                onMouseEnter={this.zadrzi}
                onMouseLeave={this.pusti}
                onFocus={this.zadrzi}
                onBlur={this.pusti}
                onTouchStart={this.odmori}
                onWheel={this.odmori}
            >
                {this.props.children}
            </div>
        );
    }
}

export default Traka;
