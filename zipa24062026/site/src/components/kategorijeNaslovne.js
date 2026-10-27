import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';

import Article from './articles/article';
import BanerSlika from './baner';

/*
 * KATEGORIJE NA NASLOVNOJ — isto na A, B i C (2026-10-13).
 *
 * Posle „Izdvajamo" ide svaka kategorija koju je administrator označio za
 * početnu (*Kategorije → Vidljiva na početnoj*), redom po polju „Pozicija":
 * naziv, veza „Sve galerije" ka svim galerijama te kategorije, i njene
 * galerije — pet u redu, jedan ili dva reda (polje „Redova na početnoj").
 *
 * Ranije je svaki izgled ovo crtao na svoj način (A uopšte nije imao
 * kategorije), pa je odeljak izdvojen u jednu komponentu.
 *
 * Posle svake druge kategorije ide reklama, kao i do sada na B i C.
 *
 * VIDEO KAO KATEGORIJA (2026-10-27): odeljak „Video" stoji u istom nizu i
 * ređa se istim brojem „Pozicija" kao kategorije — bira se u
 * *Administracija → Video* (`settings.videoPozicija`, `videoNaPocetnoj`).
 * Kod iste pozicije video ide posle kategorije; bez pozicije ide na kraj.
 * Uvek tri najnovija snimka (`homePage.js`), isti izgled na A, B i C.
 */

// Kategorije koje imaju galerije, redom koji je zadat u administraciji.
export const kategorijeZaNaslovnu = (homeCategories) => (homeCategories || [])
    .filter((k) => k && k.photos && k.photos.length)
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0));

export const VideoNaslovne = ({ videos, lang }) => (
    <section className="z-kategorija-naslovne z-video-naslovne">
        <Container>
            <div className="z-kategorija-naslovne__vrh">
                <h3 className="z-kategorija-naslovne__naslov">{'Video'.translate(lang)}</h3>
                <Link className="z-kategorija-naslovne__sve" to="/video">
                    {'Svi snimci'.translate(lang)} &rarr;
                </Link>
            </div>
            <div className="z-video-naslovne__mreza">
                {videos.slice(0, 3).map((v, i) => {
                    // Naslov stiže u oba jezika, pa se prevodi pre ispisa.
                    const naslov = Object.translate(v, 'title', lang) || '';
                    return (
                        <a key={v._id || i} href={v.link} target="_blank" rel="noopener noreferrer" className="z-video-naslovne__kartica">
                            <span className="z-video-naslovne__slika">
                                {v.thumbnail ? <img src={v.thumbnail} alt={naslov} loading="lazy" /> : null}
                                <span className="z-video-naslovne__igraj" aria-hidden="true">&#9654;</span>
                            </span>
                            <span className="z-video-naslovne__naslov">{naslov}</span>
                        </a>
                    );
                })}
            </div>
        </Container>
    </section>
);

const Reklama = ({ baner, bannerClick }) => (
    <section className="odeljak reklama">
        <Container>
            <div className="mesto-reklame">
                {baner.images.map((b, bi) => (
                    <BanerSlika key={bi} baner={baner} slika={b} onClick={bannerClick} />
                ))}
            </div>
        </Container>
    </section>
);

const KategorijeNaslovne = ({ homeCategories, lang, banners, bannerClick, videos, settings }) => {
    const kategorije = kategorijeZaNaslovnu(homeCategories);

    // Gde u nizu stoji video: posle svih kategorija sa pozicijom ≤ njegove.
    const podesavanja = settings || {};
    const imaVidea = podesavanja.videoNaPocetnoj !== false && videos && videos.length;
    const pozicijaVidea = podesavanja.videoPozicija;
    const mestoVidea = !imaVidea ? -1
        : (pozicijaVidea === null || pozicijaVidea === undefined || pozicijaVidea === '')
            ? kategorije.length
            : kategorije.filter((k) => (k.position || 0) <= Number(pozicijaVidea)).length;

    const odeljakVidea = <VideoNaslovne key="video" videos={videos || []} lang={lang} />;

    return (
        <>
            {mestoVidea === 0 ? odeljakVidea : null}
            {kategorije.map((k, idx) => {
                // Iz obrasca stiže kao tekst („1" ili „2"), iz baze kao broj.
                const redova = Number(k.homeRows) === 2 ? 2 : 1;
                const galerije = k.photos.slice(0, redova * 5);
                const alias = Object.translate(k, 'alias', lang) || (k.alias && k.alias.ba);
                const baner = idx % 2 === 1 && banners ? banners[Math.floor(idx / 2)] : null;

                return (
                    <React.Fragment key={k._id || idx}>
                        <section className="z-kategorija-naslovne">
                            <Container>
                                <div className="z-kategorija-naslovne__vrh">
                                    <h3 className="z-kategorija-naslovne__naslov">{Object.translate(k, 'name', lang)}</h3>
                                    <Link className="z-kategorija-naslovne__sve" to={`/galerije?category=${alias}`}>
                                        {'Sve galerije'.translate(lang)} &rarr;
                                    </Link>
                                </div>
                                <div className="z-kategorija-naslovne__mreza">
                                    {galerije.map((g, i) => (
                                        <Article
                                            key={g._id || i}
                                            _id={g._id}
                                            image={g.photos && g.photos[0] && g.photos[0].image}
                                            name={Object.translate(g, 'name', lang)}
                                            alias={Object.translate(g, 'alias', lang)}
                                            imagesCount={g.photosCount !== undefined ? g.photosCount : (g.photos && g.photos.length)}
                                            location={g.location}
                                            published={g.date}
                                            lang={lang}
                                        />
                                    ))}
                                </div>
                            </Container>
                        </section>

                        {baner && baner.images ? <Reklama baner={baner} bannerClick={bannerClick} /> : null}
                        {mestoVidea === idx + 1 ? odeljakVidea : null}
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default KategorijeNaslovne;
