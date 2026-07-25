import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';


import rightArrow from '../../assets/svg/right-arrow.svg';

import search from '../../assets/svg/search.svg';
import rightArrowSmall from '../../assets/svg/right-arrow-1.svg';
import ReactPaginate from 'react-paginate';

import documentIcon from '../../assets/svg/orders-document.svg';
import cashIcon from '../../assets/svg/orders-cash.svg';
import truckIcon from '../../assets/svg/orders-truck.svg';
import penIcon from '../../assets/svg/orders-pen.svg';
import trashIcon from '../../assets/svg/orders-trash.svg';
import { API_ENDPOINT } from '../../constants';


import moment from 'moment';

class StoreOrdersPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);
        this.getSearchParams = this.getSearchParams.bind(this);
        this.generateSearchLink = this.generateSearchLink.bind(this);

        this.state = {
            ...props.initialData,
            orders: []
        };
    }
    getSearchParams() {
        let brokenParams = this.props[0].location.search.replace('?', '').split('&');
        let params = {};
        for (let i = 0; i < brokenParams.length; i++) {
            params[brokenParams[i].split('=')[0]] = brokenParams[i].split('=')[1];
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
            if (params.hasOwnProperty(key) && params[key]) {
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

        if (prevProps[0].location.pathname != this.props[0].location.pathname) {
            this.init();
        }
    }


    render() {
        let product = this.state.product;

        const settings = {
            dots: false,
            infinite: true,
            speed: 500,
            slidesToShow: 1,
            slidesToScroll: 1,
            vertical: true,
            verticalSwiping: true,

        };
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
                                    <ul className="tabs">
                                        <li >
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}`}>Shop</Link>
                                        </li>
                                        <li className="active">
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

                                    <div className="orders-wrap">
                                        <div className="top">
                                            <h3>Lista narudžbi</h3>
                                            <div className="search-wrap">
                                                <div>
                                                    <Isvg src={search} />
                                                    <input type="text" placeholder="Pretraži narudžbe" />
                                                    <button>
                                                        <Isvg src={rightArrowSmall} />
                                                    </button>
                                                </div>

                                            </div>
                                        </div>

                                        <div className="table">
                                            <div>
                                                <table>
                                                    <tr>
                                                        <th>Broj</th>
                                                        <th>Ime i prezime</th>
                                                        <th>Ulica</th>
                                                        <th>Grad</th>
                                                        <th>Telefon</th>
                                                        <th>Napomena</th>
                                                        <th>Ukupno</th>
                                                        <th>Status</th>
                                                        <th>Kod</th>
                                                        <th>Datum</th>
                                                        <th>Akcije</th>
                                                    </tr>

                                                    {
                                                        this.state.orders && this.state.orders.map((item, idx) => {
                                                            return (
                                                                <tr>
                                                                    <td>{item.orderNumber}</td>
                                                                    <td>{item.shippingAddress.name}</td>
                                                                    <td>{item.shippingAddress.address}</td>
                                                                    <td>{item.shippingAddress.city}</td>
                                                                    <td>{item.shippingAddress.phoneNumber}</td>
                                                                    <td>{item.shippingAddress.note}</td>
                                                                    <td>{(item.total ? item.total : 0).formatPrice(2)} KM</td>
                                                                    <td>{item.status}</td>
                                                                    <td>{item.trackingCode}</td>
                                                                    <td>{moment.unix(item.timestamp).format('DD.MM.YYYY. | HH:mm')} h</td>
                                                                    <td>
                                                                        <Link target="_blank" to={`/shop/${this.props[0].match.params.storeAlias}/invoice/${item._id}`}><button><Isvg src={documentIcon} /></button></Link>
                                                                        <button onClick={() => {
                                                                            fetch(`${API_ENDPOINT}/orders/set/charged/${this.props[0].match.params.storeAlias}/${item._id}/${item.charged ? '0' : '1'}`, {
                                                                                method: 'GET',
                                                                                headers: {
                                                                                    'content-type': 'application/json',
                                                                                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`


                                                                                },
                                                                            }).then(res => res.json()).then((result) => {

                                                                                this.init();
                                                                            })

                                                                        }} className={item.charged ? 'active' : ''}><Isvg src={cashIcon} /></button>
                                                                        <button className={item.status == 'Poslato' ? 'active' : ''} onClick={() => {
                                                                            fetch(`${API_ENDPOINT}/orders/set/status/${this.props[0].match.params.storeAlias}/${item._id}/${item.status == 'Poslato' ? '0' : '1'}`, {
                                                                                method: 'GET',
                                                                                headers: {
                                                                                    'content-type': 'application/json',
                                                                                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                                                                                },
                                                                            }).then(res => res.json()).then((result) => {
                                                                                if (item.status !== 'Poslato') {
                                                                                    this.setState({
                                                                                        trackingCode: '',
                                                                                        deliveryModal: item._id
                                                                                    })
                                                                                }
                                                                                this.init();
                                                                            })

                                                                        }}><Isvg src={truckIcon} /></button>
                                                                        <button onClick={() => this.props.handleDelete(() => {
                                                                            fetch(`${API_ENDPOINT}/orders/delete/${this.props[0].match.params.storeAlias}/${item._id}`, {
                                                                                method: 'DELETE',
                                                                                headers: {
                                                                                    'content-type': 'application/json',
                                                                                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                                                                                },
                                                                            }).then(res => res.json()).then((result) => {

                                                                                this.init();
                                                                            })

                                                                        })}><Isvg src={trashIcon} /></button>

                                                                    </td>

                                                                </tr>

                                                            )
                                                        })
                                                    }

                                                </table>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </Col>

                        </Row>

                    </Container>

                </div>

                <Container>
                    <Row>
                        <Col lg="12">
                            <ReactPaginate
                                previousLabel={''}
                                nextLabel={''}
                                breakLabel={'...'}
                                breakClassName={'break-me'}
                                pageCount={this.state.totalOrders}
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

                </Container>




                {this.state.deliveryModal ?
                    <div className="delete-modal">
                        <div>
                            <Isvg src={truckIcon} />
                            <h6>Unesite kod za praćenje pošiljke</h6>
                            <input type="text" placeholder="Unesite kod" value={this.state.trackingCode} onChange={(e) => this.setState({ trackingCode: e.target.value })}></input>
                            <div className="buttons">
                                <button onClick={() => this.setState({ deliveryModal: null, trackingCode: '' })}>OTKAŽI</button>
                                <button onClick={() => {
                                    fetch(`${API_ENDPOINT}/orders/set/trackingCode/${this.props[0].match.params.storeAlias}/${this.state.deliveryModal}/${this.state.trackingCode}`, {
                                        method: 'GET',
                                        headers: {
                                            'content-type': 'application/json',
                                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                                        },
                                    }).then(res => res.json()).then((result) => {
                                        this.setState({
                                            trackingCode: '',
                                            deliveryModal: null
                                        })
                                        this.init();
                                    })
                                }
                                }>POTVRDI</button>
                            </div>
                        </div>

                    </div>
                    :
                    null
                }



            </div>
        );
    }
}

export default Page(StoreOrdersPage);