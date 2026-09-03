import React, { Component } from 'react';

/**
 * Iskačuća reklama na telefonu.
 *
 * Uključuje se iz administracije i prikazuje samo na telefonu. Namerno je
 * uzdržana: pojavljuje se tek nakon nekoliko sekundi, ima jasno dugme za
 * zatvaranje i ne vraća se do kraja posete — reklama koja se stalno otvara
 * najbrže otera posetioca.
 */
/*
 * Da li se ovom slikom uopšte može nešto prikazati.
 *
 * U bazi postoje baneri kojima u polju `image` stoji doslovno „Error" —
 * ostatak starijeg slanja, kad se u zapis upisivao tekst neuspelog odgovora
 * umesto adrese. Jedan takav je označen kao iskačuća reklama, pa je na
 * telefonu ekran POTAMNIO, a u sredini je stajao prazan bijeli okvir visine
 * nula: dugme za zatvaranje je bilo unutar njega i `overflow: hidden` ga je
 * odsekao. Posetilac je ostajao na zatamnjenom ekranu bez ijednog dugmeta.
 *
 * Zato se ovde traži adresa koja uopšte može da bude slika. Ako je nema,
 * reklame nema — bolje nijedna nego zaključan ekran.
 */
function upotrebljivaSlika(vrednost) {
    if (typeof vrednost !== 'string') return false;
    const v = vrednost.trim();
    if (!v) return false;
    return v.indexOf('http') === 0 || v.indexOf('/') === 0 || v.indexOf('data:image') === 0;
}

class IskacucaReklama extends Component {
    constructor(props) {
        super(props);
        this.state = { otvorena: false };
    }

    componentDidMount() {
        this.mozdaZakazi();
        if (typeof document !== 'undefined') {
            document.addEventListener('keydown', this.naTaster);
        }
    }

    // Escape zatvara, kao i svaki drugi prozor na sajtu.
    naTaster = (e) => {
        if (e.key === 'Escape' && this.state.otvorena) this.zatvori();
    };

    /*
     * Podešavanja i baneri se učitavaju tek posle postavljanja komponente, pa
     * provera mora da se ponovi kad podaci stignu — na samom postavljanju su
     * još prazni i reklama se nikada ne bi zakazala.
     */
    componentDidUpdate() {
        this.mozdaZakazi();
    }

    mozdaZakazi() {
        if (typeof window === 'undefined') return;
        if (this.zakazano) return;

        // Samo na telefonu i samo ako je uključena u podešavanjima.
        if (window.innerWidth > 767) return;
        if (!this.props.ukljucena || !this.props.baner) return;

        // Bez upotrebljive slike se ne zakazuje ništa.
        const prva = this.props.baner.images && this.props.baner.images[0];
        if (!prva || !upotrebljivaSlika(prva.image)) return;

        // Ako je posetilac već zatvorio u ovoj poseti, ne prikazujemo ponovo.
        try {
            if (sessionStorage.getItem('reklamaZatvorena') === '1') return;
        } catch (e) { /* privatni režim — nastavljamo bez pamćenja */ }

        this.zakazano = true;
        this.tajmer = setTimeout(() => this.setState({ otvorena: true }), 4000);
    }

    componentWillUnmount() {
        if (this.tajmer) clearTimeout(this.tajmer);
        if (typeof document !== 'undefined') {
            document.removeEventListener('keydown', this.naTaster);
        }
    }

    zatvori = () => {
        this.setState({ otvorena: false });
        try { sessionStorage.setItem('reklamaZatvorena', '1'); } catch (e) { }
    };

    render() {
        const { otvorena } = this.state;
        const baner = this.props.baner;
        if (!otvorena || !baner) return null;

        const slika = baner.images && baner.images[0];
        if (!slika || !upotrebljivaSlika(slika.image)) return null;

        return (
            <div className="iskacuca-reklama" role="dialog" aria-label="Reklama">
                <div className="zavesa" onClick={this.zatvori}></div>
                <div className="okvir">
                    <button type="button" className="zatvori" onClick={this.zatvori} aria-label="Zatvori">
                        &times;
                    </button>
                    <a
                        href={slika.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                            if (this.props.bannerClick) this.props.bannerClick(slika.link);
                            this.zatvori();
                        }}
                    >
                        {/* Ako slika ne stigne, reklama se sklanja sama — prazan
                            zatamnjen ekran je gori od nikakve reklame. */}
                        <img src={slika.image} alt="" onError={this.zatvori} />
                    </a>
                </div>
            </div>
        );
    }
}

export default IskacucaReklama;
