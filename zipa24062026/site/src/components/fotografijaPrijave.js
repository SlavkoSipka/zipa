import React from 'react';
import moment from 'moment';
import { PHOTOS_ENDPOINT } from '../constants';

/*
 * Fotografija uz obrazac na `/login` i `/register`.
 *
 * Redom se uzima:
 *   1. sopstvena fotografija postavljena u administraciji
 *      (`loginGallery.fotografija`, uz neobavezan `potpis`);
 *   2. galerija izabrana u administraciji (`loginGallery.id`);
 *   3. najnovija galerija.
 */
export default function FotografijaPrijave({ props, lang }) {
    const izbor = props.settings && props.settings.loginGallery;

    let slika = null;
    let naslov = '';
    let podaci = '';

    if (izbor && izbor.fotografija) {
        slika = izbor.fotografija;
        naslov = izbor.potpis || '';
    } else {
        const g = props.prijavaGalerija || props.najava;
        if (g && g.photos && g.photos[0]) {
            slika = `${PHOTOS_ENDPOINT}/photos/700x/${g.photos[0].image}`;
            naslov = Object.translate(g, 'name', lang);
            podaci = [g.user, g.location, g.date ? moment.unix(g.date).format('YYYY.') : null]
                .filter(Boolean).join(' · ');
        }
    }

    if (!slika) return null;

    return (
        <div className="z-prijava__slika">
            <img src={slika} alt="" loading="lazy" decoding="async" />
            {naslov || podaci ? (
                <div className="z-prijava__potpis">
                    {naslov ? <p className="z-prijava__potpis-naslov">{naslov}</p> : null}
                    {podaci ? <p className="z-prijava__potpis-podaci">{podaci}</p> : null}
                </div>
            ) : null}
        </div>
    );
}
