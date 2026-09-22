import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';

import { PHOTOS_ENDPOINT } from '../../constants';
import { Plocica, PlocicaGalerije } from '../../components/plocica';

/**
 * Naslovna strana — predlog A.
 *
 * RASPORED (prekrojen 2026-09-22, po uzoru na Pixsell):
 *
 *   1. MOZAIK — devet najnovijih galerija, 3 × 3, preko celog ekrana, sa
 *      malim razmacima. Naslov i datum se pojave kad se mišem pređe preko.
 *   2. RED OD PET — sledeće galerije iz kategorija naslovne, isti izgled.
 *   3. IZDVAJAMO — ručni izbor, krupno, po četiri u redu.
 *   4. VIDEO i 5. REKLAMA.
 *
 * „Arhiva po kategorijama" i „Dnevnik arhive" su izbačeni (2026-09-22).
 *
 * NIJEDNA GALERIJA SE NE PONAVLJA — vidi `idIzVeze` i skup `prikazane`.
 *
 * Nema nijedne trake koja se sama pomera. Sve stoji.
 */

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

    render() {
        const lang = this.props.lang;
        const podesavanja = this.props.settings || {};

        /*
         * ── NIŠTA SE NE PONAVLJA ─────────────────────────────────────────
         * Redom: mozaik (najnovije), ručni izbor, red od pet, dnevnik. Svaka
         * galerija koja je već prikazana izlazi iz svih ispod.
         */
        const prikazane = {};
        const oznaci = (id) => { if (id) prikazane[String(id)] = true; };
        const slobodna = (g) => g && g._id && !prikazane[String(g._id)];

        const mozaik = (this.props.latest || []).filter(slobodna).slice(0, 9);
        mozaik.forEach((g) => oznaci(g._id));

        const izbor = (this.props.izdvojeno || []).slice();
        izbor.forEach((s) => oznaci(idIzVeze(s.link)));

        // Galerije iz kategorija naslovne, bez ponavljanja, najnovije prve.
        const zaliha = [];
        (this.props.homeCategories || []).forEach((k) => {
            (k.photos || []).forEach((g) => {
                if (slobodna(g)) { zaliha.push(g); oznaci(g._id); }
            });
        });
        zaliha.sort((a, b) => (b.date || 0) - (a.date || 0));

        const redPet = zaliha.slice(0, 5);

        return (
            <div className="naslovna-a">

                {/* ── 1. MOZAIK — 3 × 3 preko celog ekrana ──────────────── */}
                {mozaik.length ? (
                    <section className="z-mozaik">
                        <div className="z-mozaik__mreza">
                            {mozaik.map((g, i) => <PlocicaGalerije key={g._id || i} g={g} lang={lang} />)}
                        </div>
                    </section>
                ) : null}

                {/* ── 2. RED OD PET ─────────────────────────────────────── */}
                {redPet.length ? (
                    <section className="z-mozaik z-mozaik--pet">
                        <div className="z-mozaik__mreza z-mozaik__mreza--pet">
                            {redPet.map((g, i) => <PlocicaGalerije key={g._id || i} g={g} lang={lang} />)}
                        </div>
                    </section>
                ) : null}

                {/* ── 3. IZDVAJAMO — krupno, četiri u redu ──────────────── */}
                {izbor.length ? (
                    <section className="odeljak z-izdvajamo-a">
                        <Container>
                            <div className="naslov-odeljka">
                                <h3>{podesavanja.izdvojenoNaslov || 'Izdvajamo'}</h3>
                                <Link to="/galerije">{'Sve galerije'.translate(lang)} &rarr;</Link>
                            </div>
                            <div className="z-mozaik__mreza z-mozaik__mreza--cetiri">
                                {izbor.map((s, i) => (
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
