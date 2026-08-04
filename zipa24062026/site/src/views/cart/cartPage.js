import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';


import Article from '../../components/articles/cartArticle';
import BlogArticle from '../../components/articles/blogArticle';


import rightArrow from '../../assets/svg/right-arrow.svg';
import cart from '../../assets/svg/cart.svg';
import emptyCart from '../../assets/svg/empty-cart.svg';

import lock from '../../assets/svg/secure.svg';
import doneIcon from '../../assets/svg/done.svg';
import { API_ENDPOINT } from '../../constants';

class CartPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);
        this.removeFromCart = this.removeFromCart.bind(this);
        this.emptyCart = this.emptyCart.bind(this);

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

    removeFromCart(id, photoId, resolution) {
        if (this.props.uData) {
            fetch(`${API_ENDPOINT}/cart/remove/${id}/${photoId}/${resolution}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
            }).then(res => res.json()).then((result) => {
                this.init()
            })

        } else {
            let cart = localStorage.getItem('cart');
            if (!cart) {
                cart = [];
            } else {
                cart = JSON.parse(cart);
            }

            cart.splice(cart.indexOf(id), 1);

            localStorage.setItem('cart', JSON.stringify(cart));
            this.init();
        }
    }

    emptyCart() {
        if (this.props.uData) {
            fetch(`${API_ENDPOINT}/cart/empty`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
            }).then(res => res.json()).then((result) => {
                this.init()
            })

        } else {

            localStorage.setItem('cart', JSON.stringify([]));
            this.init();
        }

    }

    componentDidMount() {

        window.scrollTo(0, 0);

        this.init();
    }
    loadScript() {
        return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            //script.src = 'https://www.paypal.com/sdk/js?client-id=AU6dEOqLcGkaIx5Jn_3DZxjMf2BGPb0GI6OABJLJAv1OsBrV2L4O-4s5teSuwjcmHGOWfXTZwtmS1d8b';
            script.src = 'https://www.paypal.com/sdk/js?client-id=Aeo_ioibFhYvOe1C3Su14KejG9WXXngPuhQG6xZtiQKvMK_J0eCGnF6cRpV6Fij0SDoH4JIYMkIjtuT3';

            script.addEventListener('load', function () {
                resolve();
            });
            script.addEventListener('error', function (e) {
                reject(e);
            });
            document.body.appendChild(script);
        })
    };


    componentDidUpdate(prevProps, prevState) {
        if (!prevState.cart.length && this.state.cart.length) {
            let total = 0.0;
            let items_total = 0.0;
            let handling = 0.3;
            if (this.state.cart) {
                for (let i = 0; i < this.state.cart.length; i++) {
                    items_total += parseFloat(this.state.cart[i].price);
                }
            }
            total = items_total + handling;


            this.loadScript().then(() => {
                window.paypal.Buttons({
                    createOrder: (data, actions) => {
                        // This function sets up the details of the transaction, including the amount and line item details.
                        return actions.order.create({
                            intent: 'CAPTURE',
                            application_context: {
                                brand_name: 'ZIPA PHOTO AGENCY',
                                shipping_preference: 'NO_SHIPPING'
                            },
                            purchase_units: [{
                                amount: {
                                    currency_code: 'USD',
                                    value: total.formatPrice(2),
                                    breakdown: {
                                        handling: {
                                            currency_code: 'USD',
                                            value: handling.formatPrice(2),
                                        },
                                        item_total: {
                                            currency_code: 'USD',
                                            value: items_total.formatPrice(2),
                                        }
                                    }
                                },
                                items: this.state.cart.map((item, idx) => {
                                    return {
                                        name: Object.translate(item, 'name', this.props.lang) > 124 ? Object.translate(item, 'name', this.props.lang).substring(0, 124) + '...' : Object.translate(item, 'name', this.props.lang),
                                        unit_amount: {
                                            currency_code: 'USD',
                                            value: item.price.formatPrice(2),
                                        },
                                        quantity: 1,
                                        sku: item.cartId,
                                        category: 'DIGITAL_GOODS'
                                    }
                                })
                            }]
                        });
                    },
                    onApprove: (data, actions) => {
                        // This function captures the funds from the transaction.
                        return actions.order.capture().then((details) => {
                            fetch(`${API_ENDPOINT}/checkout/finish`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                },
                                body: JSON.stringify({
                                    orderId: details.id,
                                    items: null
                                })
                            }).then(res => res.json()).then((result) => {
                                this.setState({
                                    _done: true
                                })
                            })

                            // This function shows a transaction success message to your buyer.
                            console.log(details);
                            //alert('Transaction completed by ' + details.payer.name.given_name);
                        });
                    }

                }).render(this.paypalContainer);
            })

        }
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
                                <Isvg src={cart} />
                                <div>
                                    <h1>{'Korpa'.translate(this.props.lang)}</h1>
                                    <p>{'Imate'.translate(this.props.lang)} {this.state.cart.length} {this.state.cart.length == 1 ? 'fotografiju'.translate(this.props.lang) : 'fotografije'.translate(this.props.lang)} {'u korpi'.translate(this.props.lang)}</p>
                                </div>
                            </Col>
                        </Row>

                    </Container>
                </div>

                {!this.state._done ?
                    <section className="downloads-section">
                        <Container>
                            <Row>
                                <Col lg={this.state.cart && this.state.cart.length ? "9" : "12"} className="area">
                                    {this.state.cart && this.state.cart.length ?
                                        <div className="top">
                                            <h2>{'Fotografije u korpi'.translate(this.props.lang)}</h2>
                                            <div className="actions">
                                                <button>{'Nastavi kupovinu'.translate(this.props.lang)}</button>
                                                <button onClick={this.emptyCart}>{'Izprazni korpu'.translate(this.props.lang)}</button>

                                            </div>
                                        </div>
                                        :
                                        <div className="no-items">
                                            <Isvg src={emptyCart} />
                                            <h6>{'Vaša korpa je prazna'.translate(this.props.lang)}</h6>
                                            <p>{'Pretražite naš sajt i pronađite željene fotografije.'.translate(this.props.lang)}</p>
                                            <Link to='/'><button>{'Pretraži fotografije'.translate(this.props.lang)} <Isvg src={rightArrow} /> </button></Link>
                                        </div>
                                    }

                                    <Row className="articles">
                                        {
                                            this.state.cart && this.state.cart.map((article, idx) => {
                                                return (
                                                    <Col lg={12}>
                                                        <Article
                                                            image={article.photo && article.photo.image}
                                                            name={Object.translate(article, 'name', this.props.lang)}
                                                            shortDescription={Object.translate(article, 'description', this.props.lang)}
                                                            alias={Object.translate(article, 'alias', this.props.lang)}
                                                            userAlias={article.userAlias}
                                                            imagesCount={article.photosCount !== undefined ? article.photosCount : (article.photos && article.photos.length)}
                                                            location={article.location}
                                                            resolution={article.resolution}
                                                            price={article.price}
                                                            published={article.published}
                                                            updateQuantity={(quantity) => this.props.updateCart(article, quantity, this.init)}
                                                            handleRemove={() => this.removeFromCart(article._id, article.photoId, article.resolution)}
                                                            listView={true}
                                                        />
                                                    </Col>

                                                )
                                            })
                                        }
                                    </Row>



                                </Col>
                                {this.state.cart && this.state.cart.length ?
                                    <Col lg={{ size: 3 }}>
                                        <div className="info-box">
                                            <h6>{'Ukupno u korpi'.translate(this.props.lang)}</h6>
                                            <div className="item">
                                                <span className="name">{'Fotografije'.translate(this.props.lang)}</span>
                                                <span className="price">${total.formatPrice(2)}</span>
                                            </div>

                                            <div className="item">
                                            </div>
                                            <div className="item">
                                                <span className="name">{'Troškovi obrade'.translate(this.props.lang)}</span>
                                                <span className="price">${this.state.shippingPrice ? this.state.shippingPrice.formatPrice(2) : '?'}</span>
                                            </div>
                                            <div className="total">
                                                <span className="name">{'Ukupno:'.translate(this.props.lang)}</span>
                                                <span className="price">${(total).formatPrice(2)}</span>
                                            </div>

                                            <p><Isvg src={lock} />{'Sigurna kupovina'.translate(this.props.lang)}</p>
                                        </div>
                                        <div className="paypal-container" ref={(node) => this.paypalContainer = node}></div>

                                    </Col>

                                    :
                                    null
                                }
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
                                        <h6>{'Vaša narudžba je završena!'.translate(this.props.lang)}</h6>
                                        <p>{'Možete preuzeti kupljene fotografije na sledećem'.translate(this.props.lang)} <Link to='/account/downloads'>{'linku'.translate(this.props.lang)}</Link>.</p>
                                        <Link to='/'><button>{'Pretraži još fotografija'.translate(this.props.lang)} <Isvg src={rightArrow} /> </button></Link>
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

export default Page(CartPage);