import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';


import Form from '../../components/forms/registerForm';

import emailSent from '../../assets/svg/email-sent.svg';
import sponsor from '../../assets/images/sponsor.png';
import { API_ENDPOINT } from '../../constants';

class RegisterPage extends Component {
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
        fetch(`${API_ENDPOINT}/user/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(res => res.json()).then((result) => {
            if (result.error) {
                this.setState({
                    error: result.error
                })
            } else {
                this.setState({
                    done: true
                })
            }
        })
    }

    render() {

        return (
            <div className="login-wrap">
                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="7">
                                <h1>{'Kreirajte nalog'.translate(this.props.lang)}</h1>
                                <h2>{'Registrujte se kako bi mogli koristiti usluge'.translate(this.props.lang)}<br />
                                    {'našeg foto servisa. Nakon registracije'.translate(this.props.lang)}<br />
                                    {'Vaš nalog ćemo ručno odobriti.'.translate(this.props.lang)}</h2>
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


                                <p className="text">{'Poštovani korisnici, dobrodošli na sajt ZIPA PHOTO AGENCY (www.zipaphoto.net). Molimo Vas da prije korištenja naših usluga, pažljivo pročitate Uslove korištenja. Lični podaci koje proslijedite sajtu ZIPA PHOTO AGENCY (www.zipaphoto.net) u svrhu registracije, dobijanja ili kupovine fotografija ili usluga biće tretirane u skladu sa našim dokumentom o privatnosti na mreži. Zabranjeno je slanje ili prenošenje na ovu lokaciju ili sa nje bilo kojih nezakonitih, pratećih, uvredljivih, klevetničkih, opscenih, pornografskih ili drugih materijala koji su u suprotnosti sa bilo kojim zakonom.'.translate(this.props.lang)}</p>

                            </Col>
                            <Col lg={{ size: 5 }}>
                                <div className="form-box">
                                    <div className="form-wrap">
                                        <h6>Registracija</h6>
                                        <p>Besplatna registracija na na prvi foto servis u Bosni i Hercegovini.</p>
                                        {!this.state.done ?
                                            <>
                                                <Form onSubmit={this.submit} />
                                                {this.state.error ? <p className="error">{this.state.error}</p> : null}
                                            </>
                                            :
                                            <div className="email-sent">
                                                <Isvg src={emailSent} />
                                                <h6>{'Poslali smo Vam E-mail'.translate(this.props.lang)}</h6>
                                                <p>{'Primićete E-mail sa linkom za verifikaciju naloga.'.translate(this.props.lang)}</p>
                                            </div>
                                        }
                                    </div>
                                    <div className="spacer"></div>
                                    <p className="bottom-link">{'Već imate nalog?'.translate(this.props.lang)} <Link to='/login'>{'Ulogujte se'.translate(this.props.lang)}</Link></p>
                                </div>
                            </Col>
                        </Row>
                    </Container>

                </div>



            </div>
        );
    }
}

export default Page(RegisterPage);