import React from 'react';
import Isvg from 'react-inlinesvg';

import znakZipa from '../assets/svg/logo.svg';

/*
 * IZVEŠTAJ ZA ŠTAMPU (2026-11-06) — statistika galerija i fotografa.
 *
 * `ZaglavljeStampe` je vrh izveštaja: ZIPA logo, naslov, period i datum
 * štampe. Na ekranu se vidi kao naslov strane; pri štampi je prvi red lista.
 *
 * `stampaj()` štampa SAMO izveštaj (`.z-stampa`), bez bočnog menija i
 * zaglavlja administracije: na `<body>` se za vreme štampe stavi klasa
 * `stampa-izvestaja`, koju čita `_print.scss`.
 */
export const danasno = () => new Date().toLocaleDateString('sr-RS');

export function stampaj() {
    if (typeof document === 'undefined') return;
    document.body.classList.add('stampa-izvestaja');
    const skini = () => {
        document.body.classList.remove('stampa-izvestaja');
        window.removeEventListener('afterprint', skini);
    };
    window.addEventListener('afterprint', skini);
    window.print();
    setTimeout(skini, 1000);
}

const ZaglavljeStampe = ({ naslov, podnaslov }) => (
    <header className="z-stampa__zaglavlje">
        <span className="z-stampa__logo" aria-label="ZIPA PHOTO"><Isvg src={znakZipa} /></span>
        <div className="z-stampa__naslovi">
            <h1 className="z-stampa__naslov">{naslov}</h1>
            {podnaslov ? <p className="z-stampa__podnaslov">{podnaslov}</p> : null}
        </div>
        <span className="z-stampa__datum">Odštampano: {danasno()}</span>
    </header>
);

export default ZaglavljeStampe;
