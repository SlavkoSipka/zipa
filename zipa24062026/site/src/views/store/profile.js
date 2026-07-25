import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';


import Article from '../../components/articles/article';

import rightArrow from '../../assets/svg/right-arrow.svg';

import search from '../../assets/svg/search.svg';
import doneIcon from '../../assets/svg/done.svg';

import rightArrowSmall from '../../assets/svg/right-arrow-1.svg';
import ReactPaginate from 'react-paginate';
import { GoogleMapScript } from '../../components/googleMapScript';
import Map from '../../components/map';
import ContactForm from '../../components/forms/storeContactForm';


import moment from 'moment';
import { API_ENDPOINT } from '../../constants';

class StoreProfilePage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);
        this.getSearchParams = this.getSearchParams.bind(this);
        this.generateSearchLink = this.generateSearchLink.bind(this);

        this.state = {
            ...props.initialData
        };
    }
    getSearchParams() {
        let brokenParams = this.props[0].location.search.replace('?', '').split('&');
        let params = {};
        for (let i = 0; i < brokenParams.length; i++) {
            params[brokenParams[i].split('=')[0]] = decodeURIComponent(brokenParams[i].split('=')[1]);
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


        let paramsGroup = [];
        for (var key in params) {
            if (params.hasOwnProperty(key) && params[key] && key) {
                paramsGroup.push(`${key}=${params[key]}`)
            }
        }


        return `?${paramsGroup.join('&')}`;
    }

    init() {
        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, this.getSearchParams()).then((data) => {
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

        if (prevProps[0].location.pathname != this.props[0].location.pathname || prevProps[0].location.search != this.props[0].location.search) {
            this.init();
        }
    }

    contact = (data) => {
        fetch(`${API_ENDPOINT}/stores/contact/` + this.props[0].match.params.storeAlias, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then((res) => res.json()).then((result) => {
            if (!result.error) {
                this.setState({
                    _contactDone: true
                })
            }
        })
    }



    render() {
        let store = this.state.storeData ? this.state.storeData : {};


        return (
            <div className="store-wrap">
                <div className="top-into-wrap">
                    <Container>
                        <Row>
                            <Col lg="6">
                                <h1>{store.name}</h1>
                                <h6>{store.address}, {store.city}</h6>
                            </Col>
                            <Col lg={{ size: 6 }}>
                                <div className="search-wrap">
                                    <input type="text" placeholder="Unesite pojam za pretragu" value={this.state.search} onChange={(e) => this.setState({ search: e.target.value })} onKeyUp={(e) => {
                                        if (e.keyCode == 13) {
                                            e.preventDefault();
                                            this.props[0].history.push(this.props[0].location.pathname + this.generateSearchLink('search', encodeURIComponent(this.state.search)));
                                        }
                                    }} />
                                    <button className="button" onClick={() => {
                                        this.props[0].history.push(this.props[0].location.pathname + this.generateSearchLink('search', encodeURIComponent(this.state.search)));

                                    }}>TRAŽI <Isvg src={rightArrow} /> </button>
                                </div>
                            </Col>
                        </Row>

                    </Container>
                </div>

                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="12">
                                <div className="profile">
                                    {this.props.uData && (this.props.uData.storeId == store._id || (this.props.uData.permissions && this.props.uData.permissions.indexOf('*') !== -1)) ?
                                        <ul className="tabs">
                                            <li className="active">
                                                <Link to={`/shop/${this.props[0].match.params.storeAlias}`}>Shop</Link>
                                            </li>
                                            <li>
                                                <Link to={`/shop/${this.props[0].match.params.storeAlias}/orders`}>Narudžbe</Link>
                                            </li>
                                            <li>
                                                <Link to={`/shop/${this.props[0].match.params.storeAlias}/products`}>Proizvodi</Link>
                                            </li>
                                            <li>
                                                <Link to={`/shop/${this.props[0].match.params.storeAlias}/contacts`}>Kontakti</Link>
                                            </li>
                                            <li>
                                                <Link to={`/shop/${this.props[0].match.params.storeAlias}/settings`}>Podešavanja</Link>
                                            </li>
                                            <li>
                                                <Link to={`/shop/${this.props[0].match.params.storeAlias}/admins`}>Administratori</Link>
                                            </li>
                                            <li>
                                                <Link to={`/shop/${this.props[0].match.params.storeAlias}/statistics`}>Statistike</Link>
                                            </li>
                                            <li>
                                                <Link to={`/shop/${this.props[0].match.params.storeAlias}/products/new`}>DODAJ ARTIKAL</Link>
                                            </li>
                                        </ul>
                                        :
                                        null
                                    }

                                    <div className="profile-cover-wrap">
                                        <div className="cover">
                                            <img src={store.coverPhoto} />
                                        </div>
                                        <div className="logo">
                                            <img src={store.profilePhoto} />
                                        </div>
                                        <div className="info">
                                            <div className="item">
                                                <h6>LOKACIJA</h6>
                                                <p>{store.city}</p>
                                            </div>
                                            <div className="item">
                                                <h6>ADRESA</h6>
                                                <p>{store.address}</p>
                                            </div>
                                            <div className="item">
                                                <h6>TELEFON</h6>
                                                <p>{store.phoneNumber}</p>
                                            </div>
                                            <div className="item">
                                                <h6>WEB</h6>
                                                <p>{store.webSite}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Col>

                        </Row>

                    </Container>

                </div>

                <div className="store-content-wrap">
                    <Container>
                        <Row>
                            <Col lg="12">
                                <div className="content-wrap">
                                    <ul className="tabs">
                                        <li className={this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}` ? 'active' : ''}>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}`}>Artikli</Link>
                                        </li>
                                        <li className={this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}/izdvojeni` ? 'active' : ''}>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/izdvojeni`}>Izdvojeni</Link>
                                        </li>
                                        <li className={this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}/na-akciji` ? 'active' : ''}>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/na-akciji`}>Na akciji</Link>
                                        </li>
                                        <li className={this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}/o-nama` ? 'active' : ''}>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/o-nama`}>O nama</Link>
                                        </li>
                                        <li className={this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}/mapa` ? 'active' : ''}>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/mapa`}>Mapa</Link>
                                        </li>
                                        <li className={this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}/kontakt` ? 'active' : ''}>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/kontakt`}>Kontakt</Link>
                                        </li>
                                        <li className={this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}/radno-vrijeme` ? 'active' : ''}>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/radno-vrijeme`}>Radno vrijeme</Link>
                                        </li>
                                        <li className="search-wrap">
                                            <div>
                                                <Isvg src={search} />
                                                <input type="text" placeholder="Traži u shop-u..." onChange={(e) => { this.setState({ shopSearch: e.target.value }) }} value={this.state.shopSearch} onKeyUp={(e) => {
                                                    if (e.keyCode === 13) {
                                                        this.props[0].history.push(`/shop/${this.props[0].match.params.storeAlias}` + this.generateSearchLink('search', encodeURIComponent(this.state.shopSearch)))
                                                    }
                                                }} />
                                                <button onClick={() => this.props[0].history.push(`/shop/${this.props[0].match.params.storeAlias}` + this.generateSearchLink('search', encodeURIComponent(this.state.shopSearch)))}>
                                                    <Isvg src={rightArrowSmall} />
                                                </button>
                                            </div>

                                        </li>
                                    </ul>


                                </div>
                            </Col>

                        </Row>
                        {this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}` || this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}/izdvojeni` || this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}/na-akciji` ?
                            <>
                                <Row className="articles">
                                    {
                                        this.state.products && this.state.products.map((item, idx) => {
                                            return (
                                                <Col lg="2" xs="6" key={idx}>
                                                    <Article
                                                        {...item}
                                                        addToCart={this.props.addToCart}
                                                    />
                                                </Col>

                                            )
                                        })
                                    }

                                </Row>
                                <Row>
                                    <Col lg="12">
                                        <ReactPaginate
                                            previousLabel={''}
                                            nextLabel={''}
                                            breakLabel={'...'}
                                            breakClassName={'break-me'}
                                            pageCount={this.state.totalProducts}
                                            marginPagesDisplayed={1}
                                            pageRangeDisplayed={2}
                                            onPageChange={(page) => { this.props[0].history.push(this.generateSearchLink('page', page.selected)) }}
                                            containerClassName={'pagination'}
                                            subContainerClassName={'pages pagination'}
                                            activeClassName={'active'}
                                            hrefBuilder={(page) => { return this.generateSearchLink('page', page) }}
                                        />

                                    </Col>


                                </Row>
                            </>
                            :
                            null
                        }
                        {
                            this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}/o-nama` ?
                                <Row>
                                    <Col lg="12">
                                        <div className="about-us" dangerouslySetInnerHTML={{ __html: store.aboutUs }}>

                                        </div>
                                    </Col>
                                </Row>

                                :

                                null
                        }
                        {
                            this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}/mapa` ?

                                <Row>
                                    <GoogleMapScript _googleMapsLoaded={this.props._googleMapsLoaded} API_KEY="AIzaSyDx7uNRz2GYWKLlAlfT6wugFOSBXQ7EZaQ" />
                                    <Col lg="12" >
                                        <div className="about-us">
                                            {store.coords ?
                                                <Map value={store.coords} _googleMapsLoaded={this.props._googleMapsLoaded} />
                                                :
                                                null
                                            }
                                        </div>
                                    </Col>

                                </Row>
                                :
                                null
                        }

                        {
                            this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}/radno-vrijeme` ?
                                <Row>
                                    <Col lg="6" className="working-time">
                                        <h3>Radni dani</h3>
                                        <div className="working-time-table">
                                            <div className="item">
                                                <div>Dan</div>
                                                <div>Od</div>
                                                <div>Do</div>
                                            </div>
                                            <div className="item">
                                                <div>Ponedeljak</div>
                                                <div>{store.workingTime && store.workingTime[0] && store.workingTime[0].from ? store.workingTime[0].from : 'Ne radimo'}</div>
                                                <div>{store.workingTime && store.workingTime[0] && store.workingTime[0].to ? store.workingTime[0].to : ''}</div>
                                            </div>
                                            <div className="item">
                                                <div>Utorak</div>
                                                <div>{store.workingTime && store.workingTime[1] && store.workingTime[1].from ? store.workingTime[1].from : 'Ne radimo'}</div>
                                                <div>{store.workingTime && store.workingTime[1] && store.workingTime[1].to ? store.workingTime[1].to : ''}</div>
                                            </div>

                                            <div className="item">
                                                <div>Srijeda</div>
                                                <div>{store.workingTime && store.workingTime[2] && store.workingTime[2].from ? store.workingTime[2].from : 'Ne radimo'}</div>
                                                <div>{store.workingTime && store.workingTime[2] && store.workingTime[2].to ? store.workingTime[2].to : ''}</div>
                                            </div>

                                            <div className="item">
                                                <div>Četvrtak</div>
                                                <div>{store.workingTime && store.workingTime[3] && store.workingTime[3].from ? store.workingTime[3].from : 'Ne radimo'}</div>
                                                <div>{store.workingTime && store.workingTime[3] && store.workingTime[3].to ? store.workingTime[3].to : ''}</div>
                                            </div>

                                            <div className="item">
                                                <div>Petak</div>
                                                <div>{store.workingTime && store.workingTime[4] && store.workingTime[4].from ? store.workingTime[4].from : 'Ne radimo'}</div>
                                                <div>{store.workingTime && store.workingTime[4] && store.workingTime[4].to ? store.workingTime[4].to : ''}</div>
                                            </div>


                                        </div>
                                    </Col>


                                    <Col lg="6" className="working-time">
                                        <h3>Vikend</h3>
                                        <div className="working-time-table">
                                            <div className="item">
                                                <div>Dan</div>
                                                <div>Od</div>
                                                <div>Do</div>
                                            </div>
                                            <div className="item">
                                                <div>Subota</div>
                                                <div>{store.workingTime && store.workingTime[5] && store.workingTime[5].from ? store.workingTime[5].from : 'Ne radimo'}</div>
                                                <div>{store.workingTime && store.workingTime[5] && store.workingTime[5].to ? store.workingTime[5].to : ''}</div>
                                            </div>
                                            <div className="item">
                                                <div>Nedelja</div>
                                                <div>{store.workingTime && store.workingTime[6] && store.workingTime[6].from ? store.workingTime[6].from : 'Ne radimo'}</div>
                                                <div>{store.workingTime && store.workingTime[6] && store.workingTime[6].to ? store.workingTime[6].to : ''}</div>
                                            </div>


                                        </div>
                                    </Col>

                                </Row>

                                :

                                null
                        }
                        {
                            this.props[0].location.pathname == `/shop/${this.props[0].match.params.storeAlias}/kontakt` ?
                                <Row className="contact-page">
                                    <Col lg="12">
                                        <h3>Kontaktirajte nas</h3>
                                    </Col>
                                    <Col lg="6" className="form-wrapper contact-form-wrapper">
                                        {this.state._contactDone ?
                                            <div className="no-items">
                                                <Isvg src={doneIcon} />
                                                <h6>Vaša poruka je poslata!</h6>
                                                <p>Očekujte odgovor ubrzo.</p>
                                            </div>
                                            :
                                            <ContactForm onSubmit={this.contact} />
                                        }
                                    </Col>
                                    <Col lg="6">
                                        <div className="contact-info">
                                            <div className="item">
                                                <h6>Adresa</h6>
                                                <p>{store.address}</p>
                                            </div>
                                            <div className="item">
                                                <h6>Grad</h6>
                                                <p>{store.city}</p>
                                            </div>
                                            <div className="item">
                                                <h6>Broj telefona</h6>
                                                <p>{store.phoneNumber}</p>
                                            </div>
                                            <div className="item">
                                                <h6>Fax</h6>
                                                <p>{store.phoneNumber}</p>
                                            </div>
                                            <div className="item">
                                                <h6>E-mail adresa</h6>
                                                <p>{store.phoneNumber}</p>
                                            </div>
                                            <div className="item">
                                                <h6>Web sajt</h6>
                                                <p>{store.webSite}</p>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                :

                                null
                        }

                    </Container>

                </div>

            </div >
        );
    }
}

export default Page(StoreProfilePage);