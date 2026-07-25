import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';
import Form from '../../components/forms/addressForm';
import BlogArticle from '../../components/articles/blogArticle';


import rightArrow from '../../assets/svg/right-arrow.svg';
import lock from '../../assets/svg/secure.svg';
import doneIcon from '../../assets/svg/done.svg';
import { API_ENDPOINT } from '../../constants';

class CheckoutPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            cart: [],
            ...props.initialData
        };
    }


    init() {
        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname).then((data) => {
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

        this.init();

    }

    componentDidUpdate(prevProps, prevState) {

    }


    finishOrder = (data) => {
        fetch(`${API_ENDPOINT}/checkout/finish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                shippingAddress: data,
                items: this.state.cart.map((item) => { return { productId: item._id, quantity: item.quantity } })
            })
        }).then((res) => res.json()).then((result) => {
            if (!result.error) {
                this.setState({
                    done: true
                }, () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                })
            }
        })
    }

    render() {
        let total = 0;
        if (this.state.cart) {
            for (let i = 0; i < this.state.cart.length; i++) {
                total += parseFloat(this.state.cart[i].price);
            }
        }

        return (
            <div className="cart-wrap">
                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="12" className="cart-info">
                                <Isvg src={lock} />
                                <div>
                                    <h1>Sigurna kupovina</h1>
                                    <p>Imate {this.state.cart.length} {this.state.cart.length == 1 ? 'artikal' : 'artikla'} u korpi</p>
                                </div>
                            </Col>
                        </Row>

                    </Container>
                </div>

                {!this.state.done ?
                    <section className="checkout-section">
                        <Container>
                            <Row>
                                <Col lg="8">
                                    <h3>Pregled narudžbe</h3>
                                    <h4>Provjerite svoju narudžbu, količinu, dostava i plaćanje.</h4>

                                    <div className="invoice">
                                        <h6>Artikli</h6>
                                        {
                                            this.state.cart && this.state.cart.length && this.state.cart.map((item, idx) => {
                                                return (
                                                    <div className="item">
                                                        <p className="name">{Object.translate(item, 'name', this.props.lang)}</p>
                                                        <p className="price">${(item.price).formatPrice(2)}</p>
                                                    </div>

                                                )
                                            })
                                        }
                                        <div className="fee">
                                            <p className="name">Dostava:</p>
                                            <p className="price">{this.state.shippingPrice ? this.state.shippingPrice.formatPrice(2) : '?'} KM</p>
                                        </div>
                                        <div className="total">
                                            <p className="name">Ukupno:</p>
                                            <p className="price">{(total + this.state.shippingPrice).formatPrice(2)} KM </p>
                                        </div>

                                    </div>
                                </Col>
                                <Col lg={{ size: 3, offset: 1 }}>
                                    <div className="info-box">
                                        <h6>Ukupno u korpi</h6>
                                        <div className="item">
                                            <span className="name">Artikli</span>
                                            <span className="price">{total.formatPrice(2)} KM</span>
                                        </div>
                                        <div className="item">
                                            <span className="name">Dostava</span>
                                            <span className="price">{this.state.shippingPrice ? this.state.shippingPrice.formatPrice(2) : '?'} KM</span>
                                        </div>


                                        <div className="item">
                                        </div>
                                        <div className="total">
                                            <span className="name">Ukupno:</span>
                                            <span className="price">{(total + this.state.shippingPrice).formatPrice(2)} KM</span>
                                        </div>

                                        <p><Isvg src={lock} />Sigurna kupovina</p>
                                    </div>
                                </Col>

                            </Row>
                        </Container>

                    </section>

                    :

                    <section className="downloads-section">
                        <Container>
                            <Row>
                                <Col lg={"12"} className="area">

                                    <div className="no-items">
                                        <Isvg src={doneIcon} />
                                        <h6>Vaša narudžba je završena!</h6>
                                        <p>Očekujte dostavu u roku od 24 do 48 sati.</p>
                                        <Link to='/'><button>Pretraži još artikala <Isvg src={rightArrow} /> </button></Link>
                                    </div>

                                </Col>
                            </Row>
                        </Container>
                    </section>


                }



            </div >
        );
    }
}

export default Page(CheckoutPage);