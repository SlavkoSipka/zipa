import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';

import Isvg from 'react-inlinesvg';

import { PHOTOS_ENDPOINT } from '../../constants';
import { Plocica, PlocicaGalerije } from '../../components/plocica';
import KategorijeNaslovne from '../../components/kategorijeNaslovne';

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

        /* Najnovije (2026-10-27): levo jedna velika, desno tri kolone u dva
           reda — sedam galerija, ivice se poklapaju. Ranije red od pet. */
        const najnovije = (this.props.latest || []).slice(0, 7);



        return (
            <div className="naslovna-c">

                {/* Najave se vise NE iscrtavaju ovde. Od 2026-09-08 stoje u
                    traci na vrhu zaglavlja (`header.js`), koja se vidi na
                    svakoj strani — ovde su bile drugi prikaz iste stvari. */}

                {/* ── Pretraga sa pozadinskom slikom je u zaglavlju
                    (`header.js`, naslovni blok); sliku bira administracija.
                    Ispod nje: pet najnovijih galerija kao pločice sa A. ── */}
                {najnovije.length ? (
                    <section className="z-mozaik z-mozaik--vodeca">
                        {/* U širini sadržaja, kao „Izdvajamo" ispod — ivice
                            se poklapaju uspravno (2026-10-27). */}
                        <Container>
                            <div className="z-mozaik__mreza z-mozaik__mreza--vodeca">
                                {najnovije.map((g, i) => (
                                    <PlocicaGalerije key={g._id || i} g={g} lang={lang} velika={i === 0} />
                                ))}
                            </div>
                        </Container>
                    </section>
                ) : null}

                {/* ── Izdvojeno ────────────────────────────────────────── */}
                {this.props.izdvojeno && this.props.izdvojeno.length ? (
                    <section className="odeljak izdvojeno">
                        <Container>
                            {/* Naslov kao na A (2026-10-27): krupan, crven, „Sve galerije →" desno. */}
                            <div className="naslov-odeljka naslov-odeljka--kao-a">
                                <h3>{podesavanja.izdvojenoNaslov || 'Izdvajamo'}</h3>
                                <Link to="/galerije">{'Sve galerije'.translate(lang)} &rarr;</Link>
                            </div>
                            {/* Isto kao na A i C (2026-10-13): uvek ČETIRI pločice
                                u jednom redu, pa se u administraciji uvek bira
                                četiri. Ranije je ovde bilo drugačije. */}
                            <div className="z-mozaik__mreza z-mozaik__mreza--cetiri">
                                {this.props.izdvojeno.slice(0, 4).map((s, i) => (
                                    <Plocica
                                        key={s._id || i}
                                        putanja={odredisteIzdvojenog(s.link)}
                                        slika={slikaIzdvojenog(s.image)}
                                        naslov={Object.translate(s, 'title', lang) || ''}
                                        velika
                                    />
                                ))}
                            </div>
                        </Container>
                    </section>
                ) : null}

                {/* ── Kategorije — isto na A, B i C (2026-10-13) ───────────
                    Kategorije označene za početnu, posle „Izdvajamo". */}
                <KategorijeNaslovne
                    homeCategories={this.props.homeCategories}
                    lang={lang}
                    banners={this.props.banners}
                    bannerClick={this.props.bannerClick}
                    videos={this.props.videos}
                    settings={this.props.settings}
                />

            </div>
        );
    }
}

export default PredlogC;
