import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';

import Header from '../components/header';
import Footer from '../components/footer';

import solution1 from '../assets/images/solution1.png';
import closeIcon from '../assets/svg/close-modal.svg';

import DocumentMeta from 'react-document-meta';
import { Container, Row, Col } from 'reactstrap';
import DetailSearchForm from '../components/forms/detailSearchForm';
import IskacucaReklama from '../components/iskacucaReklama';


function generateSearchLink(params) {
    params.detailSearch = true;

    let paramsGroup = [];
    for (var key in params) {
        if (params.hasOwnProperty(key) && params[key]) {
            if (key && params[key]){
                let value = params[key];
                if (key =='keywords'){
                    value = params[key].join(',');
                }
                paramsGroup.push(`${key}=${params[key]}`)
            }
        }
    }


    return `?${paramsGroup.join('&')}`;
}

export const DefaultLayout = (Wrapped) => (props) => {
    // Dok je napredna pretraga otvorena, strana ispod nje se ne pomera.
    React.useEffect(() => {
        if (typeof document === 'undefined') return undefined;
        const koren = document.documentElement;
        if (props.detailSearch) koren.classList.add('z-bez-skrola');
        else koren.classList.remove('z-bez-skrola');
        return () => koren.classList.remove('z-bez-skrola');
    }, [props.detailSearch]);

    return (
        <div className={"wrapper"}>
            <Header {...props} />
            <Wrapped {...props} />
            <Footer {...props} />

            {/* Iskačuća reklama — samo na telefonu, i samo ako je uključena
                u Podešavanjima sajta. */}
            <IskacucaReklama
                ukljucena={props.settings && props.settings.mobilePopup}
                baner={props.mobilePopupBanner}
                bannerClick={props.bannerClick}
            />
            {props.detailSearch ?
                /* Zavesa zatvara prozor na klik IZVAN okvira — provera
                   `e.target === e.currentTarget` da klik unutar obrasca ne
                   propadne do nje. Escape hvata sam obrazac. */
                <div className="detail-search-modal z-pretraga-prozor"
                     role="dialog"
                     aria-modal="true"
                     aria-label={'Napredna pretraga'.translate(props.lang)}
                     onClick={(e) => { if (e.target === e.currentTarget) props.handleDetailSearch(null); }}>
                    <div className="z-pretraga-prozor__okvir">
                        <div className="z-pretraga-prozor__vrh">
                            <h2 className="z-pretraga-prozor__naslov">{'Napredna pretraga'.translate(props.lang)}</h2>
                            <button type="button"
                                    className="z-pretraga-prozor__zatvori"
                                    aria-label={'Zatvori'.translate(props.lang)}
                                    onClick={() => props.handleDetailSearch(null)}>
                                <Isvg src={closeIcon} />
                            </button>
                        </div>
                            <DetailSearchForm lang={props.lang} photographers={props.photographers} handleDetailSearch={props.handleDetailSearch} onSubmit={(data) => {
                                if (data['date-to']) {
                                    let date = new Date(data['date-to'] * 1000);
                                    date.setHours(23, 59, 59, 0);
                                    data['date-to'] = date.getTime() / 1000;
                                }
                                let searchLink = generateSearchLink(data);
                                props[0].history.push(`/galerije${searchLink}`);
                                props.handleDetailSearch(null);
                            }}></DetailSearchForm>
                    </div>
                </div>
                :
                null
            }

        </div>
    );
};

export default DefaultLayout;