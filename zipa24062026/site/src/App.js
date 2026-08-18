import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import Routes from './routes'

import {Provider} from 'react-redux'
import {createStore, combineReducers} from 'redux'
import {reducer as formReducer} from 'redux-form'

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Isvg from 'react-inlinesvg';
import trashIcon from './assets/svg/orders-trash.svg';

import DocumentMeta from 'react-document-meta';
import {withRouter} from 'react-router'

const langs = require('./langs');
import {API_ENDPOINT} from './constants';

const rootReducer = combineReducers({
    form: formReducer
});

const store = createStore(rootReducer)
if (String.prototype.translate == null) {
    String.prototype.translate = function (lang) {

        /* if (!localStorage.translate){
           localStorage.translate = JSON.stringify({
             'sr': {

             },
             'en': {

             },
             'de': {

             }
           });
         }

         let obj = JSON.parse(localStorage.translate);
         obj.en[this] = this;
         obj.sr[this] = this;
         obj.de[this] = this;
         localStorage.translate = JSON.stringify(obj);

         return this;*/

        if (langs[lang] && langs[lang][this])
            return langs[lang][this];
        else return this;
    }
}


Number.prototype.formatPrice = function (sep = 2) {
    let dec_point = '.';
    let thousands_sep = ',';

    var parts = parseFloat(this).toFixed(sep).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands_sep);

    return parts.join(dec_point);
}

String.prototype.formatPrice = function (sep = 2) {
    let dec_point = '.';
    let thousands_sep = ',';

    var parts = parseFloat(this).toFixed(sep).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands_sep);

    return parts.join(dec_point);
}


Object.translate = function (o, s, lang) {
    if (!o) {
        return '';
    }

    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o[lang] ? o[lang] : o['ba'];
}


Object.get = function (o, s) {
    if (!o) {
        return null;
    }

    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}


class App extends Component {


    constructor(props) {
        super(props);
        this.addToCart = this.addToCart.bind(this);
        this.verifyUser = this.verifyUser.bind(this);
        this.googleMapsCallback = this.googleMapsCallback.bind(this);
        this.showInfoMessage = this.showInfoMessage.bind(this);
        this.hideInfoMessage = this.hideInfoMessage.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.updateCart = this.updateCart.bind(this);
        this.updateMeta = this.updateMeta.bind(this);


        if (typeof window !== "undefined") {
            window.googleMapsCallback = this.googleMapsCallback;
        }

        this.state = {
            banners: [],
            lang: 'ba',
            categories: [],
            photographers: [],
            pages: [],
            uData: null,
            productAddedToCart: null,
            infoMessages: {},
            settings: {}

        };
    }


    /*
     * Izbor jezika se pamti u pregledaču.
     *
     * Ranije je stajao samo u stanju strane, pa se pri svakom prelasku na
     * drugu stranu vraćao na bosanski — posetilac koji izabere engleski bi
     * ga izgubio već na sledećem kliku.
     */
    setLang = (lang) => {
        this.setState({ lang });
        try {
            localStorage.setItem('jezik', lang);
        } catch (e) { /* privatni režim — jezik onda važi samo do osvežavanja */ }
    }

    handleDelete(func) {
        this.setState({
            deletePrompt: func
        });
    }

    showInfoMessage(text, error) {
        let messages = this.state.infoMessages;
        let idx = Date.now().toString();
        messages[idx] = {
            idx: idx,
            message: text,
            error: error
        };

        this.setState({
            infoMessages: messages
        }, () => {
            this.forceUpdate();
            setTimeout(() => {
                this.hideInfoMessage(idx);
            }, 3000);
        });


    }

    hideInfoMessage(idx) {
        let messages = this.state.infoMessages;
        if (!messages[idx])
            return;
        messages[idx].animate = true;
        this.setState({
            infoMessages: messages
        }, () => {
            setTimeout(() => {


                let messages = this.state.infoMessages;
                delete messages[idx];
                this.setState({
                    infoMessages: messages
                })
            }, 1000);
        })
    }


    googleMapsCallback() {
        this.setState({
            _googleMapsLoaded: true
        })
    }

    componentDidMount() {
        // Vraćamo jezik koji je posetilac ranije izabrao.
        try {
            const zapamcen = localStorage.getItem('jezik');
            if (zapamcen && zapamcen !== this.state.lang) {
                this.setState({ lang: zapamcen });
            }
        } catch (e) { /* privatni režim */ }

        this.initFetch();
    }

    initFetch = () => {
        this.verifyUser();

        fetch(`${API_ENDPOINT}/categories`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                categories: result
            })
        })


        fetch(`${API_ENDPOINT}/photographers`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                photographers: result
            })
        })

        fetch(`${API_ENDPOINT}/banners`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            },
        }).then(res => res.json()).then((result) => {
            //shuffle(result);

            let banners = [];

            for (let i = 0; i < result.length; i++) {

                if (result[i].leftSide && !result[i].hidden) {
                    this.setState({
                        leftSideBanner: result[i]
                    })
                }

                if (result[i].sponsor && !result[i].hidden) {
                    this.setState({
                        sponsorBanner: result[i]
                    })
                }
                if (result[i].detail && !result[i].hidden) {
                    this.setState({
                        detailBanner: result[i]
                    })
                }

                if (result[i].ad && !result[i].hidden) {
                    this.setState({
                        adBanner: result[i]
                    })
                }


                if (result[i].rightSide && !result[i].hidden) {
                    this.setState({
                        rightSideBanner: result[i]
                    })
                }
                if (result[i].footer && !result[i].hidden) {
                    this.setState({
                        footerBanner: result[i]
                    })
                }

                // Baner za iskačuću reklamu na telefonu.
                if (result[i].mobilePopup && !result[i].hidden) {
                    this.setState({
                        mobilePopupBanner: result[i]
                    })
                }


                if (!result[i].leftSide && !result[i].rightSide && !result[i].footer && !result[i].sponsor && !result[i].detail && !result[i].ad && !result[i].mobilePopup && !result[i].hidden) {
                    banners.push(result[i]);
                }

            }

            this.setState({
                banners: banners
            })
        })
        fetch(`${API_ENDPOINT}/settings`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            },
        }).then(res => res.json()).then((result) => {
            //shuffle(result);

            this.setState({
                settings: result
            })
        })


        let authToken = 'Bearer ' + localStorage.getItem('authToken');

        fetch(`${API_ENDPOINT}/log`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': authToken
            },
            body: JSON.stringify({
                url: `${location.pathname}${location.search}`
            })
        })

        this.props.history.listen((location) => {
            let authToken = 'Bearer ' + localStorage.getItem('authToken');

            fetch(`${API_ENDPOINT}/log`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': authToken
                },
                body: JSON.stringify({
                    url: `${location.pathname}${location.search}`
                })
            })

        })

    }


    verifyUser() {
        fetch(`${API_ENDPOINT}/user/verify`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => {
            return res.json()
        }).then((result) => {
            if (!result.error) {
                this.setState({
                    uData: result
                })
            }
        })

    }

    addToCart(gallery, photoId, resolution) {
        if (this.state.uData) {
            fetch(`${API_ENDPOINT}/cart/add/${gallery._id}/${photoId}/${resolution}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
            }).then(res => res.json()).then((result) => {
                if (!result.error) {
                    this.showInfoMessage('Fotografija je uspješno dodata u korpu');
                }
            })

        }/* else {
      let cart = localStorage.getItem('cart');
      if (!cart) {
        cart = [];
      } else {
        cart = JSON.parse(cart);
      }

      let found = false;
      for (let i = 0; i < cart.length; i++) {
        if (cart[i].productId == product._id) {
          cart[i].quantity++;
          found = true;
        }

      }

      if (!found) {
        cart.push({
          productId: product._id,
          quantity: 1
        })
      }
      this.showInfoMessage('Artikal je uspješno dodat u korpu');

      localStorage.setItem('cart', JSON.stringify(cart));
    }*/
    }


    bannerClick = (url) => {
        fetch(`${API_ENDPOINT}/banner/click`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({url: url})
        })
    }

    updateCart(product, quantity, callback) {
        if (this.state.uData) {
            fetch(`${API_ENDPOINT}/cart/update/${product._id}/${quantity}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
            }).then(res => res.json()).then((result) => {
                if (!result.error) {
                    callback();
                }
            })

        } else {
            let cart = localStorage.getItem('cart');
            if (!cart) {
                cart = [];
            } else {
                cart = JSON.parse(cart);
            }

            let found = false;
            for (let i = 0; i < cart.length; i++) {
                if (cart[i].productId == product._id) {
                    cart[i].quantity = quantity;
                    found = true;
                    callback();
                }

            }

            localStorage.setItem('cart', JSON.stringify(cart));
        }
    }

    updateMeta(data) {
        this.setState({
            metaTags: data
        })
    }

    handleDetailSearch = (val) => {
        this.setState({
            detailSearch: val
        })
    }


    render() {
        let meta;

        if (this.state.metaTags) {
            meta = {
                title: this.state.metaTags.title + ' - ZIPA PHOTO',
                description: this.state.metaTags.description ? this.state.metaTags.description : null,
                meta: {
                    charset: 'utf-8',
                    name: {
                        'og:title': this.state.metaTags.title + ' - ZIPA PHOTO',
                        'og:image': this.state.metaTags['og:image'] ? this.state.metaTags['og:image'] : null,
                        'og:description': this.state.metaTags.description ? this.state.metaTags.description : null
                    }
                }
            };


        }

        return (
            <Provider store={store}>
                {
                    meta ?

                        <DocumentMeta {...meta}>
                        </DocumentMeta>

                        :
                        null
                }
                <Routes
                    {...this.state}
                    {...this.props}
                    signOut={() => {
                        localStorage.removeItem('authToken');
                        this.setState({uData: null})
                    }}
                    hideAddToCartModal={() => this.setState({productAddedToCart: null})}
                    addToCart={this.addToCart}
                    verifyUser={this.verifyUser}
                    handleDelete={this.handleDelete}
                    updateCart={this.updateCart}
                    updateMeta={this.updateMeta}
                    handleDetailSearch={this.handleDetailSearch}
                    initFetch={this.initFetch}
                    showInfoMessage={this.showInfoMessage}
                    setLang={this.setLang}
                    bannerClick={this.bannerClick}
                />


                <div className="pop-up-messages">
                    {
                        Object.values(this.state.infoMessages).map((item, idx) => {
                            return (
                                <div className={item.animate ? 'hide-message ' : ''} key={idx}
                                     onClick={() => this.hideInfoMessage(item.idx)}>
                                    <i className="mdi mdi-close hide"/>

                                    <p className={item.error ? 'error' : ''}>{item.error ?
                                        <i className="mdi mdi-close"></i> : null}{item.message}</p>
                                </div>
                            )
                        })
                    }

                </div>

                {this.state.deletePrompt ?
                    <div className="delete-modal">
                        <div>
                            <Isvg src={trashIcon}/>
                            <h6>Potvrdite brisanje</h6>
                            <div className="buttons">
                                <button onClick={() => this.setState({deletePrompt: null})}>NE</button>
                                <button onClick={() => {
                                    this.state.deletePrompt();
                                    this.setState({
                                        deletePrompt: null
                                    })
                                }
                                }>DA
                                </button>
                            </div>
                        </div>

                    </div>
                    :
                    null
                }


            </Provider>

        );

    }

}

export default withRouter(App);
