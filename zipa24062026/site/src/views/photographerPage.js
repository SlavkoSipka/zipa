import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import Page from '../containers/page';


import {
    Container,
    Row,
    Col,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    UncontrolledDropdown,
    CarouselControl,
    Carousel,
    CarouselItem

} from 'reactstrap';

import Image from '../components/image';


import moment from 'moment';

import searchIcon from '../assets/svg/search-icon-btn.svg';
import picture from '../assets/svg/picture-icon.svg';
import image1 from '../assets/images/image1.png';
import image2 from '../assets/images/image2.png';

import banner1 from '../assets/images/banner1.png';
import banner2 from '../assets/images/banner2.png';
import banner3 from '../assets/images/banner3.png';

import eyeIcon from '../assets/svg/eye.svg';

import imagesCount from '../assets/svg/images-count.svg';

import Slider from "react-slick";
import penIcon from '../assets/svg/orders-pen.svg';
import userPhoto from '../assets/images/user.png';
import { API_ENDPOINT } from '../constants';

class PhotographerPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);


        this.state = {
            ...props.initialData,
        };
    }



    init() {
        fetch(`${API_ENDPOINT}/products/track/${this.props[0].match.params.storeAlias}/${this.props[0].match.params.alias}/${this.props[0].match.params.sku}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, null, this.props.lang).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }

    }

    componentDidMount() {

        window.scrollTo(0, 0);
        this.init()

    }

    componentDidUpdate(prevProps) {

        if (prevProps[0].location.pathname != this.props[0].location.pathname) {
            this.init();
        }
    }



    render() {

        let photographer = this.state.photographer ? this.state.photographer : {};

        return (
            <div className="photgrapher-wrap">
                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="6">
                                <h1>{'Profil fotografa'.translate(this.props.lang)}</h1>
                                <h2>{'Portfolio'.translate(this.props.lang)}</h2>
                            </Col>
                            <Col lg={{ size: 6 }}>
                                <div className="search-wrap">
                                    <Isvg src={picture} />
                                    <input type="text" placeholder={'Unesite pojam za pretragu'.translate(this.props.lang)} value={this.state.search} onChange={(e) => this.setState({ search: e.target.value })} onKeyUp={(e) => {
                                        if (e.keyCode == 13) {
                                            e.preventDefault();
                                            this.props[0].history.push(`/galerije?search=${encodeURIComponent(this.state.search)}`);
                                        }
                                    }} />
                                    <button className="button" onClick={() => {
                                        this.props[0].history.push(`/galerije?search=${encodeURIComponent(this.state.search)}`);

                                    }}><Isvg src={searchIcon} /> {'PRETRAŽI'.translate(this.props.lang)}  </button>
                                </div>
                                <a onClick={() => this.props.handleDetailSearch(true)} className="detail-search">{'Napredna pretraga'.translate(this.props.lang)}</a>
                            </Col>
                        </Row>

                    </Container>
                </div>


                <section className="section-detail">
                    <Container>
                        <Row>
                            <Col lg="7">
                                <div className="user-info">
                                    <img src={photographer.profilePhoto ? photographer.profilePhoto : userPhoto} />
                                    <div>
                                        <h3>{photographer.name}</h3>
                                        <h6><Isvg src={imagesCount} /> {photographer.photosCount} {'fotografija'.translate(this.props.lang)}</h6>
                                        <Link to={`/galerije?photographer=${photographer.userAlias}`}> <button>{'Pogledaj sve galerije fotografa'.translate(this.props.lang)}</button></Link>
                                    </div>
                                </div>
                                <Row>
                                    <Col lg="12">
                                        <div className="info-field">
                                            {'Zemlja:'.translate(this.props.lang)} <span>{photographer.country}</span>
                                        </div>
                                    </Col>
                                    <Col lg="6">
                                        <div className="info-field">
                                            {'Grad:'.translate(this.props.lang)} <span>{photographer.city}</span>
                                        </div>
                                    </Col>
                                    <Col lg="6">
                                        <div className="info-field">
                                            {'Facebook:'.translate(this.props.lang)} <span><a href={photographer.facebook} target="_blank">{photographer.facebook}</a></span>
                                        </div>
                                    </Col>
                                    <Col lg="6">
                                        <div className="info-field">
                                            {'Web sajt:'.translate(this.props.lang)} <span><a href={photographer.webSite} target="_blank">{photographer.webSite}</a></span>
                                        </div>
                                    </Col>
                                    <Col lg="6">
                                        <div className="info-field">
                                            {'Instagram:'.translate(this.props.lang)} <span><a href={photographer.instagram} target="_blank">{photographer.instagram}</a></span>
                                        </div>
                                    </Col>
                                    <Col lg="6">
                                        <div className="info-field">
                                            {'Skype:'.translate(this.props.lang)} <span><a href={photographer.skype} target="_blank">{photographer.skype}</a></span>
                                        </div>
                                    </Col>

                                    <Col lg="6">
                                        <div className="info-field">
                                            {'Twitter:'.translate(this.props.lang)} <span><a href={photographer.twitter} target="_blank">{photographer.twitter}</a></span>
                                        </div>
                                    </Col>


                                </Row>
                            </Col>
                            <Col lg="5" className="biography">
                                <h6>{'BIOGRAFIJA'.translate(this.props.lang)}</h6>
                                <div dangerouslySetInnerHTML={{ __html: photographer.biography && photographer.biography.replace(/\n/g, '<br/>') }}></div>
                            </Col>
                            <Col lg="12">
                                <h6>{'IZDVOJENO OD FOTOGRAFA'.translate(this.props.lang)}</h6>
                                <Row>
                                    {
                                        photographer.photos && photographer.photos.map((item, idx) => {
                                            return (
                                                <Col lg="3" key={idx}>

                                                    <Link to={`/galerija/${Object.translate(item, 'galleryAlias', this.props.lang)}/${item._id}/${item.photoId}`}><article>
                                                        <img src={`${API_ENDPOINT}/photos/350x/` + item.image} />
                                                    </article>
                                                    </Link>
                                                </Col>

                                            )
                                        })
                                    }

                                </Row>
                            </Col>

                        </Row>


                    </Container>
                </section>



                <section className="section-banners">
                    <Container>
                        <Row>
                            <Col lg="12" className="banners">
                                {
                                    this.props.banners && this.props.banners[1] && this.props.banners[1].images.map((item, idx) => {
                                        return (
                                            <a href={item.link} target="_blank" onClick={() => this.props.bannerClick(item.link)}>
                                                <img src={item.image} className="banner" />
                                            </a>
                                        )
                                    })
                                }

                            </Col>
                        </Row>
                    </Container>
                </section>            </div>
        );
    }
}

export default Page(PhotographerPage);