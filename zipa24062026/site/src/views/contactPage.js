import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import Page from '../containers/page';


import {
    Container,
    Row,
    Col,
} from 'reactstrap';


import Form from '../components/forms/contactForm';

import rightArrow from '../assets/svg/right-arrow.svg';

import bg from '../assets/images/category-bg.jpg';
import { API_ENDPOINT } from '../constants';



class ContactPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            ...props.initialData
        };
    }

    init() {
        window.scrollTo(0, 0);

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }

    }

    componentDidMount() {
        this.init()

    }

    componentDidUpdate(prevProps) {

        if (prevProps[0].location.pathname != this.props[0].location.pathname) {
            this.init();
        }
    }


    submit = (data) => {
        fetch(`${API_ENDPOINT}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(data)
        }).then(res => res.json()).then((result) => {
            this.setState({
                done: true
            })
        })

    }


    render() {

        return (
            <div className="contact-wrap">
                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="12">
                                <h1>{'Kontakt'.translate(this.props.lang)}</h1>
                                <p>{'Kontaktirajte nas'.translate(this.props.lang)}</p>
                            </Col>
                        </Row>

                    </Container>
                </div>

                <section className="section-dynamic">
                    <Container>
                        <Row>
                            <Col lg="12">
                                <div className="contact-info">
                                    <h3>{"Stojimo Vam na raspolaganju za sva pitanja. ".translate(this.props.lang)}</h3>
                                    <p>
                                        {"Možete nas kontaktirati putem telefona ili na E-mail, a mozete da popunite kontakt formu koja se nalazi ispod. Odgovorićemo Vam u što kraćem roku. Hvala vam sto ste nas kontaktirali.".translate(this.props.lang)}

                                    </p>
                                    <hr />
                                    <Row>
                                        <Col lg="6">
                                            <h4>{"Kontakt informacije".translate(this.props.lang)}</h4>
                                            <div className="contact-field">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54"><g id="Group_275" data-name="Group 275" transform="translate(-400 -545)"><circle id="Ellipse_38" data-name="Ellipse 38" cx="27" cy="27" r="27" transform="translate(400 545)" fill="#3C59B9"></circle><path id="iconfinder_phone_1608790" d="M216,146.955a5.627,5.627,0,0,1-.17,1.2,6.771,6.771,0,0,1-.358,1.168,4.57,4.57,0,0,1-2.08,1.807,6.319,6.319,0,0,1-4.065.81,7.366,7.366,0,0,1-.98-.213q-.545-.153-.81-.247t-.946-.349q-.682-.256-.835-.307a15.437,15.437,0,0,1-2.983-1.415,28.631,28.631,0,0,1-8.182-8.182,15.436,15.436,0,0,1-1.415-2.983q-.051-.153-.307-.835t-.349-.946q-.094-.264-.247-.81a7.363,7.363,0,0,1-.213-.98,6.319,6.319,0,0,1,.81-4.065,4.57,4.57,0,0,1,1.807-2.08,6.771,6.771,0,0,1,1.168-.358,5.627,5.627,0,0,1,1.2-.17.955.955,0,0,1,.358.051q.307.1.9,1.3.188.324.511.92t.6,1.082q.273.486.528.912.051.068.3.426a4.758,4.758,0,0,1,.366.605,1.112,1.112,0,0,1,.119.486,1.415,1.415,0,0,1-.486.852,8.309,8.309,0,0,1-1.057.938,10.265,10.265,0,0,0-1.057.9,1.3,1.3,0,0,0-.486.784,1.152,1.152,0,0,0,.085.384,3.724,3.724,0,0,0,.145.349q.06.119.239.409t.2.324a16.894,16.894,0,0,0,6.972,6.972q.034.017.324.2t.409.239a3.717,3.717,0,0,0,.349.145,1.151,1.151,0,0,0,.384.085,1.3,1.3,0,0,0,.784-.486,10.267,10.267,0,0,0,.9-1.057,8.309,8.309,0,0,1,.938-1.057,1.415,1.415,0,0,1,.852-.486,1.112,1.112,0,0,1,.486.119,4.762,4.762,0,0,1,.605.366q.358.247.426.3.426.256.912.528t1.082.6q.6.324.92.511,1.193.6,1.3.9A.955.955,0,0,1,216,146.955Z" transform="translate(223 432)" fill="#fff"></path></g></svg>                                        <div className="contact-field-info">
                                                    <h5>{"Telefon".translate(this.props.lang)}</h5>
                                                    <h6>{this.props.settings.phoneNumber}</h6>
                                                </div>
                                            </div>
                                            <div className="contact-field">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54"><g id="Group_276" data-name="Group 276" transform="translate(-400 -615)"><circle id="Ellipse_39" data-name="Ellipse 39" cx="27" cy="27" r="27" transform="translate(400 615)" fill="#3C59B9"></circle><g id="Layer_17" data-name="Layer 17" transform="translate(412 628.517)"><path id="Path_384" data-name="Path 384" d="M23.418,6H6.582A3.591,3.591,0,0,0,3,9.591V19.948a3.591,3.591,0,0,0,3.582,3.591H23.418A3.591,3.591,0,0,0,27,19.948V9.591A3.591,3.591,0,0,0,23.418,6Zm0,1.846h.148L15,14.086,6.434,7.846H23.418Zm1.735,12.1a1.745,1.745,0,0,1-1.735,1.745H6.582a1.745,1.745,0,0,1-1.735-1.745V9.591a1.772,1.772,0,0,1,.092-.545l9.526,6.932a.923.923,0,0,0,1.089,0l9.517-6.932a1.772,1.772,0,0,1,.092.545Z" transform="translate(0 0)" fill="#fff"></path></g></g></svg>                                        <div className="contact-field-info">
                                                    <h5>{"E-mail".translate(this.props.lang)}</h5>
                                                    <h6>info@zipaphoto.net</h6>
                                                    <h6>zipaphoto@gmail.com</h6>

                                                </div>
                                            </div>

                                        </Col>
                                        <Col lg="6">
                                            <h4>{"Lokacija".translate(this.props.lang)}</h4>
                                            <div className="contact-field">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54"><g id="Group_277" data-name="Group 277" transform="translate(-400 -755)"><circle id="Ellipse_40" data-name="Ellipse 40" cx="27" cy="27" r="27" transform="translate(400 755)" fill="#3C59B9"></circle><g id="iconfinder_LocationPin_1737382" transform="translate(313.474 715.218)"><path id="Path_385" data-name="Path 385" d="M113.857,54.872a9.029,9.029,0,0,0-9.019,9.019c0,8,8.115,14.291,8.461,14.555l.558.426.558-.426c.346-.264,8.461-6.558,8.461-14.555A9.029,9.029,0,0,0,113.857,54.872Zm0,21.651c-1.778-1.53-7.181-6.671-7.181-12.633a7.181,7.181,0,1,1,14.363,0C121.038,69.839,115.633,74.991,113.856,76.523Z" transform="translate(0 0)" fill="#fff"></path><path id="Path_386" data-name="Path 386" d="M198.552,142.966a3.522,3.522,0,1,0,3.522,3.522A3.523,3.523,0,0,0,198.552,142.966Z" transform="translate(-84.834 -82.853)" fill="#fff"></path></g></g></svg>                                        <div className="contact-field-info">
                                                    <h5>{"Adresa".translate(this.props.lang)}</h5>
                                                    <h6 dangerouslySetInnerHTML={{ __html: this.props.settings.location && this.props.settings.location.replace(/\n/g, '<br/>') }}></h6>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                    <hr />
                                </div>
                            </Col>
                            <Col lg="12">
                                <div className="contact-form">
                                    <p style={{ fontSize: 12 }}>*Molimo vas popunite sva polja.</p>
                                    <Form lang={this.props.lang} onSubmit={this.submit} />
                                    {
                                        this.state.done ?
                                            <p>{'Poruka je poslata. Očekujte odgovor ubrzo!'}</p>
                                            :
                                            null
                                    }
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>


            </div>
        );
    }
}

export default Page(ContactPage);