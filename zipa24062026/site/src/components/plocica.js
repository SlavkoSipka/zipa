import React from 'react';
import { Link } from 'react-router-dom';

import { PHOTOS_ENDPOINT } from '../constants';

/*
 * Pločica kao na Pixsellu — naslovne A i C (2026-09-22).
 *
 * Fotografija bez ičega preko, a na prelaz mišem zastor sa datumom gore i
 * naslovom dole. Na ekranu bez miša naslov stoji stalno, na blagom prelivu.
 * Izgled je u `_naslovnaA.scss` (grupa „MOZAIK I PLOČICE"), zajednički za A i C.
 */

const datum = (vreme) => {
    if (!vreme) return '';
    const d = new Date(vreme * 1000);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`;
};

export const Plocica = ({ putanja, slika, naslov, vreme, velika }) => (
    <Link to={putanja} className={'z-plocica' + (velika ? ' z-plocica--velika' : '')}>
        {slika ? <img src={slika} alt={naslov} loading="lazy" decoding="async" /> : null}
        <span className="z-plocica__preko">
            {vreme ? <span className="z-plocica__datum">{datum(vreme)}</span> : <span />}
            <span className="z-plocica__naslov">{naslov}</span>
        </span>
    </Link>
);

// Pločica za galeriju — prva fotografija, naziv i datum galerije.
export const PlocicaGalerije = ({ g, lang, velika }) => {
    const slika = g.photos && g.photos[0] && g.photos[0].image;
    return (
        <Plocica
            putanja={`/galerija/${Object.translate(g, 'alias', lang)}/${g._id}`}
            slika={slika ? `${PHOTOS_ENDPOINT}/photos/700x/${encodeURI(slika)}` : null}
            naslov={Object.translate(g, 'name', lang)}
            vreme={g.date}
            velika={velika}
        />
    );
};

export default Plocica;
