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
    return (
        <div className={"wrapper"}>
            <Header {...props} />
            <Wrapped {...props} />
            <Footer {...props} />
            {props.detailSearch ?
                <div className="detail-search-modal">
                    <div>
                        <Container>
                            <Row>
                                <Col lg="12">
                                    <h3>Napredna pretraga</h3>
                                    <button className="close" onClick={() => props.handleDetailSearch(null)}><Isvg src={closeIcon} /></button>
                                </Col>

                            </Row>
                            <DetailSearchForm photographers={props.photographers} handleDetailSearch={props.handleDetailSearch} onSubmit={(data) => {
                                if (data['date-to']) {
                                    let date = new Date(data['date-to'] * 1000);
                                    date.setHours(23, 59, 59, 0);
                                    data['date-to'] = date.getTime() / 1000;
                                }
                                let searchLink = generateSearchLink(data);
                                props[0].history.push(`/galerije${searchLink}`);
                                props.handleDetailSearch(null);
                            }}></DetailSearchForm>
                        </Container>
                    </div>
                </div>
                :
                null
            }

        </div>
    );
};

export default DefaultLayout;