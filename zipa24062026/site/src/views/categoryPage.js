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
    UncontrolledDropdown
} from 'reactstrap';


import Article from '../components/articles/article';
import BlogArticle from '../components/articles/blogArticle';

import keywordX from '../assets/svg/keyword-x.svg';
import downArrow from '../assets/svg/down-arrow.svg';

import grid from '../assets/svg/grid.svg';
import list from '../assets/svg/list.svg';
import filterIcon from '../assets/svg/filters.svg';

import SelectList from '../components/forms/fields/selectList';
import MultiselectList from '../components/forms/fields/multiselectList';

import regions from '../regions';

import image1 from '../assets/images/image1.png';
import image2 from '../assets/images/image2.png';

import banner1 from '../assets/images/banner1.png';
import banner2 from '../assets/images/banner2.png';
import banner3 from '../assets/images/banner3.png';

import searchIcon from '../assets/svg/search-icon-btn.svg';
import picture from '../assets/svg/picture-icon.svg';
import DatePicker from '../components/forms/fields/date';
import Check from '../components/forms/fields/check';
import Select from '../components/forms/fields/select';
import ReactPaginate from 'react-paginate';
import Autotext from '../components/forms/fields/autoText1';
import {API_ENDPOINT, PHOTOS_ENDPOINT} from '../constants';

class CategoryPage extends Component {
    constructor(props) {
        super(props);
        this.getSearchParams = this.getSearchParams.bind(this);
        this.generateSearchLink = this.generateSearchLink.bind(this);

        this.state = {
            ...props.initialData,
            categories: [],
            cities: [],
            displayStyle: 'grid',
            showForms: false
        };
    }

    // Datum snimanja uz fotografiju u rezultatima pretrage.
    formatDate(sekunde) {
        if (!sekunde) return '';
        const d = new Date(sekunde * 1000);
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`;
    }

    componentDidMount() {
        this.setState({showForms: false})
        window.scrollTo(0, 0);

        let searchParams = this.getSearchParams();
        if (searchParams.search) {
            this.setState({
                search: searchParams.search
            })
        }

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, this.getSearchParams(), this.props.lang).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }
        setTimeout(() => {
            if (this.props[0].location.pathname == '/account/subscription')
                fetch(`${API_ENDPOINT}/gallery/check-resolutions/get/` + this.props.uData._id, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                }).then(res => res.json()).then((result) => {
                    this.setState({
                        userResolutins: result
                    })
                })
            this.setState({showForms: true})
        }, 1000);


        fetch(`${API_ENDPOINT}/cities`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                cities: result
            })
        })


    }

    componentDidUpdate(prevProps) {


        if (prevProps[0].location.pathname != this.props[0].location.pathname || prevProps[0].location.search != this.props[0].location.search) {

            for (let i = 0; i < this.props.loadData.length; i++) {
                this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, this.getSearchParams(), this.props.lang).then((data) => {
                    this.setState({
                        ...data,
                    }, () => {
                        this.props.updateMeta(this.props.generateSeoTags(this.state));
                    })
                })
            }
            this.setState({showForms: false})
            setTimeout(() => {
                this.setState({showForms: true})
            }, 100)
        }
    }

    getSearchParams() {
        let brokenParams = this.props[0].location.search.replace('?', '').split('&');
        let params = {};
        for (let i = 0; i < brokenParams.length; i++) {
            params[brokenParams[i].split('=')[0]] = decodeURIComponent(brokenParams[i].split('=')[1]);
        }

        if (params.tags) {
            params.tags = params.tags.split(',');
        }

        if (params['compatible-with']) {
            params['compatible-with'] = params['compatible-with'].split(',');
        }

        return params;
    }

    generateSearchLink(name, value, isValueArray) {
        let params = this.getSearchParams();

        if (!value) {
            delete params[name];
        } else {
            if (isValueArray) {
                if (!params[name]) {
                    params[name] = [];
                }


                if (params[name].indexOf(value) !== -1) {
                    params[name].splice(params[name].indexOf(value), 1);
                } else {
                    params[name].push(value);
                }
                params[name] = params[name].join(',');
            } else {
                params[name] = value;
            }
        }

        if (name == 'region') {
            delete params['city'];
        }

        let paramsGroup = [];
        for (var key in params) {
            if (params.hasOwnProperty(key) && params[key]) {
                if (key && params[key])
                    paramsGroup.push(`${key}=${params[key]}`)
            }
        }

        return `?${paramsGroup.join('&')}`;
    }

    render() {
        let params = this.getSearchParams();


        let categories = [{
            name: {ba: 'Sve kategorije', en: 'Sve kategorije'.translate(this.props.lang)},
            alias: {ba: null, en: null}
        }, ...this.props.categories];

        let category;

        if (params.category) {
            for (let i = 0; i < this.props.categories.length; i++) {
                if (this.props.categories[i].alias.ba == params.category) {
                    category = this.props.categories[i];
                    break;
                }
            }
        }


        return (
            <div className="category-wrap">
                {
                    this.state.userResolutins && this.state.userResolutins._id || this.props[0].location.pathname != '/account/subscription' ?
                        <>
                            <div className="into-wrap">
                                <Container>
                                    <Row>
                                        <Col lg="6">
                                            <h1>{this.state.category && this.state.category.breadcrumb ? this.state.category.name : 'Pretražite galerije'.translate(this.props.lang)}</h1>
                                            {/*<h2>57.000 {'fotografija u ponudi'.translate(this.props.lang)}</h2>*/}
                                        </Col>
                                        <Col lg={{size: 6}}>
                                            <div className="search-wrap">
                                                <Isvg src={picture}/>
                                                <input type="text"
                                                       placeholder={'Unesite pojam za pretragu'.translate(this.props.lang)}
                                                       value={this.state.search}
                                                       onChange={(e) => this.setState({search: e.target.value})}
                                                       onKeyUp={(e) => {
                                                           if (e.keyCode == 13) {
                                                               e.preventDefault();
                                                               this.props[0].history.push(this.props[0].location.pathname + this.generateSearchLink('search', encodeURIComponent(this.state.search)));
                                                           }
                                                       }}/>
                                                <button className="button" onClick={() => {
                                                    this.props[0].history.push(this.props[0].location.pathname + this.generateSearchLink('search', encodeURIComponent(this.state.search)));

                                                }}><Isvg src={searchIcon}/> {'PRETRAŽI'.translate(this.props.lang)}
                                                </button>
                                            </div>
                                            <a onClick={() => this.props.handleDetailSearch(true)}
                                               className="detail-search">{'Napredna pretraga'.translate(this.props.lang)}</a>

                                        </Col>
                                    </Row>

                                </Container>
                            </div>


                            <section className="category-section">
                                <Container>
                                    {
                                        this.state.showForms ?
                                            (
                                                <Row>
                                                    {
                                                        true || params.detailSearch ?
                                                            (<Col lg="12" className="filters">
                                                                <h2>{'Filteri'.translate(this.props.lang)}</h2>
                                                                <Row>
                                                                    <Col lg="3">
                                                                        <div className="date-wrap">
                                                                            <DatePicker value={params['date-from']}
                                                                                        onChange={(val) => {
                                                                                            this.props[0].history.push(this.generateSearchLink('date-from', val))
                                                                                        }}
                                                                                        placeholder={'OD'.translate(this.props.lang)}
                                                                                        label={'Datum fotografisanja'.translate(this.props.lang)}/>
                                                                            <DatePicker value={params['date-to']}
                                                                                        onChange={(val) => {
                                                                                            let date = new Date(val * 1000);
                                                                                            date.setHours(23, 59, 59, 0);
                                                                                            this.props[0].history.push(this.generateSearchLink('date-to', date.getTime() / 1000))
                                                                                        }}
                                                                                        placeholder={'DO'.translate(this.props.lang)}/>

                                                                        </div>
                                                                    </Col>
                                                                    <Col lg="9">
                                                                        <Row>
                                                                            <Col lg="6">
                                                                                {params.keywords ?
                                                                                    <div className="keywords">
                                                                                        <label>{'Ključne riječi'.translate(this.props.lang)}</label>
                                                                                        {
                                                                                            params.keywords && params.keywords.split(',').map((item, idx) => {
                                                                                                return (
                                                                                                    <div> {item}
                                                                                                        <button
                                                                                                            onClick={() => {
                                                                                                                let keywords = params.keywords.split(',');
                                                                                                                keywords.splice(idx, 1);
                                                                                                                this.props[0].history.push(this.generateSearchLink('keywords', keywords.join(',')))
                                                                                                            }}><Isvg
                                                                                                            src={keywordX}/>
                                                                                                        </button>
                                                                                                    </div>

                                                                                                )
                                                                                            })
                                                                                        }

                                                                                    </div>
                                                                                    :
                                                                                    null
                                                                                }

                                                                                <Autotext
                                                                                    label={'Grad'.translate(this.props.lang)}
                                                                                    value={params['city'] ? params['city'] : ''}
                                                                                    suggestions={this.state.cities}
                                                                                    onChange={(val) => {
                                                                                        this.props[0].history.push(this.generateSearchLink('city', val))
                                                                                    }}/>


                                                                            </Col>
                                                                            <Col lg="6">
                                                                                {this.props.categories && this.props.categories.length ?
                                                                                    <Select
                                                                                        label={'Kategorija'.translate(this.props.lang)}
                                                                                        value={params.category}
                                                                                        onChange={(val) => {
                                                                                            this.props[0].history.push(this.generateSearchLink('category', val))
                                                                                        }}>
                                                                                        {
                                                                                            categories.map((item, idx) => {
                                                                                                return (
                                                                                                    <option
                                                                                                        value={Object.translate(item, 'alias', this.props.lang)}>{Object.translate(item, 'name', this.props.lang)}</option>
                                                                                                )
                                                                                            })
                                                                                        }


                                                                                    </Select>
                                                                                    :
                                                                                    null
                                                                                }
                                                                            </Col>

                                                                            <Col lg="12">
                                                                                <div className="orientation">
                                                                                    <label>{'Orjentacija fotografije'.translate(this.props.lang)}</label>
                                                                                    <Check
                                                                                        value={params['orientation-portrait']}
                                                                                        onChange={(val) => {
                                                                                            this.props[0].history.push(this.generateSearchLink('orientation-portrait', val))
                                                                                        }}
                                                                                        label={'Portret'.translate(this.props.lang)}></Check>
                                                                                    <Check
                                                                                        value={params['orientation-horizontal']}
                                                                                        onChange={(val) => {
                                                                                            this.props[0].history.push(this.generateSearchLink('orientation-horizontal', val))
                                                                                        }}
                                                                                        label={'Horizontalna'.translate(this.props.lang)}></Check>
                                                                                </div>
                                                                            </Col>


                                                                        </Row>
                                                                    </Col>

                                                                </Row>

                                                            </Col>)
                                                            :
                                                            null
                                                    }
                                                    <Col lg={params.detailSearch ? '12' : '12'} className="area">
                                                        <Row className="top">
                                                            <Col lg="5">
                                                                {this.props[0].location.pathname.indexOf('/account/subscription') == 0 ?
                                                                    <h2>{'Pretplata'.translate(this.props.lang)}</h2>

                                                                    :
                                                                    category ?
                                                                        <h2>{Object.translate(category, 'name', this.props.lang)}</h2>

                                                                        :
                                                                        <h2>{'Pregled svih galerija'.translate(this.props.lang)}</h2>
                                                                }
                                                            </Col>
                                                            <Col lg="7" className="sort">
                                                                {/*
                                                                  * Izbor da li se rezultati prikazuju kao galerije
                                                                  * ili kao pojedinačne fotografije.
                                                                  */}
                                                                <ul className="view-switch">
                                                                    <li className={params.view !== 'photos' ? 'active' : null}>
                                                                        <Link to={this.props[0].location.pathname + this.generateSearchLink('view', null)}>
                                                                            <button>{'Galerije'.translate(this.props.lang)}</button>
                                                                        </Link>
                                                                    </li>
                                                                    <li className={params.view === 'photos' ? 'active' : null}>
                                                                        <Link to={this.props[0].location.pathname + this.generateSearchLink('view', 'photos')}>
                                                                            <button>{'Fotografije'.translate(this.props.lang)}</button>
                                                                        </Link>
                                                                    </li>
                                                                </ul>

                                                                <span>{'Broj stavki po stranici:'.translate(this.props.lang)}</span>
                                                                <ul>
                                                                    {/* 36 je podrazumevani prikaz — koliko je snimaka imao film.
                                                                        Klijent je tražio da ostanu samo 36, 96 i 200. */}
                                                                    <li className={!params.ipp ? "active" : null}><Link
                                                                        to={this.props[0].location.pathname + this.generateSearchLink('ipp', null)}>
                                                                        <button>36</button>
                                                                    </Link></li>
                                                                    <li className={params.ipp === '96' ? "active" : null}>
                                                                        <Link
                                                                            to={this.props[0].location.pathname + this.generateSearchLink('ipp', '96')}>
                                                                            <button>96</button>
                                                                        </Link></li>
                                                                    <li className={params.ipp === '200' ? "active" : null}>
                                                                        <Link
                                                                            to={this.props[0].location.pathname + this.generateSearchLink('ipp', '200')}>
                                                                            <button>200</button>
                                                                        </Link></li>
                                                                </ul>

                                                                <div className="display-style">
                                                                    <button
                                                                        onClick={() => this.setState({displayStyle: 'grid'})}
                                                                        className={this.state.displayStyle == 'grid' ? 'active' : ''}>
                                                                        <Isvg src={grid}/></button>
                                                                    <button
                                                                        onClick={() => this.setState({displayStyle: 'list'})}
                                                                        className={this.state.displayStyle == 'list' ? 'active' : ''}>
                                                                        <Isvg src={list}/></button>
                                                                    <button
                                                                        onClick={() => this.setState({displayStyle: 'image'})}
                                                                        className={this.state.displayStyle == 'image' ? 'active' : ''}>
                                                                        <Isvg src={grid}/></button>

                                                                </div>

                                                            </Col>

                                                        </Row>


                                                        {/*
                                                          * Rezultati kao pojedinačne fotografije. Klik vodi na
                                                          * galeriju kojoj fotografija pripada, na njeno mesto.
                                                          */}
                                                        {params.view === 'photos' ?
                                                            <Row className="articles photo-results">
                                                                {this.state.items && this.state.items.map((foto, idx) => {
                                                                    const podaci = foto.foto || {};
                                                                    return (
                                                                        <Col lg="3" md="4" xs="6" key={idx}>
                                                                            <Link
                                                                                className="photo-result"
                                                                                to={`/galerija/${foto.userAlias}/${foto.galleryAlias}/${foto.galleryId}?photo=${foto.idx}`}>
                                                                                <div className="photo-result-image">
                                                                                    <img
                                                                                        src={`${PHOTOS_ENDPOINT}/photos/350x/${foto.image}`}
                                                                                        alt={podaci.description || foto.name}/>
                                                                                </div>
                                                                                <div className="photo-result-info">
                                                                                    <h4>{podaci.description || foto.galleryName}</h4>
                                                                                    <p>
                                                                                        {foto.location ? <span>{foto.location}</span> : null}
                                                                                        {foto.date ?
                                                                                            <span>{this.formatDate(foto.date)}</span> : null}
                                                                                        {podaci.author ?
                                                                                            <span>{podaci.author}</span> : null}
                                                                                    </p>
                                                                                </div>
                                                                            </Link>
                                                                        </Col>
                                                                    )
                                                                })}
                                                            </Row>
                                                            :
                                                        <Row className="articles">
                                                            {
                                                                this.state.items && this.state.items.map((article, idx) => {
                                                                    return (
                                                                        <Col
                                                                            lg={this.state.displayStyle == 'list' ? '12' : '4'}
                                                                            key={idx}>
                                                                            <Article
                                                                                _id={article._id}
                                                                                categoryName={Object.translate(article, 'categoryName', this.props.lang)}
                                                                                image={article.photos && article.photos[0] && article.photos[0].image}
                                                                                name={Object.translate(article, 'name', this.props.lang)}
                                                                                shortDescription={Object.translate(article, 'description', this.props.lang)}
                                                                                alias={Object.translate(article, 'alias', this.props.lang)}
                                                                                userAlias={article.userAlias}
                                                                                imagesCount={article.photosCount !== undefined ? article.photosCount : (article.photos && article.photos.length)}
                                                                                location={article.location}
                                                                                published={article.date}
                                                                                homeArticle
                                                                                listView={this.state.displayStyle == 'list'}
                                                                                imageArticle={this.state.displayStyle == 'image'}
                                                                            ></Article>
                                                                        </Col>
                                                                    )
                                                                })
                                                            }


                                                        </Row>
                                                        }

                                                        <Row>
                                                            <Col lg="12">
                                                                <ReactPaginate
                                                                    previousLabel={''}
                                                                    nextLabel={''}
                                                                    breakLabel={'...'}
                                                                    breakClassName={'break-me'}
                                                                    pageCount={this.state.total}
                                                                    marginPagesDisplayed={1}
                                                                    pageRangeDisplayed={2}
                                                                    onPageChange={(page) => {
                                                                        this.props[0].history.push(this.generateSearchLink('page', page.selected));
                                                                        window.scrollTo(0, 0);
                                                                    }}
                                                                    containerClassName={'pagination'}
                                                                    subContainerClassName={'pages pagination'}
                                                                    activeClassName={'active'}
                                                                    hrefBuilder={(page) => {
                                                                        return this.generateSearchLink('page', page)
                                                                    }}
                                                                />

                                                            </Col>

                                                        </Row>


                                                    </Col>
                                                </Row>
                                            )
                                            :
                                            null
                                    }

                                </Container>

                            </section>

                            <section className="section-banners">
                                <Container>
                                    <Row>
                                        <Col lg="12" className="banners">
                                            {
                                                this.props.banners && this.props.banners[1] && this.props.banners[1].images.map((item, idx) => {
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
                        </>
                        :
                        <div style={{marginTop: '200px', marginBottom: '500px'}}>
                            <Container>
                                <Row>
                                    <Col lg="12">
                                        <h4>{"Trenutno nemate pretplatu".translate(this.props.lang)}...</h4>
                                    </Col>
                                </Row>
                            </Container>
                        </div>
                }

            </div>
        );
    }
}

export default Page(CategoryPage);