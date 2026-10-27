import React from 'react';

/*
 * ŠIROKI BANER — mera koju bira administrator (2026-10-27).
 *
 * Visina je jedna od tri stalne (niska, srednja, visoka); širinu administrator
 * bira sam, u granicama sadržaja strane i najviše dvanaest puta šire od
 * visine — šire od toga je na tabletu i telefonu nečitljivo. Administracija
 * iz toga ispiše tačnu meru slike u pikselima (`VelicinaBanera` u
 * `forms/fields/velicinaBanera.js`), pa se baner pravi baš za to mesto.
 *
 * Na telefonu široki baner postaje tanka traka, zato svaka slika banera može
 * imati i svoju SLIKU ZA TELEFON (`mobilna`), uvek iste mere 640 × 200 px —
 * na svakom telefonu staje celom širinom i čita se.
 *
 * Baner bez izabrane mere (stari zapisi) se prikazuje kao i do sada.
 */

export const VISINE = [
    { px: 90, naziv: 'Niska' },
    { px: 150, naziv: 'Srednja' },
    { px: 250, naziv: 'Visoka' },
];
export const NAJMANJA_SIRINA = 300;
// Širina sadržaja strane (`Container` na 1200px i šire) — šire se ne vidi.
export const SIRINA_SADRZAJA = 1110;
export const NAJVECI_ODNOS = 12;
export const RAZMAK_SLIKA = 16;
export const MOBILNA = { sirina: 640, visina: 200 };
// Od ove širine se predlaže posebna slika za telefon.
export const PRAG_ZA_TELEFON = 600;

// Najveća širina jedne slike: sadržaj strane podeljen na slike u redu, i ne šire od 12 : 1.
export const najvecaSirina = (visina, brojSlika) => {
    const n = Math.max(1, brojSlika || 1);
    const poSlici = Math.floor((SIRINA_SADRZAJA - (n - 1) * RAZMAK_SLIKA) / n);
    return Math.max(NAJMANJA_SIRINA, Math.min(poSlici, visina ? visina * NAJVECI_ODNOS : poSlici));
};

export const imaMeru = (baner) => !!(baner && baner.sirina && baner.visina);

/*
 * Jedna slika banera sa vezom. Mera ide u `style` (pobeđuje stara pravila
 * mesta reklame, koja seku na 980px), a odnos stranica kroz promenljivu, da
 * ga na telefonu slika za telefon može zameniti svojim (16 : 5).
 */
const BanerSlika = ({ baner, slika, onClick }) => {
    if (!slika || !slika.image) return null;
    const mera = imaMeru(baner);
    const mobilna = slika.mobilna;

    const klasa = 'z-baner' + (mera ? ' z-baner--mera' : '') + (mobilna ? ' z-baner--mobilna' : '');
    const stil = mera ? { width: '100%', maxWidth: `${baner.sirina}px`, '--baner-odnos': `${baner.sirina} / ${baner.visina}` } : null;
    const img = <img className="z-baner__slika" src={slika.image} alt="" loading="lazy"
                     width={mera ? baner.sirina : undefined} height={mera ? baner.visina : undefined} />;

    return (
        <a className={klasa} style={stil} href={slika.link} target="_blank" rel="noopener noreferrer"
           onClick={() => onClick && onClick(slika.link)}>
            {mobilna ? (
                <picture>
                    <source media="(max-width: 767px)" srcSet={mobilna} />
                    {img}
                </picture>
            ) : img}
        </a>
    );
};

export default BanerSlika;
