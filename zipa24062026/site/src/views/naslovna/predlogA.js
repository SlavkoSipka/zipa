import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';
import Isvg from 'react-inlinesvg';

import infoIcon from '../../assets/svg/info.svg';
import { PHOTOS_ENDPOINT } from '../../constants';

/**
 * Naslovna strana — predlog A.
 *
 * Po uzoru na Pixsell, uz izmene koje je klijent tražio: mozaik je tri sa tri,
 * sve pločice iste veličine (velika fotografija je izbačena), sa vidnim
 * razmakom između njih. Ispod idu izdvojene kategorije, pa ručno izabrane
 * fotografije, reklama i video u poslednjem redu.
 */

const slikaUrl = (putanja, sirina = '350x') =>
    putanja ? `${PHOTOS_ENDPOINT}/photos/${sirina}/${putanja}` : null;

const datum = (vreme) => {
    if (!vreme) return '';
    const d = new Date(vreme * 1000);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`;
};


/*
 * Kuda vodi izdvojena stavka.
 *
 * Ako pokazuje na kategoriju, otvara se prikaz pojedinačnih fotografija —
 * upravo onako kako je klijent pokazao na Pixsell primeru: uđeš u grupu i
 * vidiš snimke, ne spisak galerija. Veza ka jednoj galeriji ostaje kakva jeste.
 */
const odredisteIzdvojenog = (veza) => {
    const v = veza || '/galerije';
    if (v.indexOf('/galerije') === 0 && v.indexOf('category=') !== -1 && v.indexOf('view=') === -1) {
        return v + (v.indexOf('?') !== -1 ? '&' : '?') + 'view=photos';
    }
    return v;
};

class PredlogA extends Component {

    plocica(g, kljuc) {
        if (!g) return null;

        const lang = this.props.lang;
        const naziv = Object.translate(g, 'name', lang);
        const alias = Object.translate(g, 'alias', lang);
        const slika = g.photos && g.photos[0] && g.photos[0].image;
        const broj = g.photosCount !== undefined ? g.photosCount : (g.photos && g.photos.length);

        return (
            <Link key={kljuc} to={`/galerija/${alias}/${g._id}`} className="plocica">
                <div className="slika">
                    {slika ? <img src={slikaUrl(slika, '700x')} alt={naziv} loading="lazy" /> : null}
                    {g.categoryName ? (
                        <span className="oznaka">{Object.translate(g, 'categoryName', lang)}</span>
                    ) : null}
                    <div className="preko">
                        <h4>{naziv}</h4>
                        <p className="meta">
                            {g.location ? <span>{g.location}</span> : null}
                            <span>{datum(g.date)}</span>
                            {broj ? <span>{broj} {'fotografija'.translate(lang)}</span> : null}
                        </p>
                    </div>
                </div>
            </Link>
        );
    }

    render() {
        const lang = this.props.lang;
        const podesavanja = this.props.settings || {};

        // Devet najnovijih — tri reda po tri, sve iste veličine.
        const najnovije = (this.props.latest || []).slice(0, 9);

        const kategorije = (this.props.homeCategories || [])
            .filter((k) => (k.photosCount !== undefined ? k.photosCount : (k.photos && k.photos.length)))
            .slice()
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        return (
            <div className="naslovna-a">

                {(this.props.announcements || []).map((item, idx) => (
                    <Container key={idx}>
                        <Link to={`/najave/${item._id}`}>
                            <div className="alert">
                                <Isvg src={infoIcon} /> {Object.translate(item, 'content', lang)}
                            </div>
                        </Link>
                    </Container>
                ))}

                {/* ── Mozaik tri sa tri ─────────────────────────────────── */}
                <section className="odeljak">
                    <Container>
                        <div className="naslov-odeljka">
                            <h3>{'Najnovije objave'.translate(lang)}</h3>
                            <Link to="/galerije">{'Sve galerije'.translate(lang)} &rarr;</Link>
                        </div>
                        <div className="mozaik">
                            {najnovije.map((g, i) => this.plocica(g, `n${i}`))}
                        </div>
                    </Container>
                </section>

                {/* ── Ručno izabrane fotografije ────────────────────────── */}
                {this.props.izdvojeno && this.props.izdvojeno.length ? (
                    <section className="odeljak">
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{podesavanja.izdvojenoNaslov || 'Izdvajamo'}</h3>
                            </div>
                            <div className="izabrane">
                                {this.props.izdvojeno.slice(0, 3).map((s, i) => {
                                    const naslov = Object.translate(s, 'title', lang) || '';
                                    return (
                                        <Link key={i} to={odredisteIzdvojenog(s.link)} className="plocica izabrana">
                                            <div className="slika">
                                                {s.image ? <img src={s.image} alt={naslov} loading="lazy" /> : null}
                                                <div className="preko">
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

                {/* ── Izdvojene kategorije ──────────────────────────────── */}
                {kategorije.length ? (
                    <section className="odeljak">
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{'Izdvojene kategorije'.translate(lang)}</h3>
                                <Link to="/galerije">{'Sve kategorije'.translate(lang)} &rarr;</Link>
                            </div>
                            <div className="kategorije">
                                {kategorije.slice(0, 4).map((k, i) => {
                                    const prva = k.photos && k.photos[0];
                                    const slika = prva && prva.photos && prva.photos[0] && prva.photos[0].image;
                                    return (
                                        <Link
                                            key={k._id || i}
                                            to={`/galerije?category=${k.alias && k.alias.ba}`}
                                            className="plocica kategorija"
                                        >
                                            <div className="slika">
                                                {slika ? <img src={slikaUrl(slika, '700x')} alt="" loading="lazy" /> : null}
                                                <div className="preko">
                                                    <h4>{Object.translate(k, 'name', lang)}</h4>
                                                    <p className="meta">
                                                        <span>{(k.photosCount || 0).toLocaleString('sr-RS')} {'fotografija'.translate(lang)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </Container>
                    </section>
                ) : null}

                {/* ── Reklama ───────────────────────────────────────────── */}
                {this.props.banners && this.props.banners[0] && this.props.banners[0].images ? (
                    <section className="odeljak reklama">
                        <Container>
                            <div className="mesto-reklame">
                                {this.props.banners[0].images.map((b, bi) => (
                                    <a key={bi} href={b.link} target="_blank" rel="noopener noreferrer"
                                       onClick={() => this.props.bannerClick && this.props.bannerClick(b.link)}>
                                        <img src={b.image} alt="" />
                                    </a>
                                ))}
                            </div>
                        </Container>
                    </section>
                ) : null}

                {/* ── Video u poslednjem redu ───────────────────────────── */}
                {this.props.videos && this.props.videos.length ? (
                    <section className="odeljak video">
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{'Video'.translate(lang)}</h3>
                            </div>
                            <div className="mreza-video">
                                {this.props.videos.slice(0, 4).map((v, i) => {
                                    const naslovVidea = Object.translate(v, 'title', lang) || '';
                                    return (
                                        <a key={i} href={v.link} target="_blank" rel="noopener noreferrer" className="plocica">
                                            <div className="slika">
                                                {v.thumbnail ? <img src={v.thumbnail} alt={naslovVidea} loading="lazy" /> : null}
                                                <span className="igraj">&#9654;</span>
                                                <div className="preko">
                                                    <h4>{naslovVidea}</h4>
                                                </div>
                                            </div>
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

export default PredlogA;
