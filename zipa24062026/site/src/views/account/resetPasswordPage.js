import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';


import Form from '../../components/forms/resetPassword';

import emailSent from '../../assets/svg/email-sent.svg';
import sponsor from '../../assets/images/sponsor.png';
import { API_ENDPOINT } from '../../constants';


class ResetPasswordPage extends Component {
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
        fetch(`${API_ENDPOINT}/user/reset-password`, {
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
                                <h1>{'Ne brinite'.translate(this.props.lang)}</h1>
                                <h2>{'Unesite Vašu E-mail adresu i primićete'.translate(this.props.lang)}<br /> {'E-mail sa linkom za reset lozinke.'.translate(this.props.lang)}</h2>
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
                                <div className="form-box reset-password-box">
                                    <div className="form-wrap">
                                        <h6>{'Resetujte lozinku'.translate(this.props.lang)}</h6>
                                        <p>{'Unesite svoj E-mail za resetovanje lozinku'.translate(this.props.lang)}</p>
                                        {!this.state.done ?
                                            <>
                                                <Form onSubmit={this.submit} />
                                                {this.state.error ? <p className="error">{this.state.error}</p> : null}
                                            </>
                                            :
                                            <div className="email-sent">
                                                <Isvg src={emailSent} />
                                                <h6>{'Poslali smo Vam E-mail'.translate(this.props.lang)}</h6>
                                                <p>{'Primićete E-mail sa linkom za resetovanje lozinke.'.translate(this.props.lang)}</p>
                                            </div>
                                        }


                                    </div>
                                    <div className="spacer"></div>
                                    <p className="bottom-link">{'Već imate nalog?'.translate(this.props.lang)}  <Link to='/login'>{'Ulogujte se'.translate(this.props.lang)}</Link></p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                    <p className="copyright">© 2024 zipaphoto.net All rights reserved. Made with love for a better web.</p>

                </div>



            </div>
        );
    }
}

export default Page(ResetPasswordPage);