import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Page from '../containers/page';

import { Container } from 'reactstrap';

import Article from '../components/articles/article';
import userPhoto from '../assets/images/user.png';
import { API_ENDPOINT, PHOTOS_ENDPOINT } from '../constants';

/*
 * PROFIL FOTOGRAFA
 *
 * Zaglavlje sa slikom autora, biografijom, brojevima i kontaktom; ispod
 * izdvojene fotografije u zidanom rasporedu, pa galerije preko iste kartice
 * koja se koristi na `/galerije` i naslovnoj.
 *
 * Podaci o autoru stižu kao i pre, kroz `loadData` (`/photographer/:alias`) —
 * ta ruta je netaknuta. Spisak galerija ta ruta ne vraća, pa se dovlači
 * ISTIM javnim pozivom koji već koristi `/galerije` i „Iz iste kategorije"
 * na strani galerije: `POST /gallery/search/{lang}`. Nijedna ruta ni odgovor
 * nisu menjani.
 *
 * Tačan broj galerija: odgovor vraća `total` kao BROJ STRANA, ne stavki. Uz
 * `ipp: 1` jedna strana je jedna galerija, pa je `total` tada tačan ukupan
 * broj — jedan lagan poziv umesto izmene API-ja.
 */

const PO_STRANI = 12;

// Koliko kategorija stoji otvoreno pre „Sve kategorije".
const PRVIH_KATEGORIJA = 10;

class PhotographerPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            ...props.initialData,
            galerije: [],
            brojGalerija: null,
            kategorija: null,      // alias izabrane kategorije, null = sve
            strana: 0,
            imaJos: false,
            ucitava: false,
            sveKategorije: false,
        };
    }

    init() {
        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, null, this.props.lang).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }

        this.dovuciGalerije(0, this.state.kategorija);
        this.prebrojGalerije();
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        this.init()
    }

    componentDidUpdate(prevProps) {
        if (prevProps[0].location.pathname != this.props[0].location.pathname) {
            this.setState({ galerije: [], strana: 0, kategorija: null, brojGalerija: null }, this.init);
        }
    }

    upit(dodatno) {
        const q = {
            photographer: this.props[0].match.params.photographer,
            ...dodatno,
        };
        if (this.state.kategorija) q.category = [this.state.kategorija];
        if (dodatno && dodatno.category !== undefined) q.category = dodatno.category;

        return fetch(`${API_ENDPOINT}/gallery/search/${this.props.lang}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ query: q })
        }).then((res) => res.json());
    }

    // Tačan broj galerija — vidi napomenu na vrhu fajla.
    prebrojGalerije(kategorija) {
        const category = kategorija ? [kategorija] : undefined;
        this.upit({ ipp: 1, page: 0, category }).then((r) => {
            this.setState({ brojGalerija: r && r.total !== undefined ? r.total : null });
        }).catch(() => { });
    }

    dovuciGalerije(strana, kategorija) {
        this.setState({ ucitava: true });

        const category = kategorija ? [kategorija] : undefined;
        this.upit({ ipp: PO_STRANI, page: strana, category }).then((r) => {
            const stigle = (r && r.items) || [];
            this.setState({
                galerije: strana === 0 ? stigle : this.state.galerije.concat(stigle),
                strana,
                imaJos: stigle.length === PO_STRANI,
                ucitava: false,
            });
        }).catch(() => this.setState({ ucitava: false }));
    }

    izaberiKategoriju = (alias) => {
        if (alias === this.state.kategorija) return;
        this.setState({ kategorija: alias, galerije: [], strana: 0, brojGalerija: null }, () => {
            this.dovuciGalerije(0, alias);
            this.prebrojGalerije(alias);
        });
    };

    render() {
        const l = this.props.lang;
        const f = this.state.photographer ? this.state.photographer : {};

        const mesto = [f.city, f.country].filter((x) => x).join(', ');

        // Veze ka mrežama — samo one koje autor zaista ima.
        const veze = [
            { naziv: 'Web sajt', vrednost: f.webSite },
            { naziv: 'Facebook', vrednost: f.facebook },
            { naziv: 'Instagram', vrednost: f.instagram },
            { naziv: 'Twitter', vrednost: f.twitter },
            { naziv: 'Skype', vrednost: f.skype },
        ].filter((v) => v.vrednost);

        const kategorije = this.props.categories || [];

        // Izabrana kategorija mora da ostane vidljiva i kad je spisak skupljen.
        const vidljive = this.state.sveKategorije
            ? kategorije
            : kategorije.filter((k, idx) => idx < PRVIH_KATEGORIJA
                || Object.translate(k, 'alias', l) === this.state.kategorija);

        return (
            <div className="photgrapher-wrap z-fotograf">

                {/* ── zaglavlje autora ───────────────────────────────── */}
                <header className="z-fotograf__zaglavlje">
                    <Container>
                        <div className="z-fotograf__vrh">

                            <div className="z-fotograf__lice">
                                <img
                                    src={f.profilePhoto ? f.profilePhoto : userPhoto}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>

                            <div className="z-fotograf__predstava">
                                <p className="z-fotograf__uloga">{'Fotograf'.translate(l)}</p>
                                <h1 className="z-fotograf__ime">{f.name}</h1>
                                {mesto ? <p className="z-fotograf__mesto">{mesto}</p> : null}

                                {f.biography ? (
                                    <div
                                        className="z-fotograf__biografija"
                                        dangerouslySetInnerHTML={{ __html: f.biography.replace(/\n/g, '<br/>') }}
                                    />
                                ) : null}

                                <div className="z-fotograf__brojevi">
                                    <div className="z-fotograf__broj">
                                        <span className="z-fotograf__broj-vrednost">
                                            {this.state.brojGalerija !== null ? this.state.brojGalerija : '—'}
                                        </span>
                                        <span className="z-fotograf__broj-naziv">{'galerija'.translate(l)}</span>
                                    </div>
                                    <div className="z-fotograf__broj">
                                        <span className="z-fotograf__broj-vrednost">
                                            {f.photosCount !== undefined ? f.photosCount : '—'}
                                        </span>
                                        <span className="z-fotograf__broj-naziv">{'fotografija'.translate(l)}</span>
                                    </div>
                                </div>

                                {veze.length ? (
                                    <ul className="z-fotograf__kontakt">
                                        {veze.map((v, idx) => (
                                            <li key={idx}>
                                                <span className="z-fotograf__kontakt-naziv">
                                                    {v.naziv.translate(l)}
                                                </span>
                                                <a
                                                    className="z-fotograf__kontakt-veza"
                                                    href={v.naziv === 'Skype' ? `skype:${v.vrednost}?chat` : v.vrednost}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {v.vrednost}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}

                                <div className="z-fotograf__radnje">
                                    <Link
                                        className="z-fotograf__radnja z-fotograf__radnja--glavna"
                                        to={`/galerije?photographer=${f.userAlias}`}
                                    >
                                        {'Sve galerije fotografa'.translate(l)}
                                    </Link>
                                    <Link className="z-fotograf__radnja" to="/contact">
                                        {'Pošaljite upit'.translate(l)}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </Container>
                </header>

                <Container>

                    {/* ── izdvojene fotografije ──────────────────────── */}
                    {f.photos && f.photos.length ? (
                        <section className="z-fotograf__odeljak">
                            <h2 className="z-fotograf__odeljak-naslov">
                                {'Izdvojeno od fotografa'.translate(l)}
                            </h2>

                            {/* Zidani raspored: kolone, pa fotografije zadržavaju
                                svoj odnos stranica i ništa se ne seče. */}
                            <div className="z-fotograf__zid">
                                {f.photos.map((item, idx) => (
                                    <Link
                                        className="z-fotograf__zid-stavka"
                                        key={idx}
                                        to={`/galerija/${Object.translate(item, 'galleryAlias', l)}/${item._id}/${item.photoId}`}
                                    >
                                        <img
                                            src={`${PHOTOS_ENDPOINT}/photos/350x/${encodeURI(item.image || '')}`}
                                            srcSet={`${PHOTOS_ENDPOINT}/photos/350x/${encodeURI(item.image || '')} 350w, ${PHOTOS_ENDPOINT}/photos/700x/${encodeURI(item.image || '')} 700w`}
                                            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 300px"
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {/* ── galerije ───────────────────────────────────── */}
                    <section className="z-fotograf__odeljak">
                        <h2 className="z-fotograf__odeljak-naslov">
                            {'Galerije'.translate(l)}
                        </h2>

                        {kategorije.length ? (
                            <div className="z-fotograf__filter" role="group" aria-label={'Filter po kategoriji'.translate(l)}>
                                <button
                                    type="button"
                                    className={'z-fotograf__pilula' + (!this.state.kategorija ? ' z-fotograf__pilula--izabrana' : '')}
                                    aria-pressed={!this.state.kategorija}
                                    onClick={() => this.izaberiKategoriju(null)}
                                >
                                    {'Sve'.translate(l)}
                                </button>

                                {vidljive.map((k) => {
                                    const alias = Object.translate(k, 'alias', l);
                                    const izabrana = this.state.kategorija === alias;
                                    return (
                                        <button
                                            type="button"
                                            key={k._id}
                                            className={'z-fotograf__pilula' + (izabrana ? ' z-fotograf__pilula--izabrana' : '')}
                                            aria-pressed={izabrana}
                                            onClick={() => this.izaberiKategoriju(alias)}
                                        >
                                            {Object.translate(k, 'name', l)}
                                        </button>
                                    );
                                })}

                                {/* Arhiva ima preko četrdeset kategorija —
                                    sve odjednom su tri reda pilula pre nego
                                    što se vidi ijedna galerija. */}
                                {kategorije.length > PRVIH_KATEGORIJA ? (
                                    <button
                                        type="button"
                                        className="z-fotograf__pilula z-fotograf__pilula--jos"
                                        aria-expanded={this.state.sveKategorije}
                                        onClick={() => this.setState({ sveKategorije: !this.state.sveKategorije })}
                                    >
                                        {this.state.sveKategorije
                                            ? 'Prikaži manje'.translate(l)
                                            : `${'Sve kategorije'.translate(l)} (${kategorije.length})`}
                                    </button>
                                ) : null}
                            </div>
                        ) : null}

                        {this.state.galerije.length ? (
                            <div className="z-fotograf__mreza">
                                {this.state.galerije.map((article, idx) => (
                                    <Article
                                        key={article._id || idx}
                                        _id={article._id}
                                        categoryName={Object.translate(article, 'categoryName', l)}
                                        image={article.photos && article.photos[0] && article.photos[0].image}
                                        name={Object.translate(article, 'name', l)}
                                        shortDescription={Object.translate(article, 'description', l)}
                                        alias={Object.translate(article, 'alias', l)}
                                        userAlias={article.userAlias}
                                        imagesCount={article.photosCount !== undefined ? article.photosCount : (article.photos && article.photos.length)}
                                        location={article.location}
                                        published={article.date}
                                        homeArticle
                                    ></Article>
                                ))}
                            </div>
                        ) : !this.state.ucitava ? (
                            <p className="z-fotograf__prazno">
                                {this.state.kategorija
                                    ? 'U ovoj kategoriji ovaj fotograf još nema galerija.'.translate(l)
                                    : 'Ovaj fotograf još nema objavljenih galerija.'.translate(l)}
                            </p>
                        ) : null}

                        {this.state.imaJos ? (
                            <div className="z-fotograf__jos">
                                <button
                                    type="button"
                                    className="z-fotograf__radnja"
                                    disabled={this.state.ucitava}
                                    onClick={() => this.dovuciGalerije(this.state.strana + 1, this.state.kategorija)}
                                >
                                    {this.state.ucitava
                                        ? 'Učitavanje…'.translate(l)
                                        : 'Prikaži još galerija'.translate(l)}
                                </button>
                            </div>
                        ) : null}
                    </section>

                    {/* Reklamna traka agencije — ostaje, samo je prevučena
                        u isti ritam kao ostatak strane. */}
                    {this.props.banners && this.props.banners[1] && this.props.banners[1].images.length ? (
                        <div className="z-fotograf__reklame">
                            {this.props.banners[1].images.map((item, idx) => (
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    key={idx}
                                    onClick={() => this.props.bannerClick(item.link)}
                                >
                                    <img src={item.image} alt="" loading="lazy" />
                                </a>
                            ))}
                        </div>
                    ) : null}
                </Container>
            </div>
        );
    }
}

export default Page(PhotographerPage);
