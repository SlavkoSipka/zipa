import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';

import { PHOTOS_ENDPOINT } from '../../constants';

/**
 * Naslovna strana — predlog A.
 *
 * RASPORED (prekrojen 2026-09-08, po traženju klijenta):
 *
 *   1. IZBOR UREDNIKA — ručno izabrano ide PRVO, ne najnovije. Jedna stavka
 *      krupno, ostale kao uzan stubac pored nje.
 *   2. DNEVNIK ARHIVE — galerije grupisane PO DANIMA. Levo krupan datum,
 *      desno šta je tog dana snimljeno. Arhiva je hronološka i to je ovde
 *      nosilac rasporeda, umesto još jedne mreže.
 *   3. ARHIVA PO KATEGORIJAMA — bez ijedne fotografije: samo nazivi i
 *      brojevi, u stupcima. Miran predah između dva foto-odeljka.
 *   4. VIDEO — dve široke pločice.
 *   5. REKLAMA — poslednja, da ne preseca sadržaj.
 *
 * NIJEDNA GALERIJA SE NE PONAVLJA. „Izbor urednika" često pokazuje na
 * galerije koje su i među najnovijima (mereno: 3 od 4 stavke), pa se iz
 * dnevnika izbacuju one koje su gore već prikazane — vidi `idIzVeze`.
 *
 * Nema nijedne trake koja se sama pomera. Sve stoji.
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

/*
 * Fotografija „Izdvajamo" — adresa se uvek preslaguje na TEKUCI izvor slika.
 *
 * U bazi ovih nekoliko redova nosi PUNU adresu, onakvu kakva je bila kad su
 * upisani. Nekoliko ih je upisano dok se radilo lokalno, pa u sebi nose
 * `http://localhost:10015`: kod nas se vide, na produkciji ne postoje.
 * Zato se od zapamcene adrese uzima samo deo od `/photos/` nadalje i lepi na
 * `PHOTOS_ENDPOINT`. Adrese koje nisu iz naseg skladista (npr. baner sa
 * strane) prolaze nedirnute.
 *
 * Ovo je mreza za pad; pravo mesto je upis — API od 2026-08-29 sece domacina
 * pri cuvanju. Ostaje i posle toga, zbog starih redova.
 */
const slikaIzdvojenog = (vrednost) => {
    if (!vrednost) return null;
    const mesto = vrednost.indexOf('/photos/');
    return mesto === -1 ? vrednost : `${PHOTOS_ENDPOINT}${vrednost.slice(mesto)}`;
};

/*
 * ID galerije iz veze „Izdvajamo".
 *
 * Stavka u bazi nosi PUTANJU (`/galerija/<alias>/<id>`), ne id. Bez ovoga se
 * ne može znati da je ista galerija već prikazana gore, pa se ponavlja niže
 * u dnevniku — što je klijent i prijavio.
 */
const idIzVeze = (veza) => {
    const nadjeno = /\/galerija\/[^/]+\/([A-Za-z0-9]+)/.exec(String(veza || ''));
    return nadjeno ? nadjeno[1] : null;
};

/*
 * Galerije u grupe po DANU snimanja, redom kojim su i stigle.
 *
 * Galerije bez datuma se preskaču: sve takve u arhivi su prazni nacrti
 * (`docs/galerije-bez-datuma.md`), pa u dnevniku nemaju šta da rade.
 */
const poDanima = (galerije) => {
    const grupe = [];
    const poKljucu = {};

    (galerije || []).forEach((g) => {
        if (!g || !g.date) return;
        const d = new Date(g.date * 1000);
        const kljuc = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();

        if (!poKljucu[kljuc]) {
            poKljucu[kljuc] = { kljuc, dan: d, stavke: [] };
            grupe.push(poKljucu[kljuc]);
        }
        poKljucu[kljuc].stavke.push(g);
    });

    return grupe;
};

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
     * Kartica galerije u dnevniku — fotografija, pa naziv i podaci ISPOD nje.
     * Tekst nikad ne ide preko kadra; u uglovima stoje samo dve oznake, kao
     * na kartici galerije.
     */
    kartica(g, kljuc) {
        if (!g) return null;

        const lang = this.props.lang;
        const naziv = Object.translate(g, 'name', lang);
        const alias = Object.translate(g, 'alias', lang);
        const slika = g.photos && g.photos[0] && g.photos[0].image;
        const broj = g.photosCount !== undefined ? g.photosCount : (g.photos && g.photos.length);
        const putanja = `/galerija/${alias}/${g._id}`;

        return (
            <article className="z-dan__stavka" key={kljuc}>
                <Link to={putanja} className="z-dan__kadar" tabIndex="-1" aria-hidden="true">
                    {slika ? (
                        <img
                            src={slikaUrl(slika, '350x')}
                            srcSet={`${slikaUrl(slika, '350x')} 350w, ${slikaUrl(slika, '700x')} 700w`}
                            sizes="(max-width: 767px) 100vw, 320px"
                            alt=""
                            loading="lazy"
                            decoding="async"
                        />
                    ) : null}
                    {broj ? <span className="z-dan__brojac">{broj}</span> : null}
                </Link>

                <h4 className="z-dan__naslov">
                    <Link to={putanja}>{naziv}</Link>
                </h4>

                <p className="z-dan__meta">
                    {g.location ? <span>{g.location}</span> : null}
                    {g.user ? <span>{g.user}</span> : null}
                </p>
            </article>
        );
    }

    render() {
        const lang = this.props.lang;
        const podesavanja = this.props.settings || {};

        /*
         * ── NIŠTA SE NE PONAVLJA ─────────────────────────────────────────
         * Ručni izbor ide prvi i ima prednost; galerije koje su tu prikazane
         * izlaze iz dnevnika ispod. Bez ovoga se ista galerija vidi dvaput
         * (mereno na živim podacima: 3 od 4 izdvojene stavke su i među
         * najnovijim galerijama).
         */
        const izbor = (this.props.izdvojeno || []).slice(0, 4);

        const zauzete = {};
        izbor.forEach((s) => {
            const id = idIzVeze(s.link);
            if (id) zauzete[String(id)] = true;
        });

        const zaDnevnik = (this.props.latest || []).filter(
            (g) => g && g._id && !zauzete[String(g._id)]
        );

        const dani = poDanima(zaDnevnik).slice(0, 4);

        const kategorije = (this.props.homeCategories || [])
            .filter((k) => (k.photosCount !== undefined ? k.photosCount : (k.photos && k.photos.length)))
            .slice()
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        const vodeciIzbor = izbor[0];
        const ostatakIzbora = izbor.slice(1);

        return (
            <div className="naslovna-a">

                {/* ── 1. IZBOR UREDNIKA ────────────────────────────────────
                    Ručno biran sadržaj ide PRVI, ne najnovije. Jedna stavka
                    krupno levo, ostale kao uzan stubac desno. */}
                {vodeciIzbor ? (
                    <section className="odeljak odeljak--prvi">
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{podesavanja.izdvojenoNaslov || 'Izdvajamo'}</h3>
                                <Link to="/galerije">{'Sve galerije'.translate(lang)} &rarr;</Link>
                            </div>

                            <div className="z-izbor">
                                {(() => {
                                    const naslov = Object.translate(vodeciIzbor, 'title', lang) || '';
                                    const naKategoriju = String(vodeciIzbor.link || '').indexOf('category=') !== -1;
                                    const kuda = odredisteIzdvojenog(vodeciIzbor.link);

                                    return (
                                        <article className="z-izbor__glavni">
                                            <Link to={kuda} className="z-izbor__kadar" tabIndex="-1" aria-hidden="true">
                                                {vodeciIzbor.image ? (
                                                    <img src={slikaIzdvojenog(vodeciIzbor.image)} alt="" decoding="async" />
                                                ) : null}
                                            </Link>

                                            <div className="z-izbor__telo">
                                                <p className="z-izbor__oznaka">
                                                    {(naKategoriju ? 'Kategorija' : 'Galerija').translate(lang)}
                                                </p>
                                                <h4 className="z-izbor__naslov">
                                                    <Link to={kuda}>{naslov}</Link>
                                                </h4>
                                                <p className="z-izbor__dalje">
                                                    {(naKategoriju
                                                        ? 'Pogledajte fotografije'
                                                        : 'Otvorite galeriju').translate(lang)} &rarr;
                                                </p>
                                            </div>
                                        </article>
                                    );
                                })()}

                                {ostatakIzbora.length ? (
                                    <ul className="z-izbor__uz">
                                        {ostatakIzbora.map((s, i) => {
                                            const naslov = Object.translate(s, 'title', lang) || '';
                                            const kuda = odredisteIzdvojenog(s.link);
                                            return (
                                                <li className="z-izbor__red" key={s._id || i}>
                                                    <Link to={kuda} className="z-izbor__red-veza">
                                                        <span className="z-izbor__slicica">
                                                            {s.image ? (
                                                                <img src={slikaIzdvojenog(s.image)} alt="" loading="lazy" decoding="async" />
                                                            ) : null}
                                                        </span>
                                                        <span className="z-izbor__red-naslov">{naslov}</span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : null}
                            </div>
                        </Container>
                    </section>
                ) : null}

                {/* ── 2. DNEVNIK ARHIVE ────────────────────────────────────
                    Galerije po danima: levo krupan datum, desno šta je tog
                    dana snimljeno. Nosilac rasporeda je vreme, ne mreža. */}
                {dani.length ? (
                    <section className={'odeljak z-dnevnik' + (vodeciIzbor ? '' : ' odeljak--prvi')}>
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{'Dnevnik arhive'.translate(lang)}</h3>
                                <Link to="/galerije">{'Sve galerije'.translate(lang)} &rarr;</Link>
                            </div>

                            {dani.map((d) => (
                                <div className="z-dan" key={d.kljuc}>
                                    <div className="z-dan__datum">
                                        <span className="z-dan__broj">
                                            {String(d.dan.getDate()).padStart(2, '0')}
                                        </span>
                                        <span className="z-dan__mesec">
                                            {String(d.dan.getMonth() + 1).padStart(2, '0')}.
                                        </span>
                                        <span className="z-dan__godina">{d.dan.getFullYear()}.</span>
                                        <span className="z-dan__koliko">
                                            {d.stavke.length} {'galerija'.translate(lang)}
                                        </span>
                                    </div>

                                    <div className="z-dan__stavke">
                                        {d.stavke.map((g, i) => this.kartica(g, g._id || i))}
                                    </div>
                                </div>
                            ))}
                        </Container>
                    </section>
                ) : null}

                {/* ── 3. ARHIVA PO KATEGORIJAMA ────────────────────────────
                    Bez ijedne fotografije — samo nazivi i brojevi. Predah
                    između dva foto-odeljka i brz put u dubinu arhive. */}
                {kategorije.length ? (
                    <section className="odeljak z-indeks-odeljak">
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{'Arhiva po kategorijama'.translate(lang)}</h3>
                                <Link to="/galerije">{'Sve kategorije'.translate(lang)} &rarr;</Link>
                            </div>

                            <ul className="z-indeks">
                                {kategorije.map((k, i) => (
                                    <li className="z-indeks__red" key={k._id || i}>
                                        <Link
                                            to={`/galerije?category=${k.alias && k.alias.ba}`}
                                            className="z-indeks__veza"
                                        >
                                            <span className="z-indeks__naziv">
                                                {Object.translate(k, 'name', lang)}
                                            </span>
                                            <span className="z-indeks__broj">
                                                {(k.photosCount || 0).toLocaleString('sr-RS')}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </Container>
                    </section>
                ) : null}

                {/* ── 4. VIDEO ─────────────────────────────────────────── */}
                {this.props.videos && this.props.videos.length ? (
                    <section className="odeljak video">
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{'Video'.translate(lang)}</h3>
                                <Link to="/video">{'Svi snimci'.translate(lang)} &rarr;</Link>
                            </div>
                            <div className="mreza-video">
                                {this.props.videos.slice(0, 2).map((v, i) => {
                                    const naslovVidea = Object.translate(v, 'title', lang) || '';
                                    return (
                                        <a key={i} href={v.link} target="_blank" rel="noopener noreferrer" className="plocica">
                                            <div className="slika">
                                                {v.thumbnail ? <img src={v.thumbnail} alt={naslovVidea} loading="lazy" /> : null}
                                                <span className="igraj">&#9654;</span>
                                            </div>
                                            <h4 className="naslov-videa">{naslovVidea}</h4>
                                        </a>
                                    );
                                })}
                            </div>
                        </Container>
                    </section>
                ) : null}

                {/* ── 5. REKLAMA — poslednja, da ne preseca sadržaj ─────── */}
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

            </div>
        );
    }
}

export default PredlogA;
