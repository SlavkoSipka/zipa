import React from 'react';

/*
 * PORUKA KAD ORIGINALA NEMA NA SAJTU (2026-11-06).
 *
 * Originali starijih galerija se brišu po podešavanju agencije
 * (`api/originali.js`); pregled sa žigom ostaje. Tada kupac ne može da
 * kupi preko korpe nego se javlja agenciji, koja fotografiju dostavlja iz
 * arhive po uplati. Telefon i e-pošta se čitaju iz Podešavanja sajta, a
 * e-pošta stiže sa već upisanom galerijom i nazivom fotografije.
 */
const OriginalNedostupan = ({ settings, galerija, fotografija, lang, className }) => {
    const s = settings || {};
    const telefon = s.phoneNumber || '+387 66 00 11 22';
    const email = s.email || 'info@zipaphoto.net';
    const naslov = `Fotografija iz arhive: ${galerija || ''}`.trim();
    const telo = `Poštovani,\n\nželim da kupim fotografiju iz arhive.\n\nGalerija: ${galerija || ''}\nFotografija: ${fotografija || ''}\nVeličina / namjena: \n\nIme i prezime:\nTelefon:\n`;
    const veza = `mailto:${email}?subject=${encodeURIComponent(naslov)}&body=${encodeURIComponent(telo)}`;

    return (
        <div className={'z-original-nedostupan' + (className ? ' ' + className : '')} role="note">
            <strong>{'Original ove fotografije nije više dostupan na sajtu.'.translate(lang)}</strong>
            <span>
                {'Fotografiju dostavljamo iz arhive nakon uplate — pozovite nas ili pošaljite e-mail.'.translate(lang)}
            </span>
            <span className="z-original-nedostupan__veze">
                <a href={`tel:${telefon.replace(/[^+\d]/g, '')}`}>{telefon}</a>
                <a href={veza}>{email}</a>
            </span>
        </div>
    );
};

export default OriginalNedostupan;
