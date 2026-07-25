import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';


import Form from '../../components/forms/changePasswordForm';

import downArrow from '../../assets/svg/down-arrow.svg';
import facebook from '../../assets/svg/login-facebook.svg';
import twitter from '../../assets/svg/login-twitter.svg';
import google from '../../assets/svg/login-google.svg';
import { API_ENDPOINT } from '../../constants';


import bg from '../../assets/images/bg.jpg';


class ChangePasswordPage extends Component {
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
        fetch(`${API_ENDPOINT}/user/reset-password/${this.props[0].match.params.uid}/${this.props[0].match.params.resetPasswordVerificationCode}`, {
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
                localStorage.setItem('authToken', result.token);
                localStorage.removeItem('cart');
                this.props.verifyUser();
                this.props[0].history.push('/')
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
                                {/*  <h1>Dont't Worry</h1>
                                <h2>You can always login with social media</h2>*/}
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
                                        <h6>Resetuj loziniku</h6>
                                        <p>Unesite novu lozinku</p>

                                        <Form onSubmit={this.submit} />
                                        {this.state.error ? <p className="error">{this.state.error}</p> : null}

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

export default Page(ChangePasswordPage);