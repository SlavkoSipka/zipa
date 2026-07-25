import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';

import logo from '../assets/svg/footer-logo.svg';

import social1 from '../assets/svg/social1.svg';
import social2 from '../assets/svg/social2.svg';
import social3 from '../assets/svg/social3.svg';
import social4 from '../assets/svg/social4.svg';
import social5 from '../assets/svg/social5.svg';
import social6 from '../assets/svg/social6.svg';

import rightArrow from '../assets/svg/right-arrow.svg';
import BlogArticle from '../components/articles/blogArticle';
import newsletterIcon from '../assets/svg/newsletter-icon.svg';


import phoneIcon from '../assets/svg/footer-phone.svg';
import locationIcon from '../assets/svg/footer-location.svg';

import {
    Container,
    Row,
    Col,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    UncontrolledDropdown
} from 'reactstrap';
import { API_ENDPOINT } from '../constants';

class Footer extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }




    render() {
        return (
            <>

                {this.props.settings.enableInfoBlocks ?
                    <section className="section-info-blocks">

                        <Container>
                            <Row>
                                {
                                    this.props.settings.infoblock.map((item, idx) => {
                                        return (
                                            <Col lg="3" className="item">
                                                <Isvg src={item.icon} />
                                                <div>
                                                    <h6>{Object.translate(item, 'value', this.props.lang)}</h6>
                                                    <p>{Object.translate(item, 'name', this.props.lang)}</p>
                                                </div>
                                            </Col>
                                        )
                                    })
                                }

                            </Row>
                        </Container>
                    </section>
                    :

                    <section className="section-newsletter">

                        <Container>
                            <Row>
                                <Col lg="12" >
                                    <div className="content">
                                        <Isvg src={newsletterIcon} />

                                        <Row>
                                            <Col lg="6">
                                                <h3><span>{'PRIJAVITE SE'.translate(this.props.lang)}</span> {'NA'.translate(this.props.lang)}<br />{'NAŠ NEWSLETTER'.translate(this.props.lang)}</h3>
                                            </Col>
                                            <Col lg="6">
                                                {this.state._done ?
                                                    <p className="done">{'Uspješno ste se prijavili na naš newsletter'.translate(this.props.lang)}</p>
                                                    :
                                                    <div className="input">
                                                        <input type="text" value={this.state.email} onChange={(e) => this.setState({ email: e.target.value })} placeholder={'Unesite svoju e-mail adresu'.translate(this.props.lang)} />
                                                        <button onClick={() => {
                                                            fetch(`${API_ENDPOINT}/newsletter/subscribe`, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json'
                                                                },
                                                                body: JSON.stringify({ email: this.state.email })
                                                            }).then((res) => res.json()).then((result) => {
                                                                if (!result.error) {
                                                                    this.setState({
                                                                        _done: true,
                                                                        _error: null,
                                                                    })
                                                                } else {
                                                                    this.setState({
                                                                        _error: true,
                                                                        _done: null
                                                                    })
                                                                }
                                                            })
                                                        }}>{'PRIJAVI SE'.translate(this.props.lang)}</button>
                                                    </div>
                                                }
                                                {
                                                    this.state._error ?
                                                        <p className="err">{'Greška!'.translate(this.props.lang)}</p>
                                                        :
                                                        null
                                                }
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>
                            </Row>
                        </Container>

                    </section>
                }

                <footer>
                    <Container>
                        <Row>
                            <Col lg="4" className="f-col-1">
                                <Isvg src={this.props.settings.footerLogo} />
                                <div className="contact">
                                    <div><Isvg src={phoneIcon} /> {'POZOVITE NAS'.translate(this.props.lang)}</div>
                                    <p>{this.props.settings.phoneNumber}</p>
                                </div>
                                <div className="contact">
                                    <div><Isvg src={locationIcon} /> {'LOKACIJA'.translate(this.props.lang)}</div>
                                    {
                                        <p dangerouslySetInnerHTML={{ __html: this.props.settings.location && this.props.settings.location.replace(/\n/g, '<br/>') }}></p>
                                    }
                                </div>

                            </Col>
                            <Col lg="4" className="f-col-2">
                                <div>
                                    <h6>{'NAVIGACIJA'.translate(this.props.lang)}</h6>
                                    <ul>
                                        <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                        <li><Link to='/help'>{'Pomoć'.translate(this.props.lang)}</Link></li>
                                        <li><Link to='/galerije'>{'Galerije'.translate(this.props.lang)}</Link></li>
                                        <li><Link to='/page/uslovi-koriscenja'>{'Uslovi korišćenja'.translate(this.props.lang)}</Link></li>
                                        <li><Link to='/page/o-nama'>{'Agencija'.translate(this.props.lang)}</Link></li>
                                        <li><Link to='/contact'>{'Kontakt'.translate(this.props.lang)}</Link></li>
                                    </ul>
                                </div>
                                <div>
                                    <h6>{'PRATITE NAS'.translate(this.props.lang)}</h6>
                                    <div className="social">
                                        <a href={this.props.settings.facebook} target="_blank"><Isvg src={social1} /></a>
                                        <a href={this.props.settings.instagram} target="_blank"><Isvg src={social2} /></a>
                                        <a href={this.props.settings.twitter} target="_blank"><Isvg src={social3} /></a>
                                        <a href={this.props.settings.pinterest} target="_blank"><Isvg src={social4} /></a>
                                        <a href={this.props.settings.tumblr} target="_blank"><Isvg src={social5} /></a>
                                        <a href={this.props.settings.linkedin} target="_blank"><Isvg src={social6} /></a>
                                    </div>
                                </div>
                            </Col>
                            <Col lg={{ size: 4 }} className="f-col-3">
                                {this.props.footerBanner ?
                                    <div className="banner" >
                                        {
                                            this.props.footerBanner.images.map((item, idx) => {
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

                            <Col lg="12">
                                <div className="spacer"></div>
                            </Col>
                            <Col lg="12" className="copyright">
                                <p>Copyright © ZIPA PHOTO AGENCY  - 1990-2024. All Rights Reserved.</p>
                                <p>Created by <a target="_blank" href="https://novamedia.agency">nova media.</a></p>
                            </Col>
                        </Row>
                    </Container>

                </footer>
            </>
        );
    }
}

export default Footer;