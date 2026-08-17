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

    /*
     * Kartica galerije, u dva oblika:
     *
     *   'preko'  — natpis leži na fotografiji, sa zatamnjenjem odozdo;
     *              koristi se u naslovnom bloku i u izdvojenom
     *   'ispod'  — natpis je ispod fotografije, u beloj kartici;
     *              koristi se u redovima po kategorijama
     *
     * Podela je iz predloga koji je klijent poslao: naslovni deo nosi
     * krupne fotografije preko kojih ide tekst, a niže se čitljivost
     * postiže belom karticom ispod snimka.
     */
    kartica(g, kljuc, oblik = 'ispod', velicina = 'mala') {
        if (!g) return null;

        const lang = this.props.lang;
        const naziv = Object.translate(g, 'name', lang);
        const alias = Object.translate(g, 'alias', lang);
        const slika = g.photos && g.photos[0] && g.photos[0].image;
        const broj = g.photosCount !== undefined ? g.photosCount : (g.photos && g.photos.length);
        const kategorija = g.categoryName ? Object.translate(g, 'categoryName', lang) : null;

        const podaci = (
            <p className="meta">
                {g.location ? <span>{g.location}</span> : null}
                <span>{datum(g.date)}</span>
                {broj ? <span>{broj} {'fotografija'.translate(lang)}</span> : null}
                {g.user ? <span>{g.user}</span> : null}
            </p>
        );

        return (
            <Link
                key={kljuc}
                to={`/galerija/${alias}/${g._id}`}
                className={`kartica ${oblik} ${velicina}`}
            >
                <div className="slika">
                    {slika ? (
                        <img
                            src={slikaUrl(slika, velicina === 'mala' ? '350x' : '700x')}
                            alt={naziv}
                            loading="lazy"
                        />
                    ) : null}

                    {kategorija ? <span className="znacka">{kategorija}</span> : null}

                    {oblik === 'preko' ? (
                        <div className="preko-teksta">
                            <h4>{naziv}</h4>
                            {podaci}
                        </div>
                    ) : null}
                </div>

                {oblik === 'ispod' ? (
                    <div className="telo">
                        <h4>{naziv}</h4>
                        {podaci}
                    </div>
                ) : null}
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

        // Naslovni blok: šest najnovijih — jedna krupna, dve uz nju, tri ispod.
        const najnovije = (this.props.latest || []).slice(0, 6);

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

                        {/* Jedna krupna levo, dve uz nju desno — pa tri ispod,
                            iste veličine kao one dve. Sve staje na ekran. */}
                        <div className="blok-naslovni">
                            <div className="glavna">
                                {this.kartica(najnovije[0], 'g0', 'preko', 'velika')}
                            </div>
                            <div className="uz-glavnu">
                                {najnovije.slice(1, 3).map((g, i) => this.kartica(g, `u${i}`, 'preko'))}
                            </div>
                        </div>

                        <div className="blok-tri">
                            {najnovije.slice(3, 6).map((g, i) => this.kartica(g, `t${i}`, 'preko'))}
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
                                <h3>{podesavanja.izdvojenoNaslov || 'Izdvajamo'}</h3>
                            </div>

                            {/* Dve u redu, dva reda. Naslov i fotografija se
                                biraju ručno u administraciji, a klik vodi na
                                galeriju ili kategoriju koju ste odredili. */}
                            <div className="mreza-izdvojeno">
                                {this.props.izdvojeno.slice(0, 4).map((s, i) => {
                                    const naslov = Object.translate(s, 'title', lang) || '';
                                    return (
                                        <Link key={i} to={s.link || '/galerije'} className="izdvojena">
                                            <div className="slika">
                                                {s.image ? <img src={s.image} alt={naslov} loading="lazy" /> : null}
                                                <div className="preko-teksta">
                                                    <h4>{naslov}</h4>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </Container>
                    </section>
                ) : null}

                {/* ── Odeljci po kategorijama ───────────────────────────────
                    Pet galerija u redu; koliko redova ima kategorija zadaje
                    se u administraciji (jedan ili dva).                    */}
                {kategorije.map((k, idx) => {
                    // Iz obrasca stiže kao tekst („1" ili „2"), iz baze kao broj.
                    const redova = Number(k.homeRows) === 2 ? 2 : 1;
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
                                {this.props.videos.slice(0, 4).map((v, i) => {
                                    // Naslov stiže u oba jezika, pa se mora prevesti
                                    // pre ispisa — inače React dobije objekat.
                                    const naslovVidea = Object.translate(v, 'title', lang) || '';
                                    return (
                                        <a key={i} href={v.link} target="_blank" rel="noopener noreferrer" className="kartica">
                                            <div className="slika">
                                                {v.thumbnail ? <img src={v.thumbnail} alt={naslovVidea} loading="lazy" /> : null}
                                                <span className="igraj">▶</span>
                                            </div>
                                            <div className="telo"><h4>{naslovVidea}</h4></div>
                                        </a>
                                    );
                                })}
                            </div>
                        </Container>
                    </section>
                ) : null}

            </div>
        );
    }
}

export default PredlogB;
