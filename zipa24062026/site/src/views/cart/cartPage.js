import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';


import Article, { kataloskiBroj } from '../../components/articles/article';


import rightArrow from '../../assets/svg/right-arrow.svg';
import cart from '../../assets/svg/cart.svg';
import emptyCart from '../../assets/svg/empty-cart.svg';

import lock from '../../assets/svg/secure.svg';
import doneIcon from '../../assets/svg/done.svg';
import { API_ENDPOINT, PHOTOS_ENDPOINT } from '../../constants';

class CartPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);
        this.removeFromCart = this.removeFromCart.bind(this);
        this.emptyCart = this.emptyCart.bind(this);

        this.state = {
            cart: [],
            uklonjena: null,
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

            /*
             * Stavka se traži po SVA TRI podatka, ne po `indexOf`.
             *
             * Ranije je ovde stajalo `cart.splice(cart.indexOf(id), 1)`.
             * `cart` je niz objekata `{galleryId, photoId, resolution}`, a
             * `id` je string — `indexOf` je zato uvek vraćao -1, pa je
             * `splice(-1, 1)` brisao POSLEDNJU stavku, koju god da si
             * kliknuo. Prijavljeni korisnici nisu bili pogođeni jer kod njih
             * ide poziv na server sa sva tri parametra.
             *
             * Ista fotografija može biti u korpi u dve rezolucije, pa
             * `resolution` mora da uđe u poređenje — inače bi se brisala
             * pogrešna od te dve. `photoId` i `resolution` se porede kao
             * brojevi, jer iz `localStorage` znaju da stignu kao stringovi.
             */
            const trazeno = cart.findIndex((s) =>
                String(s.galleryId) === String(id)
                && Number(s.photoId) === Number(photoId)
                && Number(s.resolution) === Number(resolution)
            );

            if (trazeno !== -1) {
                cart.splice(trazeno, 1);
            }

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


    /*
     * Uklanjanje sa mogućnošću poništenja.
     *
     * Stavka se pamti u stanju pa se `removeFromCart` poziva nepromenjen.
     * „Vrati" koristi ISTE postojeće puteve kojima se stavka i dodaje —
     * `addToCart` za prijavljene, `localStorage` za goste. Nema novih poziva.
     */
    ukloniUzPonistenje = (stavka) => {
        this.setState({ uklonjena: stavka });
        this.removeFromCart(stavka._id, stavka.photoId, stavka.resolution);
    };

    vratiUklonjenu = () => {
        const s = this.state.uklonjena;
        if (!s) return;

        if (this.props.uData) {
            this.props.addToCart({ _id: s._id }, s.photoId, s.resolution);
            setTimeout(this.init, 400);
        } else {
            let cart = localStorage.getItem('cart');
            cart = cart ? JSON.parse(cart) : [];
            cart.push({ galleryId: s._id, photoId: s.photoId, resolution: s.resolution });
            localStorage.setItem('cart', JSON.stringify(cart));
            this.init();
        }
        this.setState({ uklonjena: null });
    };

    render() {
        const l = this.props.lang;

        let total = 0;
        if (this.state.cart) {
            for (let i = 0; i < this.state.cart.length; i++) {
                total += parseFloat(this.state.cart[i].price);
            }
        }

        const stavki = this.state.cart ? this.state.cart.length : 0;
        const obrada = this.state.shippingPrice;

        // Kataloški broj galerije + mesto fotografije = ID za narudžbu, isti
        // koji stoji u prozoru sa fotografijom.
        const idStavke = (s) => {
            const kat = kataloskiBroj(s.date, s._id);
            if (!kat) return null;
            return `${kat}-${String((s.photoId || 0) + 1).padStart(3, '0')}`;
        };

        return (
            <div className={'cart-wrap z-korpa' + (stavki ? ' z-korpa--sa-trakom' : '')}>
                <Container>

                    <div className="z-korpa__vrh">
                        <h1 className="z-korpa__naslov">{'Korpa'.translate(l)}</h1>
                        {!this.state._done ? (
                            <span className="z-korpa__broj">
                                {stavki} {'fotografija'.translate(l)}
                            </span>
                        ) : null}
                    </div>

                    {this.state._done ? (
                        /* ── narudžba završena ───────────────────────── */
                        <div className="z-korpa__gotovo">
                            <Isvg src={doneIcon} />
                            <h2 className="z-korpa__prazna-naslov">
                                {'Vaša narudžba je završena!'.translate(l)}
                            </h2>
                            <p className="z-korpa__prazna-opis">
                                {'Kupljene fotografije možete preuzeti na'.translate(l)}{' '}
                                <Link to="/account/downloads">{'stranici preuzimanja'.translate(l)}</Link>.
                            </p>
                            <Link className="z-korpa__dugme" to="/galerije">
                                {'Pretraži još fotografija'.translate(l)}
                            </Link>
                        </div>
                    ) : stavki ? (
                        /* ── korpa sa stavkama ───────────────────────── */
                        <div className="z-korpa__raspored">

                            <div>
                                <div className="z-korpa__stavke">
                                    {this.state.cart.map((s, idx) => {
                                        const foto = (s.photos && (s.photos[s.photoId] || s.photos[0])) || null;
                                        const putanja = `/galerija/${Object.translate(s, 'alias', l)}/${s._id}`;
                                        const id = idStavke(s);

                                        return (
                                            <div className="z-korpa__stavka" key={s.cartId || idx}>
                                                <Link to={putanja} className="z-korpa__slika" tabIndex="-1" aria-hidden="true">
                                                    {foto ? (
                                                        <img
                                                            src={`${PHOTOS_ENDPOINT}/photos/350x/${foto.image}`}
                                                            alt=""
                                                            loading="lazy"
                                                        />
                                                    ) : null}
                                                </Link>

                                                <div className="z-korpa__podaci">
                                                    <h2 className="z-korpa__naziv">
                                                        <Link to={putanja}>
                                                            {Object.translate(s, 'name', l)}
                                                        </Link>
                                                    </h2>
                                                    <p className="z-korpa__meta">
                                                        {id ? (
                                                            <span className="z-korpa__id">{id}</span>
                                                        ) : null}
                                                        {/* Rezolucija se ne može menjati iz korpe —
                                                            na serveru ne postoji ruta za izmjenu. */}
                                                        <span className="z-korpa__rezolucija">
                                                            {s.resolution} px
                                                        </span>
                                                        {s.location ? <span>{s.location}</span> : null}
                                                    </p>
                                                </div>

                                                <div className="z-korpa__desno">
                                                    <span className="z-korpa__cena">
                                                        ${(s.price).formatPrice(2)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="z-korpa__ukloni"
                                                        onClick={() => this.ukloniUzPonistenje(s)}
                                                    >
                                                        {'Ukloni'.translate(l)}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {this.state.uklonjena ? (
                                    <div className="z-korpa__ponisti" role="status">
                                        <span>{'Uklonjeno iz korpe.'.translate(l)}</span>
                                        <button
                                            type="button"
                                            className="z-korpa__ponisti-dugme"
                                            onClick={this.vratiUklonjenu}
                                        >
                                            {'Vrati'.translate(l)}
                                        </button>
                                    </div>
                                ) : null}

                                <div className="z-korpa__radnje-spiska">
                                    <Link className="z-korpa__tiho-dugme" to="/galerije">
                                        {'Nastavi kupovinu'.translate(l)}
                                    </Link>
                                    <button
                                        type="button"
                                        className="z-korpa__tiho-dugme"
                                        onClick={this.emptyCart}
                                    >
                                        {'Isprazni korpu'.translate(l)}
                                    </button>
                                </div>
                            </div>

                            {/* ── zbir ───────────────────────────────── */}
                            <aside className="z-korpa__zbir" id="placanje">
                                <h2 className="z-korpa__zbir-naslov">
                                    {'Zbir'.translate(l)}
                                </h2>

                                <div className="z-korpa__zbir-red">
                                    <span>{'Fotografije'.translate(l)}</span>
                                    <span>${total.formatPrice(2)}</span>
                                </div>

                                {obrada !== undefined && obrada !== null ? (
                                    <div className="z-korpa__zbir-red">
                                        <span>{'Troškovi obrade'.translate(l)}</span>
                                        <span>${obrada.formatPrice(2)}</span>
                                    </div>
                                ) : null}

                                <div className="z-korpa__zbir-ukupno">
                                    <span>{'Ukupno'.translate(l)}</span>
                                    <span>${(total).formatPrice(2)}</span>
                                </div>

                                {/* Licenca stoji PRE plaćanja, ne posle. */}
                                <p className="z-korpa__licenca">
                                    {'Kupovinom dobijate pravo korištenja fotografije u skladu sa'.translate(l)}{' '}
                                    <Link to="/page/uslovi-koriscenja">
                                        {'uslovima korištenja'.translate(l)}
                                    </Link>
                                    {'. Preprodaja i ustupanje trećim licima nisu dozvoljeni.'.translate(l)}
                                </p>

                                <div
                                    className="z-korpa__placanje paypal-container"
                                    ref={(node) => this.paypalContainer = node}
                                ></div>

                                <p className="z-korpa__sigurno">
                                    <Isvg src={lock} />
                                    {'Sigurna kupovina'.translate(l)}
                                </p>
                            </aside>
                        </div>
                    ) : (
                        /* ── prazna korpa: poziv na radnju ───────────── */
                        <div className="z-korpa__prazna">
                            <h2 className="z-korpa__prazna-naslov">
                                {'Korpa je prazna'.translate(l)}
                            </h2>
                            <p className="z-korpa__prazna-opis">
                                {'Pretražite arhivu i pronađite fotografije koje vam trebaju.'.translate(l)}
                            </p>
                            <Link className="z-korpa__dugme" to="/galerije">
                                {'Pretraži fotografije'.translate(l)}
                            </Link>

                            {this.props.najnovije && this.props.najnovije.length ? (
                                <>
                                    <h3 className="z-korpa__predlozi-naslov">
                                        {'Najnovije iz arhive'.translate(l)}
                                    </h3>
                                    <Row className="articles">
                                        {this.props.najnovije.map((g, idx) => (
                                            <Col lg="3" md="4" xs="6" key={idx}>
                                                <Article
                                                    _id={g._id}
                                                    categoryName={Object.translate(g, 'categoryName', l)}
                                                    image={g.photos && g.photos[0] && g.photos[0].image}
                                                    name={Object.translate(g, 'name', l)}
                                                    shortDescription={Object.translate(g, 'description', l)}
                                                    alias={Object.translate(g, 'alias', l)}
                                                    userAlias={g.userAlias}
                                                    imagesCount={g.photosCount !== undefined ? g.photosCount : (g.photos && g.photos.length)}
                                                    location={g.location}
                                                    published={g.date}
                                                    homeArticle
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                </>
                            ) : null}
                        </div>
                    )}
                </Container>

                {/* ── traka za dno ekrana, samo na telefonu ───────────── */}
                {stavki && !this.state._done ? (
                    <div className="z-korpa__traka-dno">
                        <span className="z-korpa__traka-zbir">
                            {'Ukupno'.translate(l)}
                            <strong>${(total).formatPrice(2)}</strong>
                        </span>
                        <a className="z-korpa__dugme" href="#placanje">
                            {'Na plaćanje'.translate(l)}
                        </a>
                    </div>
                ) : null}
            </div>
        );
    }
}

export default Page(CartPage);