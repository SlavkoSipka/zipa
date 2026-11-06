import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import NalogOkvir from '../../components/nalogOkvir';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';


import Form from '../../components/forms/galleryForm';
import BlogArticle from '../../components/articles/blogArticle';


import rightArrow from '../../assets/svg/right-arrow.svg';
import user from '../../assets/svg/user.svg';
import sponsor from '../../assets/images/sponsor.png';
import { API_ENDPOINT } from '../../constants';


class ChangeGallery extends Component {
    constructor(props) {
        super(props);
        this.submit = this.submit.bind(this);

        let initialValues = null;
        if (props[0].match.params.id == 'new') {
            initialValues = {
                description: { ba: `\n\n(ZIPAPHOTO/${this.props.uData.name})`, en: `\n\n(ZIPAPHOTO ${this.props.uData.name})` },
                isActive: true,
                // Cijena se uzima iz Podešavanja sajta, da se ne mijenja ručno
                // pri svakoj galeriji.
                price: props.settings && props.settings.defaultPhotoPrice ? props.settings.defaultPhotoPrice : 20,
                date: Math.floor(new Date().getTime() / 1000)
            }

        }


        this.state = {
            ...props.initialData,
            initialValues
        };
    }

    componentDidMount() {

        window.scrollTo(0, 0);


        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }


        /* Nova galerija nema šta da se dovuče — API za `new` vraća 404 bez
           tela, pa je `res.json()` pucao bez obrade (2026-10-13; na lokalnom
           sajtu je ta greška ostavljala nevidljiv prozor razvojnog servera
           preko cele strane i nijedno dugme nije radilo). */
        if (this.props[0].match.params.id === 'new') return;

        fetch(this.props[0].match.params.uid ? `${API_ENDPOINT}/gallery/photographer/fetch/${this.props[0].match.params.uid}/${this.props[0].match.params.id}` : `${API_ENDPOINT}/gallery/fetch/${this.props[0].match.params.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.ok ? res.json() : null).then((result) => {
            if (!result) return;
            this.setState({
                initialValues: result
            })
        }).catch(() => {})


    }

    submit(data) {
        /* Engleski naziv i opis više se NE kopiraju sa srpskog (2026-11-06):
           server ih prevodi sam (`api/prevod.js`). Kopija je činila da se
           naslov nikad ne prevede, jer je engleski izgledao popunjeno. */
        let dataForm = data
        this.setState({
            _loading: true
        })
        fetch(this.props[0].match.params.uid ? `${API_ENDPOINT}/gallery/photographer/update/${this.props[0].match.params.uid}/${this.props[0].match.params.id}` : `${API_ENDPOINT}/gallery/update/${this.props[0].match.params.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(dataForm)
        }).then(res => res.json()).then((result) => {
            this.setState({
                _loading: null
            })

            /*
             * Odgovor se PROVERAVA pre nego što se javi uspeh.
             *
             * API sada vraća 404 i poruku kad izmjena ne pogodi nijednu
             * galeriju. Ranije se svaki odgovor smatrao uspjehom, pa je
             * strana odvodila korisnika dalje i izmjena bi se tiho izgubila —
             * upravo to se dešavalo kad administrator uređuje tuđu galeriju.
             */
            if (!result || result.error || !result.link) {
                this.setState({
                    error: (result && result.error)
                        ? result.error
                        : 'Izmjena nije sačuvana. Pokušajte ponovo.'.translate(this.props.lang)
                });
                return;
            }

            if (this.props.uData && this.props.uData.userRole == 'admin') {
                this.props[0].history.push('/');
            } else {
                //this.props[0].history.push('/account/galleries');
                this.props[0].history.push(result.link);
            }
        })

    }

    componentDidUpdate(prevProps) {
        // Podešavanja se učitavaju asinhrono; ako stignu nakon što je forma
        // već prikazana, upisujemo cijenu iz podešavanja na novu galeriju.
        if (this.props[0].match.params.id !== 'new') return;
        const price = this.props.settings && this.props.settings.defaultPhotoPrice;
        const prevPrice = prevProps.settings && prevProps.settings.defaultPhotoPrice;
        if (price && price !== prevPrice && this.state.initialValues) {
            this.setState({ initialValues: { ...this.state.initialValues, price: price } });
        }
    }

    render() {
        /*
         * Isti ekran koriste administrator i fotograf. Administrator ga vidi
         * u administratorskom okviru, fotograf u okviru svog naloga — uloga
         * se samo čita, prava i pozivi ka API-ju su nepromenjeni.
         */
        const Okvir = this.props.uData && this.props.uData.userRole === 'admin'
            ? AdminOkvir : NalogOkvir;

        return (
            <Okvir
                lang={this.props.lang}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Galerija'.translate(this.props.lang)}
                radnja={<Link to="/account/galleries" className="z-adminokvir__radnja z-adminokvir__radnja--tiha">{'Nazad na spisak'.translate(this.props.lang)}</Link>}
            >
                <div className="account-wrap">


                <section className="edit-account-section">
                    <Container>
                        <Row>
                            <Col lg="12" className="page-top-wrapper">
                                <h2>{'Dodavanje novih fotografija'.translate(this.props.lang)}</h2>
                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                    <li><Link>{'Dodavanje novih fotografija'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>

                            <Col lg="12">
                                <Form loading={this.state._loading} initialValues={this.state.initialValues} onSubmit={this.submit} categories={this.props.categories} lang={this.props.lang} jeAdmin={this.props.uData && this.props.uData.userRole === 'admin'} uploadHandler={(formData, callback) => {

                                    /*
                                     * Slanje UVEK završi (2026-11-06): uspeh → `callback(img)`,
                                     * greška → `callback(null, poruka, ponoviti)`. Ranije je greška
                                     * servera stizala kao tekst, `res.json()` je pucao i `callback`
                                     * se nikad nije pozvao — „Slanje u toku…" je ostajalo zauvek
                                     * (kod klijenta: 19 od 22, 86%). Posle 4 minuta bez odgovora
                                     * slanje se prekida i javlja kao greška.
                                     */
                                    const prekid = typeof AbortController !== 'undefined' ? new AbortController() : null;
                                    const sat = setTimeout(() => prekid && prekid.abort(), 4 * 60 * 1000);
                                    fetch(this.props[0].match.params.uid ? `${API_ENDPOINT}/gallery/photographer/photos/upload/${this.props[0].match.params.uid}` : `${API_ENDPOINT}/gallery/photos/upload`, {
                                        method: 'POST',
                                        headers: {
                                            Accept: 'application/json',
                                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                        },
                                        body: formData,
                                        signal: prekid ? prekid.signal : undefined,
                                    }).then((res) => res.text().then((tekst) => {
                                        clearTimeout(sat);
                                        let img = null;
                                        try { img = JSON.parse(tekst); } catch (e) { img = null; }
                                        if (res.ok && img && img.image) { callback(img); return; }
                                        // 4xx je odluka servera (nije JPG, prevelika) — ne ponavlja se samo.
                                        callback(null, (img && img.error) || tekst || ('Greška ' + res.status), res.status >= 500);
                                    })).catch((e) => {
                                        clearTimeout(sat);
                                        callback(null, e && e.name === 'AbortError'
                                            ? 'Server nije odgovorio 4 minuta.'
                                            : 'Veza sa serverom je prekinuta.', true);
                                    });

                                }} />
                                {this.state.error ? <p className="error">{this.state.error}</p> : null}
                            </Col>
                        </Row>

                    </Container>

                </section>



                </div>
            </Okvir>
        );
    }
}

export default Page(ChangeGallery);