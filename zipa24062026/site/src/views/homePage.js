import React, {Component} from 'react';
import {Link} from 'react-router-dom'
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
    CarouselItem,
    Carousel,
    CarouselControl,

} from 'reactstrap';

import Image from '../components/image';

import Article from '../components/articles/article';
import BlogArticle from '../components/articles/blogArticle';

import rightArrow from '../assets/svg/right-arrow.svg';

import Slider from "react-slick";

import image1 from '../assets/images/image1.png';
import image2 from '../assets/images/image2.png';

import banner1 from '../assets/images/banner1.png';
import banner2 from '../assets/images/banner2.png';
import banner3 from '../assets/images/banner3.png';
import searchIcon from '../assets/svg/search-icon-btn.svg';
import picture from '../assets/svg/picture-icon.svg';
import infoIcon from '../assets/svg/account-info.svg';
import {API_ENDPOINT} from '../constants';

class HomePage extends Component {
    constructor(props) {
        super(props);
        this.next = this.next.bind(this);
        this.previous = this.previous.bind(this);
        this.goToIndex = this.goToIndex.bind(this);
        this.onExiting = this.onExiting.bind(this);
        this.onExited = this.onExited.bind(this);

        this.state = {
            searchCategory: 'Sve kategorije',
            slides: [],
            activeIndex: 0,
            announcements: [],
            ...props.initialData
        };
    }

    componentDidMount() {

        window.scrollTo(0, 0);


        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }


        fetch(`${API_ENDPOINT}/slides/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                slides: result
            })
        })
        fetch(`${API_ENDPOINT}/announcements`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                announcements: result
            })
        })


    }

    componentDidUpdate(prevProps, prevState) {
        window.scrollTo(0, 0)
    }

    onExiting() {
        this.animating = true;
    }

    onExited() {
        this.animating = false;
    }

    next() {
        if (this.animating) return;
        const nextIndex = this.state.activeIndex === this.state.slides.length - 1 ? 0 : this.state.activeIndex + 1;
        this.setState({activeIndex: nextIndex});
    }

    previous() {
        if (this.animating) return;
        const nextIndex = this.state.activeIndex === 0 ? this.state.slides.length - 1 : this.state.activeIndex - 1;
        this.setState({activeIndex: nextIndex});
    }

    goToIndex(newIndex) {
        if (this.animating) return;
        this.setState({activeIndex: newIndex});
    }


    render() {
        const {activeIndex} = this.state;
        const slides = this.state.slides.map((item, idx) => {
            return (
                <CarouselItem
                    onExiting={this.onExiting}
                    onExited={this.onExited}
                    key={idx}
                    slide={true}

                >
                    <div>
                        <img src={item.image}/>
                        <div>
                            <h2>{Object.translate(item, 'title', this.props.lang)}</h2>
                            <p>{Object.translate(item, 'content', this.props.lang)}</p>

                        </div>
                    </div>
                </CarouselItem>
            );
        });
        return (
            <div className="home-wrap">
                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="12">
                                {
                                    this.state.announcements.map((item, idx) => {
                                        return (
                                            <Link to={`/najave/${item._id}`}>
                                                <div className="alert">
                                                    <Isvg
                                                        src={infoIcon}/> {Object.translate(item, 'content', this.props.lang)}
                                                </div>
                                            </Link>

                                        )
                                    })
                                }

                            </Col>
                        </Row>
                        {this.props.settings.showSlider ?

                            <Row>
                                <Col lg="12">
                                    <Carousel
                                        activeIndex={activeIndex}
                                        next={this.next}
                                        previous={this.previous}
                                        touch={true}
                                        className="home-slider carousel-fade"
                                        interval={4000}
                                        //autoPlay={true}
                                    >
                                        {slides}
                                        <CarouselControl direction="prev" directionText="Previous"
                                                         onClickHandler={this.previous}/>
                                        <CarouselControl direction="next" directionText="Next"
                                                         onClickHandler={this.next}/>

                                    </Carousel>
                                </Col>
                            </Row>

                            :

                            this.props.settings.showBanner ?
                                this.props.adBanner && this.props.adBanner.images ?
                                    <section className="section-banners">
                                        <Container>
                                            <Row>
                                                <Col lg="12" className="banners">
                                                    {
                                                        this.props.adBanner.images.map((item, idx) => {
                                                            return (
                                                                <a href={item.link} target="_blank"
                                                                   onClick={() => this.props.bannerClick(item.link)}>
                                                                    <img src={item.image} className="banner"/>
                                                                </a>
                                                            )
                                                        })
                                                    }

                                                </Col>
                                            </Row>
                                        </Container>
                                    </section>
                                    :
                                    null

                                :

                                this.props.settings.showSlider === false ?
                                    <Row>


                                        <Col lg="12">
                                            <h1>{'Pretražite bazu fotografija'.translate(this.props.lang)}</h1>
                                            {/* <h2>{'Prva foto agencija u Bosni i Hercegovini'.translate(this.props.lang)}</h2>*/}
                                        </Col>
                                        <Col lg={{size: 12}} className="search-container">
                                            <div className="search-wrap">
                                                <input type="text"
                                                       placeholder={'Unesite pojam za pretragu'.translate(this.props.lang)}
                                                       value={this.state.search}
                                                       onChange={(e) => this.setState({search: e.target.value})}
                                                       onKeyUp={(e) => {
                                                           if (e.keyCode == 13) {
                                                               e.preventDefault();
                                                               this.props[0].history.push(`/galerije${this.state.searchBreadcrumb ? this.state.searchBreadcrumb : ''}${this.state.search ? `?search=${encodeURIComponent(this.state.search)}` : ''}`)
                                                           }
                                                       }}/>
                                                <button className="button"
                                                        onClick={() => this.props[0].history.push(`/galerije${this.state.searchBreadcrumb ? this.state.searchBreadcrumb : ''}${this.state.search ? `?search=${encodeURIComponent(this.state.search)}` : ''}`)}>
                                                    <Isvg src={searchIcon}/> PRETRAŽI
                                                </button>

                                            </div>
                                            <a onClick={() => this.props.handleDetailSearch(true)}
                                               className="detail-search">{'Detaljna pretraga'.translate(this.props.lang)}</a>
                                        </Col>
                                    </Row>
                                    :
                                    null
                        }
                    </Container>
                </div>
                {/*
                    this.props.banners && this.props.banners[0] && this.props.banners[0].images ?
                        <section className="section-banners">
                            <Container>
                                <Row>
                                    <Col lg="12" className="banners">
                                        {
                                            this.props.banners && this.props.banners[0] && this.props.banners[0].images && this.props.banners[0].images.map((item, idx) => {
                                                return (
                                                    <a href={item.link} target="_blank">
                                                        <img src={item.image} className="banner" />
                                                    </a>
                                                )
                                            })
                                        }

                                    </Col>
                                </Row>
                            </Container>
                        </section>
                        :
                        null*/
                }


                <section className="section-articles">
                    <Container>
                        <Row>
                            <Col lg="12" className="title">
                                <h3>{'Najnovije fotografije'.translate(this.props.lang)}</h3>
                            </Col>

                        </Row>
                        <Row className="articles">
                            <Col lg="6" sm="6">
                                {this.state.latest && this.state.latest[0] ?
                                    <Article
                                        _id={this.state.latest[0]._id}
                                        image={this.state.latest[0].photos && this.state.latest[0].photos[0] && this.state.latest[0].photos[0].image}
                                        name={Object.translate(this.state.latest[0], 'name', this.props.lang)}
                                        alias={Object.translate(this.state.latest[0], 'alias', this.props.lang)}
                                        userAlias={this.state.latest[0].userAlias}
                                        shortDescription={Object.translate(this.state.latest[0], 'description', this.props.lang)}
                                        maxShortDescriptionLength={66}
                                        imagesCount={this.state.latest[0].photos && this.state.latest[0].photos.length}
                                        location={this.state.latest[0].location}
                                        categoryName={Object.translate(this.state.latest[0], 'categoryName', this.props.lang)}
                                        published={this.state.latest[0].date}
                                        bigView={typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 996 ? false : true}
                                        homeArticle={typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 996 ? true : false}
                                    ></Article>
                                    :
                                    null
                                }
                            </Col>
                            <Col lg="6" sm="6">
                                {this.state.latest && this.state.latest[1] ?
                                    <Article
                                        _id={this.state.latest[1]._id}

                                        image={this.state.latest[1].photos && this.state.latest[1].photos[0] && this.state.latest[1].photos[0].image}
                                        name={Object.translate(this.state.latest[1], 'name', this.props.lang)}
                                        shortDescription={Object.translate(this.state.latest[1], 'description', this.props.lang)}
                                        alias={Object.translate(this.state.latest[1], 'alias', this.props.lang)}
                                        userAlias={this.state.latest[1].userAlias}
                                        maxShortDescriptionLength={70}
                                        imagesCount={this.state.latest[1].photos && this.state.latest[1].photos.length}
                                        location={this.state.latest[1].location}
                                        categoryName={Object.translate(this.state.latest[1], 'categoryName', this.props.lang)}
                                        published={this.state.latest[1].date}
                                        bigView={typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 996 ? false : true}
                                        homeArticle={typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 996 ? true : false}

                                    ></Article>
                                    :
                                    null
                                }
                            </Col>
                            <Col lg="4" sm="6">
                                {this.state.latest && this.state.latest[2] ?

                                    <Article
                                        _id={this.state.latest[2]._id}

                                        image={this.state.latest[2].photos && this.state.latest[2].photos[0] && this.state.latest[2].photos[0].image}
                                        name={Object.translate(this.state.latest[2], 'name', this.props.lang)}
                                        shortDescription={Object.translate(this.state.latest[2], 'description', this.props.lang)}
                                        alias={Object.translate(this.state.latest[2], 'alias', this.props.lang)}
                                        userAlias={this.state.latest[2].userAlias}
                                        maxShortDescriptionLength={70}
                                        imagesCount={this.state.latest[2].photos && this.state.latest[2].photos.length}
                                        location={this.state.latest[2].location}
                                        categoryName={Object.translate(this.state.latest[2], 'categoryName', this.props.lang)}
                                        published={this.state.latest[2].date}
                                        homeArticle
                                    ></Article>
                                    :
                                    null

                                }

                            </Col>
                            <Col lg="4" sm="6">
                                {this.state.latest && this.state.latest[3] ?
                                    <Article
                                        _id={this.state.latest[3]._id}

                                        image={this.state.latest[3].photos && this.state.latest[3].photos[0] && this.state.latest[3].photos[0].image}
                                        name={Object.translate(this.state.latest[3], 'name', this.props.lang)}
                                        shortDescription={Object.translate(this.state.latest[3], 'description', this.props.lang)}
                                        alias={Object.translate(this.state.latest[3], 'alias', this.props.lang)}
                                        userAlias={this.state.latest[3].userAlias}
                                        imagesCount={this.state.latest[3].photos && this.state.latest[3].photos.length}
                                        location={this.state.latest[3].location}
                                        categoryName={Object.translate(this.state.latest[3], 'categoryName', this.props.lang)}
                                        published={this.state.latest[3].date}
                                        homeArticle
                                    ></Article>
                                    :
                                    null
                                }
                            </Col>
                            <Col lg="4">
                                {this.state.latest && this.state.latest[4] ?
                                    <Article
                                        _id={this.state.latest[4]._id}

                                        image={this.state.latest[4].photos && this.state.latest[4].photos[0] && this.state.latest[4].photos[0].image}
                                        name={Object.translate(this.state.latest[4], 'name', this.props.lang)}
                                        shortDescription={Object.translate(this.state.latest[4], 'description', this.props.lang)}
                                        alias={Object.translate(this.state.latest[4], 'alias', this.props.lang)}
                                        userAlias={this.state.latest[4].userAlias}
                                        imagesCount={this.state.latest[4].photos && this.state.latest[4].photos.length}
                                        location={this.state.latest[4].location}
                                        categoryName={Object.translate(this.state.latest[4], 'categoryName', this.props.lang)}
                                        published={this.state.latest[4].date}
                                        homeArticle={typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 998 ? false : true}
                                        bigView={typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 998 ? true : false}
                                    ></Article>
                                    :
                                    null
                                }
                            </Col>

                        </Row>
                    </Container>
                </section>

                {
                    this.props.banners && this.props.banners[0] && this.props.banners[0].images ?
                        <section className="section-banners">
                            <Container>
                                <Row>
                                    <Col lg="12" className="banners">
                                        {
                                            this.props.banners && this.props.banners[0] && this.props.banners[0].images && this.props.banners[0].images.map((item, idx) => {
                                                return (
                                                    <a href={item.link} target="_blank"
                                                       onClick={() => this.props.bannerClick(item.link)}>
                                                        <img src={item.image} className="banner"/>
                                                    </a>
                                                )
                                            })
                                        }

                                    </Col>
                                </Row>
                            </Container>
                        </section>
                        :
                        null
                }


                {
                    this.state.homeCategories && this.state.homeCategories.map((item, idx) => {

                        if (item.photos && item.photos.length)
                            return (
                                <>
                                    <section className="section-articles">
                                        <Container>
                                            <Row>
                                                <Col lg="12" className="title">
                                                    <h3>{Object.translate(item, 'name', this.props.lang)}</h3>
                                                    <Link
                                                        to={`/galerije?category=${item.alias && item.alias.ba}`}>{'Pogledajte sve galerije'.translate(this.props.lang)}</Link>
                                                </Col>

                                            </Row>
                                            <Row className="articles">
                                                {
                                                    item.photos && item.photos.map((article, aidx) => {
                                                        return (
                                                            <Col lg="4" sm="6" key={aidx}>
                                                                <Article
                                                                    _id={article._id}

                                                                    image={article.photos && article.photos[0] && article.photos[0].image}
                                                                    name={Object.translate(article, 'name', this.props.lang)}
                                                                    shortDescription={Object.translate(article, 'description', this.props.lang)}
                                                                    alias={Object.translate(article, 'alias', this.props.lang)}
                                                                    userAlias={article.userAlias}
                                                                    imagesCount={article.photos && article.photos.length}
                                                                    location={article.location}
                                                                    published={article.date}
                                                                    homeArticle
                                                                ></Article>
                                                            </Col>

                                                        )
                                                    })
                                                }

                                            </Row>
                                        </Container>
                                    </section>
                                    {idx % 2 == 0 && idx != 0 && this.props.banners && this.props.banners[parseInt(idx / 2)] ?
                                        <section className="section-banners">
                                            <Container>
                                                <Row>
                                                    <Col lg="12" className="banners">
                                                        {
                                                            this.props.banners && this.props.banners[parseInt(idx / 2)] && this.props.banners[parseInt(idx / 2)].images.map((item, idx) => {
                                                                return (
                                                                    <a href={item.link} target="_blank"
                                                                       onClick={() => this.props.bannerClick(item.link)}>
                                                                        <img src={item.image} className="banner"/>
                                                                    </a>
                                                                )
                                                            })
                                                        }

                                                    </Col>
                                                </Row>
                                            </Container>
                                        </section>


                                        :

                                        null}
                                </>

                            )
                        else {
                            return <div></div>;
                        }
                    })
                }

                {
                    this.state.homeCategories && this.state.homeCategories.length > 1 ?
                        this.props.banners && this.props.banners[parseInt((this.state.homeCategories.length - 1) / 2)] && this.props.banners[parseInt((this.state.homeCategories.length - 1) / 2)].images && (this.state.homeCategories.length - 1) % 2 != 0 ?
                            <section className="section-banners">
                                <Container>
                                    <Row>
                                        <Col lg="12" className="banners">
                                            {
                                                this.props.banners && this.props.banners[parseInt((this.state.homeCategories.length - 1) / 2)] && this.props.banners[parseInt((this.state.homeCategories.length - 1) / 2)].images && this.props.banners[parseInt((this.state.homeCategories.length - 1) / 2)].images.map((item, idx) => {
                                                    return (
                                                        <a href={item.link} target="_blank"
                                                           onClick={() => this.props.bannerClick(item.link)}>
                                                            <img src={item.image} className="banner"/>
                                                        </a>
                                                    )
                                                })
                                            }

                                        </Col>
                                    </Row>
                                </Container>
                            </section>
                            :
                            null
                        :
                        this.props.banners && this.props.banners[1] && this.props.banners[1].images ?
                            <section className="section-banners">
                                <Container>
                                    <Row>
                                        <Col lg="12" className="banners">
                                            {
                                                this.props.banners && this.props.banners[4] && this.props.banners[1].images && this.props.banners[1].images.map((item, idx) => {
                                                    return (
                                                        <a href={item.link} target="_blank"
                                                           onClick={() => this.props.bannerClick(item.link)}>
                                                            <img src={item.image} className="banner"/>
                                                        </a>
                                                    )
                                                })
                                            }

                                        </Col>
                                    </Row>
                                </Container>
                            </section>
                            :
                            null

                }


            </div>
        );
    }
}

export default Page(HomePage);