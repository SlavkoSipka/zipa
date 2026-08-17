import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';
import Isvg from 'react-inlinesvg';

import infoIcon from '../../assets/svg/info.svg';
import { PHOTOS_ENDPOINT } from '../../constants';

/**
 * Naslovna strana — predlog C.
 *
 * Po uzoru na AP Newsroom, ali sa dovoljno izmena da ne bude prepis: svetla
 * podloga i uzdržan izgled, a kategorije se ne slažu jedna ispod druge nego
 * se svaka pomera vodoravno. Tako na jednoj strani stane mnogo više galerija
 * nego u predlozima A i B, a strana ostaje kratka.
 *
 * Ako je predlog A mozaik a B naslovni blok sa odeljcima, C je pregled po
 * trakama — tri jasno različita pravca, da se ima između čega birati.
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

class PredlogC extends Component {

    kartica(g, kljuc) {
        if (!g) return null;

        const lang = this.props.lang;
        const naziv = Object.translate(g, 'name', lang);
        const alias = Object.translate(g, 'alias', lang);
        const slika = g.photos && g.photos[0] && g.photos[0].image;
        const broj = g.photosCount !== undefined ? g.photosCount : (g.photos && g.photos.length);

        return (
            <Link key={kljuc} to={`/galerija/${alias}/${g._id}`} className="kartica">
                <div className="slika">
                    {slika ? <img src={slikaUrl(slika)} alt={naziv} loading="lazy" /> : null}
                    {broj ? <span className="broj">{broj}</span> : null}
                </div>
                <div className="telo">
                    <h4>{naziv}</h4>
                    <p className="meta">
                        {g.location ? <span>{g.location}</span> : null}
                        <span>{datum(g.date)}</span>
                    </p>
                </div>
            </Link>
        );
    }

    render() {
        const lang = this.props.lang;
        const podesavanja = this.props.settings || {};

        const najnovije = (this.props.latest || []).slice(0, 9);
        const glavna = najnovije[0];

        const kategorije = (this.props.homeCategories || [])
            .filter((k) => (k.photosCount !== undefined ? k.photosCount : (k.photos && k.photos.length)))
            .slice()
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        const naslovGlavne = glavna ? Object.translate(glavna, 'name', lang) : '';
        const aliasGlavne = glavna ? Object.translate(glavna, 'alias', lang) : '';
        const slikaGlavne = glavna && glavna.photos && glavna.photos[0] && glavna.photos[0].image;

        return (
            <div className="naslovna-c">

                {(this.props.announcements || []).map((item, idx) => (
                    <Container key={idx}>
                        <Link to={`/najave/${item._id}`}>
                            <div className="alert">
                                <Isvg src={infoIcon} /> {Object.translate(item, 'content', lang)}
                            </div>
                        </Link>
                    </Container>
                ))}

                {/* ── Naslovna traka: jedan snimak preko cele širine ────── */}
                {glavna ? (
                    <section className="glavna-traka">
                        <Link to={`/galerija/${aliasGlavne}/${glavna._id}`}>
                            {slikaGlavne ? <img src={slikaUrl(slikaGlavne, '700x')} alt={naslovGlavne} /> : null}
                            <Container>
                                <div className="tekst">
                                    {glavna.categoryName ? (
                                        <span className="oznaka">{Object.translate(glavna, 'categoryName', lang)}</span>
                                    ) : null}
                                    <h2>{naslovGlavne}</h2>
                                    <p>
                                        {glavna.location ? <span>{glavna.location}</span> : null}
                                        <span>{datum(glavna.date)}</span>
                                        <span>{glavna.photosCount} {'fotografija'.translate(lang)}</span>
                                    </p>
                                </div>
                            </Container>
                        </Link>
                    </section>
                ) : null}

                {/* ── Najnovije, u traci koja se pomera ─────────────────── */}
                <section className="odeljak">
                    <Container>
                        <div className="naslov-odeljka">
                            <h3>{'Najnovije'.translate(lang)}</h3>
                            <Link to="/galerije">{'Sve galerije'.translate(lang)} &rarr;</Link>
                        </div>
                    </Container>
                    <Container>
                        <div className="traka">
                            {najnovije.slice(1).map((g, i) => this.kartica(g, `n${i}`))}
                        </div>
                    </Container>
                </section>

                {/* ── Izdvojeno ────────────────────────────────────────── */}
                {this.props.izdvojeno && this.props.izdvojeno.length ? (
                    <section className="odeljak izdvojeno">
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{podesavanja.izdvojenoNaslov || 'Izdvajamo'}</h3>
                            </div>
                            <div className="mreza-izdvojeno">
                                {this.props.izdvojeno.slice(0, 2).map((s, i) => {
                                    const naslov = Object.translate(s, 'title', lang) || '';
                                    return (
                                        <Link key={i} to={odredisteIzdvojenog(s.link)} className="izdvojena">
                                            {s.image ? <img src={s.image} alt={naslov} loading="lazy" /> : null}
                                            <div className="preko"><h4>{naslov}</h4></div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </Container>
                    </section>
                ) : null}

                {/* ── Kategorije, svaka u svojoj traci ──────────────────── */}
                {kategorije.map((k, idx) => {
                    const galerije = (k.photos || []).slice(0, 10);
                    if (!galerije.length) return null;

                    return (
                        <React.Fragment key={k._id || idx}>
                            <section className="odeljak">
                                <Container>
                                    <div className="naslov-odeljka">
                                        <h3>{Object.translate(k, 'name', lang)}</h3>
                                        <span className="broj-kat">
                                            {(k.photosCount || 0).toLocaleString('sr-RS')}
                                        </span>
                                        <Link to={`/galerije?category=${k.alias && k.alias.ba}`}>
                                            {'Sve'.translate(lang)} &rarr;
                                        </Link>
                                    </div>
                                </Container>
                                <Container>
                                    <div className="traka">
                                        {galerije.map((g, i) => this.kartica(g, `${idx}-${i}`))}
                                    </div>
                                </Container>
                            </section>

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

                {/* ── Video ────────────────────────────────────────────── */}
                {this.props.videos && this.props.videos.length ? (
                    <section className="odeljak">
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{'Video'.translate(lang)}</h3>
                                <Link to="/video">{'Svi snimci'.translate(lang)} &rarr;</Link>
                            </div>
                        </Container>
                        <Container>
                            <div className="traka">
                                {this.props.videos.slice(0, 8).map((v, i) => {
                                    const naslovVidea = Object.translate(v, 'title', lang) || '';
                                    return (
                                        <a key={i} href={v.link} target="_blank" rel="noopener noreferrer" className="kartica">
                                            <div className="slika">
                                                {v.thumbnail ? <img src={v.thumbnail} alt={naslovVidea} loading="lazy" /> : null}
                                                <span className="igraj">&#9654;</span>
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

export default PredlogC;
