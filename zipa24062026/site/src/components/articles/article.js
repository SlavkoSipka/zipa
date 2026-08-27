import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';

import imagesCount from '../../assets/svg/images-count.svg';
import moment from 'moment';
import { PHOTOS_ENDPOINT } from '../../constants';

/*
 * KARTICA GALERIJE
 *
 * Jedna kartica za sva mesta — zamenjuje šest nezavisnih verzija koje su se
 * razišle. Propovi su NEPROMENJENI, pa se pozivi sa `/galerije`, naslovne,
 * profila fotografa i prodavnice ne diraju.
 *
 * Varijante (`homeArticle`, `listView`, `bigView`, `imageArticle`) i dalje
 * stižu kao propovi i i dalje postavljaju stare klase na korenu, jer se
 * roditeljske mreže na njih oslanjaju. Unutrašnjost je nova.
 *
 * Izgled je u `scss/_kartica.scss`.
 */

/*
 * Kataloški broj — ZP-GGGG-MMDD-XXXX.
 *
 * Izvodi se u prikazu, ne čuva se u bazi. Bez datuma nema broja: 66 galerija
 * u arhivi nema datum (`docs/galerije-bez-datuma.md`) i za njih se ovaj red
 * jednostavno ne iscrtava, umesto da se izmišlja nešto lažno.
 */
export const kataloskiBroj = (datum, id) => {
    if (!datum) return null;

    const d = moment.unix(datum);
    if (!d.isValid()) return null;

    const rep = String(id || '').slice(-4).toUpperCase();
    if (!rep) return null;

    return `ZP-${d.format('YYYY')}-${d.format('MMDD')}-${rep}`;
};

class Article extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    render() {
        const p = this.props;

        // Stare klase ostaju na korenu — roditeljske mreže ih koriste.
        const stare = `${p.bigView ? 'big-view-article' : ''} ${p.listView ? 'list-view-article' : ''} ${p.homeArticle ? 'home-article' : ''} ${p.imageArticle ? 'image-article' : ''}`;

        const varijanta = p.listView ? ' z-kartica-galerije--spisak'
            : (p.bigView ? ' z-kartica-galerije--veliko' : '');

        const putanja = `/galerija/${p.alias}/${p._id}`;

        // Projekat generiše dve veličine — 350x i 700x. Obe idu u `srcset`,
        // pa pregledač bira po stvarnoj širini kartice.
        // `encodeURI` — imena datoteka u arhivi imaju razmake, a nekodiran
        // razmak obara ceo `srcset` (vidi napomenu u `predlogA.js`).
        const slika = encodeURI(p.image || '');
        const mala = `${PHOTOS_ENDPOINT}/photos/350x/${slika}`;
        const velika = `${PHOTOS_ENDPOINT}/photos/700x/${slika}`;

        const naslov = p.name && p.name.length > (p.maxNameLength || 120)
            ? p.name.substring(0, p.maxNameLength || 120) + '…'
            : p.name;

        return (
            <article className={`${stare} z-kartica-galerije${varijanta}`}>

                <Link to={putanja} className="z-kartica-galerije__slika" tabIndex="-1" aria-hidden="true">
                    {p.image ?
                        <img
                            src={mala}
                            srcSet={`${mala} 350w, ${velika} 700w`}
                            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 350px"
                            alt=""
                            loading="lazy"
                            decoding="async"
                        />
                        : null}

                    {/* Oznake stoje u UGLOVIMA — žig je u srednjoj trećini
                        kadra, pa se ne sudaraju. */}
                    {p.categoryName ?
                        <span className="z-kartica-galerije__kategorija">{p.categoryName}</span>
                        : null}

                    {p.imagesCount !== undefined && p.imagesCount !== null ?
                        <span className="z-kartica-galerije__broj">
                            <Isvg src={imagesCount} />
                            {p.imagesCount}
                        </span>
                        : null}
                </Link>

                {/* Dva reda, ne tri: naslov, pa mesto i datum. Sve ostalo je
                    u mreži šum — kataloški broj je prešao na stranu galerije,
                    gde i služi (navođenje izvora). */}
                <div className="z-kartica-galerije__telo">
                    <h3 className="z-kartica-galerije__naslov">
                        <Link to={putanja}>{naslov}</Link>
                    </h3>

                    <p className="z-kartica-galerije__mesto">
                        {p.location ? p.location : null}
                        {p.location && p.published ? ' · ' : null}
                        {p.published ? moment.unix(p.published).format('DD.MM.YYYY.') : null}
                    </p>
                </div>
            </article>
        );
    }
}

export default Article;
