import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';

import Article from './articles/article';

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
 */

// Kategorije koje imaju galerije, redom koji je zadat u administraciji.
export const kategorijeZaNaslovnu = (homeCategories) => (homeCategories || [])
    .filter((k) => k && k.photos && k.photos.length)
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0));

const KategorijeNaslovne = ({ homeCategories, lang, banners, bannerClick }) => (
    <>
        {kategorijeZaNaslovnu(homeCategories).map((k, idx) => {
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

                    {baner && baner.images ? (
                        <section className="odeljak reklama">
                            <Container>
                                <div className="mesto-reklame">
                                    {baner.images.map((b, bi) => (
                                        <a key={bi} href={b.link} target="_blank" rel="noopener noreferrer"
                                           onClick={() => bannerClick && bannerClick(b.link)}>
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
    </>
);

export default KategorijeNaslovne;
