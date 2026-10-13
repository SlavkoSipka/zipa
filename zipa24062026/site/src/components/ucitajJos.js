import React, { Component } from 'react';

/*
 * PRIKAŽI JOŠ — listanje na dole uz zadržane strane (2026-10-14).
 *
 * Na /galerije i /video sledeća strana se sama doda ispod kad posetilac
 * priđe dnu spiska. Posle AUTOMATSKI_ZAREDOM takvih dodavanja staje i čeka
 * klik na „Prikaži još" — inače se do podnožja nikad ne bi stiglo, a arhiva
 * ima skoro deset hiljada galerija. Klik vraća automatsko dodavanje.
 *
 * Podela na strane ostaje ispod spiska, za skok na određenu stranu i za
 * adresu koja se može poslati. Šta je „sledeća strana" i kako se dovlači
 * zna roditelj (`naUcitaj`); ova komponenta samo javlja kada.
 *
 * Roditelj je iscrtava sa `key` vezanim za adresu, pa se brojač vraća na
 * nulu kad se promeni filter ili strana.
 */
export const AUTOMATSKI_ZAREDOM = 4;

class UcitajJos extends Component {
    constructor(props) {
        super(props);
        this.state = { zaredom: 0 };
        this.mesto = React.createRef();
    }

    componentDidMount() {
        if (typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') return;
        // Počinje 600px pre dna, da se sledeća strana učita pre nego što posetilac stigne do kraja.
        this.posmatrac = new window.IntersectionObserver((unosi) => {
            if (unosi.some((u) => u.isIntersecting)) this.automatski();
        }, { rootMargin: '0px 0px 600px 0px' });
        if (this.mesto.current) this.posmatrac.observe(this.mesto.current);
    }

    componentDidUpdate(prev) {
        // Ako je i posle dodate strane oznaka i dalje u kadru, posmatrač se ne
        // javlja sam od sebe — ponovno posmatranje ga natera da proveri.
        if (prev.ucitava && !this.props.ucitava && this.posmatrac && this.mesto.current) {
            this.posmatrac.unobserve(this.mesto.current);
            this.posmatrac.observe(this.mesto.current);
        }
    }

    componentWillUnmount() {
        if (this.posmatrac) this.posmatrac.disconnect();
    }

    automatski = () => {
        const { imaJos, ucitava, naUcitaj } = this.props;
        if (!imaJos || ucitava || this.state.zaredom >= AUTOMATSKI_ZAREDOM) return;
        this.setState((s) => ({ zaredom: s.zaredom + 1 }));
        naUcitaj();
    };

    klik = () => {
        const { imaJos, ucitava, naUcitaj } = this.props;
        if (!imaJos || ucitava) return;
        this.setState({ zaredom: 0 });
        naUcitaj();
    };

    render() {
        const { imaJos, ucitava, lang } = this.props;
        // Omotač stoji uvek, da posmatrač ima šta da prati i kad dugmeta nema.
        return (
            <div className="z-ucitaj-jos" ref={this.mesto}>
                {imaJos ? (
                    <button type="button" className="z-dugme z-dugme--sporedno z-dugme--veliko z-ucitaj-jos__dugme"
                            disabled={ucitava} aria-busy={ucitava ? 'true' : 'false'} onClick={this.klik}>
                        {ucitava ? 'Učitavanje…'.translate(lang) : 'Prikaži još'.translate(lang)}
                    </button>
                ) : null}
            </div>
        );
    }
}

export default UcitajJos;
