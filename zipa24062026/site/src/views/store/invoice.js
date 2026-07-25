import React, { Component } from 'react';
import Isvg from 'react-inlinesvg';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';

import logo from '../../assets/svg/logo.svg';



import moment from 'moment';
var Barcode = require('react-barcode');

class StoreInvoicePage extends Component {
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
        let store = this.state.storeData ? this.state.storeData : {};
        let order = this.state.order && this.state.order.shippingAddress ? this.state.order : { shippingAddress: {} };
        return (

            <div className="invoice-wrap">
                <div className="invoice-container">
                    <div className="head-wrap">

                        <Container>
                            <Row className="head d-print-flex">
                                <Col lg="6" xs="6" className="store-image col-print-6">
                                    <img src={store.profilePhoto} />
                                </Col>
                                <Col lg="6" xs="6" className="store-info col-print-6">
                                    <h3>{store.name}</h3>
                                    <h6>Adresa: {store.address} {store.city}</h6>
                                    <h6>Tel.: {store.phoneNumber}</h6>
                                    <h6>Web.: {store.webSite}</h6>

                                </Col>
                            </Row>
                        </Container>
                    </div>
                    <Container>
                        <Row>

                            <Col lg="6" xs="6" className="shippingAddress col-print-6">
                                <h6>Narudžba</h6>
                                <table>
                                    <tr>
                                        <td>Broj: </td>
                                        <td>{order.orderNumber}</td>
                                    </tr>
                                    <tr>
                                        <td>Datum: </td>
                                        <td>{moment.unix(order.timestamp).format('DD.MM.YYYY. | HH:mm')} h</td>
                                    </tr>
                                </table>
                            </Col>


                            <Col lg="6" xs="6" className="shippingAddress col-print-6">
                                <h6>Kupac</h6>
                                <table>
                                    <tr>
                                        <td>Ime i prezime: </td>
                                        <td>{order.shippingAddress.name}</td>
                                    </tr>
                                    <tr>
                                        <td>Telefon: </td>
                                        <td>{order.shippingAddress.phoneNumber}</td>
                                    </tr>
                                    <tr>
                                        <td>Adresa: </td>
                                        <td>{order.shippingAddress.address}</td>
                                    </tr>

                                    <tr>
                                        <td>Grad: </td>
                                        <td>{order.shippingAddress.city}</td>
                                    </tr>

                                </table>
                            </Col>

                            <Col lg="12" className="col-print-12 items-table">
                                <table>
                                    <tr>
                                        <th>Bar kod</th>
                                        <th>Šifra</th>
                                        <th>Naziv artikla</th>
                                        <th>Količina</th>
                                        <th>Cijena</th>
                                        <th>Izons</th>
                                    </tr>
                                    {
                                        order && order.products && order.products.map((item, idx) => {
                                            return (
                                                <tr key={idx}>
                                                    <td><Barcode value={item.barCode} fontSize={12} height={24} width={2} background="transparent" /></td>
                                                    <td>{item.sku}</td>
                                                    <td>{item.name}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{item.price.formatPrice(2)}</td>
                                                    <td>{(item.price * item.quantity).formatPrice(2)}</td>
                                                </tr>

                                            )
                                        })
                                    }


                                </table>

                            </Col>
                            <Col lg="8" xs="8" className="col-print-8 note-col">
                                <h6>Napomena</h6>
                                <p>{order.shippingAddress.note}</p>
                            </Col>

                            <Col lg="4" xs="4" className="col-print-4 total-table">
                                <table>
                                    <tr>
                                        <td>Iznos</td>
                                        <td>{(order.subtotal ? order.subtotal : 0).formatPrice(2)} KM</td>
                                    </tr>
                                    <tr>
                                        <td>Dostava: </td>
                                        <td>{(order.shippingPrice ? order.shippingPrice : 0).formatPrice(2)} KM</td>
                                    </tr>
                                    <tr>
                                        <td>ZA UPLATU</td>
                                        <td>{(order.total ? order.total : 0).formatPrice(2)} KM</td>
                                    </tr>
                                </table>
                            </Col>



                        </Row>

                    </Container>


                    <div className="bottom">
                        <Container>
                            <Row>
                                <Col lg="12" className="content">
                                    <div>© 2024 eeshop.ba All rights reserved.</div>
                                    <Isvg src={logo} />

                                </Col>
                            </Row>
                        </Container>
                    </div>
                </div>

            </div>
        );
    }
}

export default StoreInvoicePage;