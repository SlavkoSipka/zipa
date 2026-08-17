import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';

import Form from '../../components/forms/loginForm';
import sponsor from '../../assets/images/sponsor.png';
import { API_ENDPOINT } from '../../constants';

class LoginPage extends Component {
    constructor(props) {
        super(props);
        this.submit = this.submit.bind(this);

        this.state = {

        };
    }




    componentDidMount() {

        if (typeof window !== 'undefined') { window.scrollTo(0, 0); }
        this.props.updateMeta(this.props.generateSeoTags(null));


    }


    submit(data) {
        let cart = localStorage.getItem('cart');
        if (!cart) {
            cart = [];
        } else {
            cart = JSON.parse(cart);
        }



        fetch(`${API_ENDPOINT}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...data, cart })
        }).then(res => res.json()).then((result) => {
            if (result.error) {
                this.setState({
                    error: result.error
                })
            } else {
                localStorage.setItem('authToken', result.token);
                localStorage.removeItem('cart');
                this.props.verifyUser();
                this.props[0].history.push('/account/profile')
            }
        })
    }



    render() {

        /*
         * Stranica za prijavu prati izabrani izgled naslovne, jer je traženo da
         * se za svaki predlog razlikuje. Razlika je u boji i rasporedu, ne u
         * sadržaju — polja i dugmad ostaju ista, pa se ništa ne uči iznova.
         */
        const izgled = (this.props.settings && this.props.settings.homepageLayout) || 'trenutni';
        const razred = izgled !== 'trenutni' ? `login-wrap prijava-${izgled}` : 'login-wrap';

        return (
            <div className={razred}>
                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="7">
                                <h1>{'Dobrodošli nazad'.translate(this.props.lang)}</h1>
                                <h2>{'Ulogujte se kako bi mogli koristiti usluge'.translate(this.props.lang)}<br />{'našeg foto servisa.'.translate(this.props.lang)}</h2>
                                <h6>{'GENERALNI SPONZOR'.translate(this.props.lang)}</h6>
                                {this.props.sponsorBanner ?
                                    <div className="sponsor-banners-wrap">
                                        {
                                            this.props.sponsorBanner.images.map((item, idx) => {
                                                return (
                                                    <a href={item.link} target="_blank" onClick={() => this.props.bannerClick(item.link)}>
                                                        <img key={idx} src={item.image} />
                                                    </a>

                                                )
                                            })
                                        }
                                    </div>

                                    :
                                    null

                                }
                            </Col>
                            <Col lg={{ size: 5 }}>
                                <div className="form-box">
                                    <div className="form-wrap">
                                        <h6>{'Login'.translate(this.props.lang)}</h6>
                                        <p>{'Prijavite se na svoj nalog da biste nastavili.'.translate(this.props.lang)}</p>
                                        <Form onSubmit={this.submit} />
                                        {this.state.error ? <p className="error">{this.state.error}</p> : null}
                                        {
                                            this.state.error ? <p className="error">{'Za sva pitanje kontaktirajte nas na e-mail: info@zipaphoto.com ili na telefon: +387 66 00 11 22'}</p> : null
                                        }
                                    </div>
                                    <div className="spacer"></div>
                                    <p className="bottom-link">{'Niste registrovani?'.translate(this.props.lang)} <Link to='/register'>{'Kreirajte nalog'.translate(this.props.lang)}</Link></p>
                                </div>
                            </Col>
                        </Row>
                    </Container>

                </div>



            </div>
        );
    }
}

export default Page(LoginPage);