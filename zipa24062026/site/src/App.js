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
import PlutajucaKorpa from './components/plutajucaKorpa';

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

        /*
         * Podešavanja ulaze u POČETNO stanje, ne posle dovlačenja.
         *
         * Na serveru stižu kao prop (`server.js` ih dovuče pre iscrtavanja),
         * a u pregledaču iz `window.__PODESAVANJA__`, koji server upiše u
         * početni HTML. Zato prvi prikaz na klijentu izgleda isto kao onaj
         * koji je server već iscrtao — nema treptaja sa „trenutni" na
         * izabrani predlog, i nema razlike pri hidraciji.
         *
         * `/settings` se i dalje dovlači u `componentDidMount` — to samo
         * osvežava vrednost ako se u međuvremenu promenila.
         */
        const pocetnaPodesavanja =
            (typeof window !== 'undefined' && window.__PODESAVANJA__)
            || props.podesavanja
            || {};

        this.state = {
            banners: [],
            lang: 'ba',
            categories: [],
            photographers: [],
            pages: [],
            uData: null,
            productAddedToCart: null,
            infoMessages: {},
            settings: pocetnaPodesavanja,

            // Koliko je fotografija u korpi — za brojač u zaglavlju i
            // plutajuću korpu (2026-09-22). Vidi `osveziKorpu`.
            brojUKorpi: 0

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

    /*
     * Potvrda pre nepovratne radnje.
     *
     * `poruka` je dodata 2026-08-28: prozor je do tada uvek pisao „Potvrdite
     * brisanje", pa se nije mogao upotrebiti ni za šta drugo. Slanje
     * newslettera je zbog toga išlo BEZ ijedne potvrde, na prvi klik, na 62
     * stvarne adrese. Bez drugog argumenta ponašanje je nepromenjeno.
     */
    handleDelete(func, poruka) {
        this.setState({
            deletePrompt: func,
            deletePoruka: poruka || null
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

    /*
     * Tema izgleda na <html data-tema="…">.
     *
     * Izvor je isti kao za izgled naslovne — `settings.homepageLayout`. Pošto
     * podešavanja stižu tek posle prvog iscrtavanja, izbor se pamti u
     * pregledaču i primenjuje odmah pri učitavanju (vidi i kratku skriptu u
     * zaglavlju u `server.js`), pa nema treptaja između stare i nove palete.
     *
     * Vrednost „trenutni" nije izostanak teme nego zatečeni izgled — i za nju
     * se atribut postavlja, jer `_tokens.scss` pod njom vraća stare vrednosti.
     */
    postaviTemu = () => {
        if (typeof document === 'undefined') return;

        const podesavanja = this.state.settings || {};
        let izgled = podesavanja.homepageLayout || 'trenutni';

        // Ista kapija kao u `views/homePage.js`: dok traje pretpregled, novi
        // izgled — pa i njegove boje — vidi samo administrator. Bez ovoga bi
        // posetilac dobio stari raspored u novoj paleti.
        if (izgled !== 'trenutni' && podesavanja.homepageLayoutPreview) {
            const u = this.state.uData;
            const jesamAdmin = u && u.permissions && u.permissions.indexOf('*') !== -1;
            if (!jesamAdmin) izgled = 'trenutni';
        }

        /*
         * Pregled kroz adresu (`?izgled=a`). Od 2026-09-22 pamti se u
         * `sessionStorage` te kartice, pa tema važi na SVIM stranama dok se
         * gleda (galerija, kupovina, korpa) — a podešavanje sajta i ostali
         * posetioci ostaju netaknuti. `?izgled=podesavanja` vraća na izbor
         * iz administracije.
         */
        const izAdrese = (window.location.search || '').match(/[?&]izgled=(a|b|c|trenutni|podesavanja)\b/);
        try {
            if (izAdrese && izAdrese[1] === 'podesavanja') sessionStorage.removeItem('izgledPregled');
            else if (izAdrese) sessionStorage.setItem('izgledPregled', izAdrese[1]);
        } catch (e) { /* privatni režim */ }

        let pregled = null;
        try { pregled = sessionStorage.getItem('izgledPregled'); } catch (e) { pregled = null; }

        const tema = pregled && ['a', 'b', 'c', 'trenutni'].indexOf(pregled) !== -1 ? pregled
            : (['a', 'b', 'c', 'trenutni'].indexOf(izgled) !== -1 ? izgled : 'trenutni');

        if (!pregled) {
            try { localStorage.setItem('tema', tema); } catch (e) { /* privatni režim */ }
        }

        // Na strani sa sistemom stilova preklopnik tema je smisao te strane, pa
        // tamo ona odlučuje šta se vidi. Pamćenje je iznad ovoga već upisano,
        // pa se po odlasku sa nje vraća prava tema iz podešavanja.
        if (window.location && window.location.pathname === '/stilovi') return;

        if (document.documentElement.getAttribute('data-tema') !== tema) {
            document.documentElement.setAttribute('data-tema', tema);
        }
    }

    /*
     * Galerija cija fotografija stoji uz obrazac na `/login` i `/register`.
     *
     * Bira se u administraciji (*Stranice → Prijava i registracija*) i pamti
     * u podesavanjima kao `loginGallery: { id, alias }`. Kad izbora nema —
     * a to je zatecено stanje — strane i dalje uzimaju najnoviju galeriju,
     * pa se nista ne menja dok se izbor ne napravi.
     *
     * Cuva se samo ID i alias, ne i naziv i slika: tako izmena same galerije
     * odmah stigne i na prijavu, bez ponovnog biranja.
     */
    dovuciPrijavaGaleriju = () => {
        const izbor = this.state.settings && this.state.settings.loginGallery;
        if (!izbor || !izbor.id || !izbor.alias) return;

        // Ista galerija se ne dovlaci dvaput.
        if (this.prijavaGalerijaZa === String(izbor.id)) return;
        this.prijavaGalerijaZa = String(izbor.id);

        fetch(`${API_ENDPOINT}/gallery/get/${this.state.lang}/${izbor.alias}/${izbor.id}`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            },
        }).then(res => res.json()).then((g) => {
            if (g && g._id) this.setState({ prijavaGalerija: g });
        }).catch(() => {});
    };

    componentDidMount() {
        // Brojač korpe prati i promene iz drugih kartica pregledača.
        window.addEventListener('storage', this.osveziKorpu);

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

        /*
         * Fotografija za naslovni blok u zaglavlju.
         *
         * Zaglavlje je zajedničko za sve strane, pa ne vidi podatke koje
         * `loadData` naslovne rute dovuče — oni ostaju u samoj strani.
         * Ovde se uzima ista krajnja tačka koju naslovna već koristi
         * (`/gallery/latest`), samo jedna, najnovija galerija.
         *
         * Ovo je JEDINI poziv ka API-ju dodat zbog izgleda. Bez njega
         * naslovni blok nema fotografiju iz arhive.
         */
        fetch(`${API_ENDPOINT}/gallery/latest`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            },
        }).then(res => res.json()).then((result) => {
            const g = (result || []).find(
                (x) => x && x.photos && x.photos.length && x.photos[0].image
            );
            if (g) {
                this.setState({
                    naslovnaFoto: g.photos[0].image,
                    // Ista galerija hrani i traku najave na vrhu zaglavlja.
                    najava: g,
                    // Ceo spisak se zadržava — prazna korpa nudi najnovije
                    // galerije umesto puke poruke. Bez novog poziva.
                    najnovije: (result || []).slice(0, 4)
                });
            }
        }).catch(() => {});

        /*
         * Najava ili obavestenje iz administracije — traka na vrhu zaglavlja.
         *
         * `/announcements` vraca SAMO one koje su u ovom trenutku vazece:
         * ruta filtrira po poljima `from` i `to`, koja se zadaju u
         * *Administracija → Najave*. Zato ovde nema nikakve dodatne provere
         * ni novog polja u bazi — prozor vazenja JE prekidac.
         *
         * Kad nijedna najava nije vazeca, odgovor je prazan i traka pada na
         * najnoviju galeriju (vidi `header.js`).
         */
        fetch(`${API_ENDPOINT}/announcements`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json'
            },
        }).then(res => res.json()).then((result) => {
            const spisak = Array.isArray(result) ? result : [];
            if (!spisak.length) return;

            // Ako ih ima vise vazecih, ide poslednja objavljena.
            const najnovija = spisak
                .slice()
                .sort((a, b) => (b.published || 0) - (a.published || 0))[0];

            this.setState({ najavaAdmin: najnovija });
        }).catch(() => {});

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

            // Tema izgleda dolazi iz istog podešavanja kojim se bira naslovna.
            this.setState({
                settings: result
            }, () => {
                this.postaviTemu();
                this.dovuciPrijavaGaleriju();
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


    /*
     * Vraća OBEĆANJE sa podacima korisnika. Prijava iz njega saznaje ulogu, pa
     * zna gde da odvede — administratora na nadzornu ploču, ostale na njihov
     * nalog. Ko ne treba povratnu vrednost, zove je kao i do sada.
     */
    /*
     * Broj fotografija u korpi. Gost je drži u pregledaču (`localStorage.cart`),
     * prijavljeni kupac na serveru (`/cart`). Osvežava se posle prijave,
     * dodavanja u korpu i svake promene strane.
     */
    osveziKorpu = () => {
        if (typeof window === 'undefined') return;

        if (this.state.uData) {
            fetch(`${API_ENDPOINT}/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({cart: []})
            }).then(res => res.json()).then((rez) => {
                this.setState({brojUKorpi: Array.isArray(rez) ? rez.length : 0});
            }).catch(() => {});
        } else {
            let korpa = [];
            try { korpa = JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { korpa = []; }
            this.setState({brojUKorpi: Array.isArray(korpa) ? korpa.length : 0});
        }
    };

    componentDidUpdate(prevProps) {
        if (prevProps.location && this.props.location
            && prevProps.location.pathname !== this.props.location.pathname) {
            this.osveziKorpu();
        }
    }

    verifyUser() {
        return fetch(`${API_ENDPOINT}/user/verify`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => {
            return res.json()
        }).then((result) => {
            if (!result.error) {
                // Tema se preračunava i ovde: dok traje pretpregled novog
                // izgleda, od dozvola zavisi koju paletu korisnik vidi.
                this.setState({
                    uData: result
                }, () => { this.postaviTemu(); this.osveziKorpu(); })
                return result;
            }
            this.osveziKorpu();
            return null;
        }).catch(() => { this.osveziKorpu(); return null; })

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
                this.osveziKorpu();
            })

        } else {
            /*
             * Gost (2026-09-22): fotografija ide u korpu u pregledaču, bez
             * prijave — prijava se traži tek kad krene da plaća (`cartPage.js`).
             * Isti oblik koji `/cart` već prima od gosta; posle prijave
             * `loginPage.js` prenosi ove stavke u korpu naloga.
             */
            let korpa = [];
            try { korpa = JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { korpa = []; }
            const vec = korpa.some((s) => String(s.galleryId) === String(gallery._id)
                && Number(s.photoId) === Number(photoId) && Number(s.resolution) === Number(resolution));
            if (!vec) {
                korpa.push({ galleryId: gallery._id, photoId: photoId, resolution: resolution });
                localStorage.setItem('cart', JSON.stringify(korpa));
            }
            this.showInfoMessage('Fotografija je uspješno dodata u korpu');
            this.osveziKorpu();
        }
        /* else {
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
                    /*
                     * Podaci sa servera važe samo za stranu za koju su
                     * dovučeni. Posle prvog prelaska na drugu stranu ta strana
                     * dovlači svoje kroz `loadData`, a ovi bi joj samo useli
                     * tuđe vrednosti u početno stanje.
                     */
                    initialData={
                        !this.props.pocetnaPutanja
                        || this.props.pocetnaPutanja === this.props.location.pathname
                            ? this.props.initialData
                            : undefined
                    }
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
                    osveziKorpu={this.osveziKorpu}
                    setLang={this.setLang}
                    bannerClick={this.bannerClick}
                />


                {/* Plutajuća korpa — skrol prati sama komponenta, ne `App`. Nema
                    je u korpi, u administraciji i kod fotografa. */}
                {(() => {
                    const putanja = (this.props.location && this.props.location.pathname) || '';
                    const u = this.state.uData;
                    if (putanja === '/cart' || putanja.indexOf('/account') === 0
                        || (u && u.userRole === 'photographer')) return null;
                    return <PlutajucaKorpa broj={this.state.brojUKorpi} lang={this.state.lang}/>;
                })()}

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
                            {this.state.deletePoruka ? null : <Isvg src={trashIcon}/>}
                            <h6>{this.state.deletePoruka || 'Potvrdite brisanje'}</h6>
                            <div className="buttons">
                                <button onClick={() => this.setState({deletePrompt: null, deletePoruka: null})}>NE</button>
                                <button onClick={() => {
                                    this.state.deletePrompt();
                                    this.setState({
                                        deletePrompt: null,
                                        deletePoruka: null
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
