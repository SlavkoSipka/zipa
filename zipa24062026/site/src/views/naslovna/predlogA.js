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

/*
 * Putanja se KODIRA. Imena datoteka u arhivi sadrže razmake
 * („…100god FK Borac Banja Luka…jpg"), a `srcset` razdvaja kandidate
 * razmakom — nekodiran razmak obara ceo `srcset` i pregledač ga odbaci
 * („Failed parsing 'srcset' attribute value"). `encodeURI` ostavlja `/`
 * netaknut, a razmak pretvara u `%20`.
 */
const slikaUrl = (putanja, sirina = '350x') =>
    putanja ? `${PHOTOS_ENDPOINT}/photos/${sirina}/${encodeURI(putanja)}` : null;

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

    /*
     * Vodeća galerija — krupan kadar, tekst ISPOD njega.
     *
     * Ugaone oznake (kategorija, brojač) ostaju na fotografiji: one su u
     * uglovima, van srednje trećine gde stoji žig, i iste su kao na kartici
     * galerije. Naslov i podaci silaze dole — pravilo projekta je da tekst
     * ne ide preko fotografije.
     */
    krupna(g) {
        if (!g) return null;

        const lang = this.props.lang;
        const naziv = Object.translate(g, 'name', lang);
        const alias = Object.translate(g, 'alias', lang);
        const slika = g.photos && g.photos[0] && g.photos[0].image;
        const broj = g.photosCount !== undefined ? g.photosCount : (g.photos && g.photos.length);

        return (
            <article className="z-vodeca__stavka">
                <Link to={`/galerija/${alias}/${g._id}`} className="z-vodeca__kadar" tabIndex="-1" aria-hidden="true">
                    {slika ? (
                        <img
                            src={slikaUrl(slika, '700x')}
                            srcSet={`${slikaUrl(slika, '350x')} 350w, ${slikaUrl(slika, '700x')} 700w`}
                            sizes="(max-width: 767px) 100vw, 640px"
                            alt=""
                            decoding="async"
                        />
                    ) : null}

                    {g.categoryName ? (
                        <span className="z-vodeca__kategorija">
                            {Object.translate(g, 'categoryName', lang)}
                        </span>
                    ) : null}

                    {broj ? <span className="z-vodeca__brojac">{broj}</span> : null}
                </Link>

                <div className="z-vodeca__telo">
                    <h4 className="z-vodeca__naslov">
                        <Link to={`/galerija/${alias}/${g._id}`}>{naziv}</Link>
                    </h4>
                    <p className="z-vodeca__meta">
                        {g.location ? <span>{g.location}</span> : null}
                        <span>{datum(g.date)}</span>
                    </p>
                </div>
            </article>
        );
    }

    /*
     * `plocica()` je uklonjena zajedno sa mozaikom tri sa tri — jedina
     * sekcija koja je zove više ne postoji. Video u poslednjem redu i dalje
     * koristi KLASU `plocica` iz `_naslovnaA.scss`, ali svoj markup piše sam.
     */

    render() {
        const lang = this.props.lang;
        const podesavanja = this.props.settings || {};

        /*
         * Prva galerija ide krupno, narednih osam kao redovi teksta. Devet
         * ukupno — isti broj kao raniji mozaik tri sa tri, ali samo jedna
         * fotografija umesto devet.
         */
        const sve = this.props.latest || [];
        const vodeca = sve[0];
        const spisak = sve.slice(1, 9);

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

                {/* ── Najnovije objave — vodeća galerija i hronološki spisak ──
                    Mreža tri sa tri je izbačena: bila je zid fotografija u
                    kom se ništa nije isticalo, i isti oblik kao još tri
                    sekcije ispod. Sada jedna galerija ide krupno, a naredne
                    kao redovi teksta — arhiva je hronološka i to se vidi. */}
                {vodeca ? (
                    <section className="odeljak">
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{'Najnovije objave'.translate(lang)}</h3>
                                <Link to="/galerije">{'Sve galerije'.translate(lang)} &rarr;</Link>
                            </div>

                            <div className="z-vodeca">
                                {this.krupna(vodeca)}

                                {spisak.length ? (
                                    <ol className="z-hronologija">
                                        {spisak.map((g, i) => {
                                            const naziv = Object.translate(g, 'name', lang);
                                            const alias = Object.translate(g, 'alias', lang);
                                            const broj = g.photosCount !== undefined
                                                ? g.photosCount
                                                : (g.photos && g.photos.length);
                                            return (
                                                <li className="z-hronologija__red" key={g._id || i}>
                                                    <Link to={`/galerija/${alias}/${g._id}`} className="z-hronologija__veza">
                                                        <time className="z-hronologija__datum">{datum(g.date)}</time>
                                                        <span className="z-hronologija__naziv">{naziv}</span>
                                                    </Link>
                                                    {broj ? (
                                                        <span className="z-hronologija__broj">{broj}</span>
                                                    ) : null}
                                                </li>
                                            );
                                        })}
                                    </ol>
                                ) : null}
                            </div>
                        </Container>
                    </section>
                ) : null}

                {/* ── Ručno izabrane fotografije ────────────────────────── */}
                {this.props.izdvojeno && this.props.izdvojeno.length ? (
                    <section className="odeljak">
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{podesavanja.izdvojenoNaslov || 'Izdvajamo'}</h3>
                            </div>
                            {/* Ručno biran sadržaj dobija urednički ritam, ne
                                mrežu: svaka stavka je pun red, fotografija sa
                                jedne strane a tekst sa druge, pa sledeći red
                                obrnuto. Tekst stoji PORED fotografije, nikad
                                preko nje. */}
                            <div className="z-izdvojeno">
                                {this.props.izdvojeno.slice(0, 3).map((s, i) => {
                                    const naslov = Object.translate(s, 'title', lang) || '';
                                    const naKategoriju = String(s.link || '').indexOf('category=') !== -1;
                                    return (
                                        <article
                                            className={'z-izdvojeno__red' + (i % 2 ? ' z-izdvojeno__red--obrnuto' : '')}
                                            key={s._id || i}
                                        >
                                            <Link
                                                to={odredisteIzdvojenog(s.link)}
                                                className="z-izdvojeno__kadar"
                                                tabIndex="-1"
                                                aria-hidden="true"
                                            >
                                                {s.image ? (
                                                    <img src={s.image} alt="" loading="lazy" decoding="async" />
                                                ) : null}
                                            </Link>

                                            <div className="z-izdvojeno__telo">
                                                <p className="z-izdvojeno__oznaka">
                                                    {(naKategoriju ? 'Kategorija' : 'Galerija').translate(lang)}
                                                </p>
                                                <h4 className="z-izdvojeno__naslov">
                                                    <Link to={odredisteIzdvojenog(s.link)}>{naslov}</Link>
                                                </h4>
                                                <p className="z-izdvojeno__dalje">
                                                    {(naKategoriju
                                                        ? 'Pogledajte fotografije'
                                                        : 'Otvorite galeriju').translate(lang)} &rarr;
                                                </p>
                                            </div>
                                        </article>
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
                            {/* Zbijeni indeks: kvadratna fotografija, naziv i
                                broj ISPOD nje. Jedina kvadratna mreža na
                                strani — služi za snalaženje, ne za utisak. */}
                            <div className="z-kategorije">
                                {kategorije.slice(0, 4).map((k, i) => {
                                    const prva = k.photos && k.photos[0];
                                    const slika = prva && prva.photos && prva.photos[0] && prva.photos[0].image;
                                    return (
                                        <Link
                                            key={k._id || i}
                                            to={`/galerije?category=${k.alias && k.alias.ba}`}
                                            className="z-kategorije__stavka"
                                        >
                                            <span className="z-kategorije__kadar">
                                                {slika ? (
                                                    <img src={slikaUrl(slika, '350x')} alt="" loading="lazy" decoding="async" />
                                                ) : null}
                                            </span>
                                            <span className="z-kategorije__naziv">
                                                {Object.translate(k, 'name', lang)}
                                            </span>
                                            <span className="z-kategorije__broj">
                                                {(k.photosCount || 0).toLocaleString('sr-RS')} {'fotografija'.translate(lang)}
                                            </span>
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
