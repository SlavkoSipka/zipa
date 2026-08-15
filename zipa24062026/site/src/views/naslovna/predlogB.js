import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';
import Isvg from 'react-inlinesvg';

import infoIcon from '../../assets/svg/info.svg';
import { PHOTOS_ENDPOINT } from '../../constants';

/**
 * Naslovna strana — predlog B.
 *
 * Raspored je onakav kakav je klijent opisao u dopisu: gornja plava traka,
 * naslovni blok od pet galerija (dve krupnije desno, tri ispod), pa odeljci
 * po kategorijama sa po pet galerija u redu.
 *
 * Sav sadržaj dolazi iz istih podataka koje naslovna već učitava, pa
 * prebacivanje izgleda ne povlači nijedan dodatni upit.
 */

// Odakle se povlače pregledne fotografije (350 tačaka je dovoljno za sličicu).
const slikaUrl = (putanja, sirina = '350x') =>
    putanja ? `${PHOTOS_ENDPOINT}/photos/${sirina}/${putanja}` : null;

const datum = (vreme) => {
    if (!vreme) return '';
    const d = new Date(vreme * 1000);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`;
};

class PredlogB extends Component {

    /* Kartica galerije. `krupna` se koristi u naslovnom bloku. */
    kartica(g, kljuc, krupna = false) {
        if (!g) return null;

        const lang = this.props.lang;
        const naziv = Object.translate(g, 'name', lang);
        const alias = Object.translate(g, 'alias', lang);
        const slika = g.photos && g.photos[0] && g.photos[0].image;
        const broj = g.photosCount !== undefined ? g.photosCount : (g.photos && g.photos.length);

        return (
            <Link
                key={kljuc}
                to={`/galerija/${g.userAlias}/${alias}/${g._id}`}
                className={krupna ? 'kartica krupna' : 'kartica'}
            >
                <div className="slika">
                    {slika ? <img src={slikaUrl(slika, krupna ? '700x' : '350x')} alt={naziv} loading="lazy" /> : null}
                    {g.categoryName ? (
                        <span className="znacka">{Object.translate(g, 'categoryName', lang)}</span>
                    ) : null}
                </div>
                <div className="telo">
                    <h4>{naziv}</h4>
                    <p className="meta">
                        {g.location ? <span>{g.location}</span> : null}
                        <span>{datum(g.date)}</span>
                        {broj ? <span>{broj} {'fotografija'.translate(lang)}</span> : null}
                    </p>
                </div>
            </Link>
        );
    }

    render() {
        const lang = this.props.lang;
        const podesavanja = this.props.settings || {};

        // Kategorije idu redom koji je administrator zadao u administraciji.
        const kategorije = (this.props.homeCategories || [])
            .filter((k) => (k.photosCount !== undefined ? k.photosCount : (k.photos && k.photos.length)))
            .slice()
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        // Naslovni blok: pet najnovijih galerija — dve krupnije, tri ispod.
        const najnovije = (this.props.latest || []).slice(0, 5);

        return (
            <div className="naslovna-b">

                {/* Najave stoje iznad svega, kao i do sada. */}
                {(this.props.announcements || []).map((item, idx) => (
                    <Container key={idx}>
                        <Link to={`/najave/${item._id}`}>
                            <div className="alert">
                                <Isvg src={infoIcon} /> {Object.translate(item, 'content', lang)}
                            </div>
                        </Link>
                    </Container>
                ))}

                {/* ── Naslovni blok ─────────────────────────────────────────
                    Dve krupnije galerije gore, tri ispod — sve u visini
                    ekrana, bez pomeranja, kako je traženo.                */}
                <section className="odeljak naslovni">
                    <Container>
                        <div className="naslov-odeljka">
                            <h3>{'Najnovije'.translate(lang)}</h3>
                            <Link to="/galerije">{'Sve galerije'.translate(lang)} &rarr;</Link>
                        </div>

                        <div className="mreza-naslovna">
                            {najnovije.slice(0, 2).map((g, i) => this.kartica(g, `k${i}`, true))}
                        </div>
                        <div className="mreza-naslovna tri">
                            {najnovije.slice(2, 5).map((g, i) => this.kartica(g, `m${i}`))}
                        </div>
                    </Container>
                </section>

                {/* ── Izdvojeno ─────────────────────────────────────────────
                    Dve fotografije u dva reda, naslov naglašen; galerije se
                    biraju ručno u administraciji (oznaka „Izdvojeno").     */}
                {this.props.izdvojeno && this.props.izdvojeno.length ? (
                    <section className="odeljak izdvojeno">
                        <Container>
                            <div className="naslov-odeljka veliki">
                                <h3>{(podesavanja.izdvojenoNaslov || 'Izdvajamo').translate(lang)}</h3>
                            </div>
                            <div className="mreza-izdvojeno">
                                {this.props.izdvojeno.slice(0, 4).map((g, i) => this.kartica(g, `i${i}`, true))}
                            </div>
                        </Container>
                    </section>
                ) : null}

                {/* ── Odeljci po kategorijama ───────────────────────────────
                    Pet galerija u redu; koliko redova ima kategorija zadaje
                    se u administraciji (jedan ili dva).                    */}
                {kategorije.map((k, idx) => {
                    const redova = k.homeRows === 2 ? 2 : 1;
                    const galerije = (k.photos || []).slice(0, redova * 5);
                    if (!galerije.length) return null;

                    return (
                        <React.Fragment key={k._id || idx}>
                            <section className="odeljak">
                                <Container>
                                    <div className="naslov-odeljka">
                                        <h3>{Object.translate(k, 'name', lang)}</h3>
                                        <span className="broj">
                                            {(k.photosCount || 0).toLocaleString('sr-RS')} {'fotografija'.translate(lang)}
                                        </span>
                                        <Link to={`/galerije?category=${k.alias && k.alias.ba}`}>
                                            {'Sve'.translate(lang)} &rarr;
                                        </Link>
                                    </div>
                                    <div className="mreza-pet">
                                        {galerije.map((g, i) => this.kartica(g, `${idx}-${i}`))}
                                    </div>
                                </Container>
                            </section>

                            {/* Reklama posle svake druge kategorije. Širina je
                                stalna, visina slobodna — kako je traženo. */}
                            {idx % 2 === 1 && this.props.banners && this.props.banners[Math.floor(idx / 2)] ? (
                                <section className="odeljak reklama">
                                    <Container>
                                        <div className="mesto-reklame">
                                            {this.props.banners[Math.floor(idx / 2)].images.map((b, bi) => (
                                                <a key={bi} href={b.link} target="_blank" rel="noopener noreferrer"
                                                   onClick={() => this.props.bannerClick && this.props.bannerClick(b.link)}>
                                                    <img src={b.image} alt="" />
                                                </a>
                                            ))}
                                        </div>
                                    </Container>
                                </section>
                            ) : null}
                        </React.Fragment>
                    );
                })}

                {/* ── Video ────────────────────────────────────────────────
                    Na kraju strane, kako je traženo. Snimci se povlače sa
                    YouTube kanala agencije.                               */}
                {this.props.videos && this.props.videos.length ? (
                    <section className="odeljak video">
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{'Video'.translate(lang)}</h3>
                            </div>
                            <div className="mreza-video">
                                {this.props.videos.slice(0, 4).map((v, i) => (
                                    <a key={i} href={v.link} target="_blank" rel="noopener noreferrer" className="kartica">
                                        <div className="slika">
                                            <img src={v.thumbnail} alt={v.title} loading="lazy" />
                                            <span className="igraj">▶</span>
                                        </div>
                                        <div className="telo"><h4>{v.title}</h4></div>
                                    </a>
                                ))}
                            </div>
                        </Container>
                    </section>
                ) : null}

            </div>
        );
    }
}

export default PredlogB;
