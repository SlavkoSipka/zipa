import React, { Component } from 'react';

/**
 * Iskačuća reklama na telefonu.
 *
 * Uključuje se iz administracije i prikazuje samo na telefonu. Namerno je
 * uzdržana: pojavljuje se tek nakon nekoliko sekundi, ima jasno dugme za
 * zatvaranje i ne vraća se do kraja posete — reklama koja se stalno otvara
 * najbrže otera posetioca.
 */
class IskacucaReklama extends Component {
    constructor(props) {
        super(props);
        this.state = { otvorena: false };
    }

    componentDidMount() {
        this.mozdaZakazi();
    }

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

        // Ako je posetilac već zatvorio u ovoj poseti, ne prikazujemo ponovo.
        try {
            if (sessionStorage.getItem('reklamaZatvorena') === '1') return;
        } catch (e) { /* privatni režim — nastavljamo bez pamćenja */ }

        this.zakazano = true;
        this.tajmer = setTimeout(() => this.setState({ otvorena: true }), 4000);
    }

    componentWillUnmount() {
        if (this.tajmer) clearTimeout(this.tajmer);
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
        if (!slika) return null;

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
                        <img src={slika.image} alt="" />
                    </a>
                </div>
            </div>
        );
    }
}

export default IskacucaReklama;
