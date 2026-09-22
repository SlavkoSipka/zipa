import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'reactstrap';
import Isvg from 'react-inlinesvg';

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
/*
 * Imena datoteka u arhivi imaju razmake i naša slova. Putanja se zato uvek
 * provlači kroz `encodeURI` — isto kao u `article.js`, `predlogA.js` i
 * `detailPage.js`. Lokalno razmak prolazi, ali kroz CDN ne mora.
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

/*
 * Fotografija se ne pojavljuje naglo: dok ne stigne, okvir je tiha podloga
 * koja lagano diše, a slika ulazi prelivom. Isti postupak kao na strani
 * galerije (`detailPage.js`) — klasa se dodaje pravo na čvor, bez stanja.
 *
 * `complete` u `ref`-u hvata slike koje su već u kešu: za njih `onLoad` ume
 * da ne stigne, pa bi okvir ostao da diše zauvek.
 */
const oznaciStiglu = (slika) => {
    const okvir = slika.parentNode;
    if (okvir && okvir.classList) okvir.classList.add('stigla');
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
                            decoding="async"
                            ref={(n) => { if (n && n.complete) oznaciStiglu(n); }}
                            onLoad={(e) => oznaciStiglu(e.currentTarget)}
                            onError={(e) => oznaciStiglu(e.currentTarget)}
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

    /*
     * Kostur naslovne dok galerije ne stignu.
     *
     * Crta se ISTI raspored koji dolazi posle — naslovni blok (jedna krupna
     * i dve uz nju), tri ispod, pa dva reda po kategorijama — pa strana ne
     * poskoči kad podaci stignu. Do sada su okviri stajali prazni i sadržaj
     * je banuo u njih.
     *
     * `z-kostur` iz `_komponente.scss` nosi prelivanje i sam se gasi pod
     * `prefers-reduced-motion`.
     */
    kosturNaslovne() {
        const red = (kljuc, koliko) => (
            <section className="odeljak" key={kljuc}>
                <Container>
                    <div className="naslov-odeljka">
                        <span className="z-kostur naslovna-b__k-naslov" />
                    </div>
                    <div className="naslovna-b__k-red">
                        {Array.from({ length: koliko }).map((_, i) => (
                            <span className="z-kostur naslovna-b__k-plocica" key={i} />
                        ))}
                    </div>
                </Container>
            </section>
        );

        return (
            <div className="naslovna-b naslovna-b--kostur" aria-busy="true">
                <section className="odeljak naslovni">
                    <Container>
                        <div className="naslov-odeljka">
                            <span className="z-kostur naslovna-b__k-naslov" />
                        </div>

                        <div className="blok-naslovni">
                            <div className="glavna">
                                <span className="z-kostur naslovna-b__k-puna" />
                            </div>
                            <div className="uz-glavnu">
                                <span className="z-kostur naslovna-b__k-puna" />
                                <span className="z-kostur naslovna-b__k-puna" />
                            </div>
                        </div>

                        <div className="blok-tri">
                            <span className="z-kostur naslovna-b__k-puna" />
                            <span className="z-kostur naslovna-b__k-puna" />
                            <span className="z-kostur naslovna-b__k-puna" />
                        </div>
                    </Container>
                </section>

                {red('k1', 5)}
                {red('k2', 5)}

                {/* Za čitače ekrana — kostur im ništa ne govori. */}
                <p className="naslovna-b__k-najava" role="status">
                    {'Učitavanje galerije'.translate(this.props.lang)}
                </p>
            </div>
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

        // Bez galerija nema šta da se crta — ide kostur, ne prazni okviri.
        if (!najnovije.length) return this.kosturNaslovne();

        return (
            <div className="naslovna-b">

                {/* Najave se vise NE iscrtavaju ovde. Od 2026-09-08 stoje u
                    traci na vrhu zaglavlja (`header.js`), koja se vidi na
                    svakoj strani — ovde su bile drugi prikaz iste stvari. */}

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
                                        <Link key={i} to={odredisteIzdvojenog(s.link)} className="izdvojena">
                                            <div className="slika">
                                                {s.image ? <img src={slikaIzdvojenog(s.image)} alt={naslov} loading="lazy" /> : null}
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

                    /*
                     * Način prikaza se bira po kategoriji, da naslovna ne bude
                     * jednolična — traženo za Foto specijal i slične grupe.
                     *
                     *   redovni — pet u redu
                     *   krupni  — prva galerija preko dva mesta, ostale uz nju
                     *   traka   — lista se u stranu, staje ih više
                     */
                    const nacin = k.homeStyle || 'redovni';
                    const koliko = nacin === 'traka' ? 10 : redova * 5;
                    const galerije = (k.photos || []).slice(0, koliko);
                    if (!galerije.length) return null;

                    return (
                        <React.Fragment key={k._id || idx}>
                            <section className="odeljak">
                                <Container>
                                    <div className="naslov-odeljka">
                                        <h3>{Object.translate(k, 'name', lang)}</h3>
                                        <Link to={`/galerije?category=${k.alias && k.alias.ba}`}>
                                            {'Sve'.translate(lang)} &rarr;
                                        </Link>
                                    </div>
                                    <div className={`mreza-pet nacin-${nacin}`}>
                                        {galerije.map((g, i) =>
                                            // U krupnom prikazu prva galerija ide preko
                                            // dva mesta, sa natpisom preko fotografije.
                                            nacin === 'krupni' && i === 0
                                                ? this.kartica(g, `${idx}-${i}`, 'preko', 'velika')
                                                : this.kartica(g, `${idx}-${i}`)
                                        )}
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
