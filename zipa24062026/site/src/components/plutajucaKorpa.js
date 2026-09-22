import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';

import korpaIkona from '../assets/svg/cart.svg';

/*
 * Plutajuća korpa — gornji DESNI ugao (2026-09-22), na svakoj strani, čim u
 * korpi nešto ima i zaglavlje (sa svojom korpom) ode van kadra.
 *
 * Skrol prati OVA komponenta, u svom stanju. Ranije ga je pratio `App.js`, pa
 * je svaki prelazak granice osvežavao celu aplikaciju — a strane na osvežavanje
 * vraćaju skrol na vrh, pa se ispod 160px nije moglo skrolovati.
 */
class PlutajucaKorpa extends Component {
    state = { vidljiva: false };

    componentDidMount() {
        window.addEventListener('scroll', this.naSkrol, { passive: true });
        this.naSkrol();
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.naSkrol);
    }

    naSkrol = () => {
        const vidljiva = (window.pageYOffset || document.documentElement.scrollTop) > 160;
        if (vidljiva !== this.state.vidljiva) this.setState({ vidljiva });
    };

    render() {
        const { broj, lang } = this.props;
        if (!broj || !this.state.vidljiva) return null;

        return (
            <Link to="/cart" className="z-plutajuca-korpa"
                  aria-label={`${'Korpa'.translate(lang)}: ${broj}`}>
                <Isvg src={korpaIkona} />
                <span className="z-plutajuca-korpa__broj">{broj}</span>
            </Link>
        );
    }
}

export default PlutajucaKorpa;
