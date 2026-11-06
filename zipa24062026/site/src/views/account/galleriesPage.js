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

import BlogArticle from '../../components/articles/blogArticle';
import imagesCount from '../../assets/svg/images-count.svg';
import user from '../../assets/svg/user.svg';
import penIcon from '../../assets/svg/orders-pen.svg';
import trashIcon from '../../assets/svg/orders-trash.svg';

import ReactPaginate from 'react-paginate';
import moment from 'moment';
import ToggleSwitch from '../../components/forms/fields/toggleCheckbox';
import { API_ENDPOINT, PHOTOS_ENDPOINT} from '../../constants';
class GalleriesPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);
        this.getSearchParams = this.getSearchParams.bind(this);
        this.generateSearchLink = this.generateSearchLink.bind(this);

        this.state = {
            ...props.initialData,
            products: []
        };
    }

    /*
     * PRIKAZ: MREŽA ILI TABELA (2026-11-06).
     *
     * Fotograf vidi svoje galerije kao mrežu velikih sličica, kao
     * `/galerije?view=photos`; administrator i dalje tabelu. Izbor se pamti
     * u pregledaču. Podaci, veze i brisanje su isti u oba prikaza.
     */
    prikaz() {
        if (this.state.prikaz) return this.state.prikaz;
        let zapamceno = null;
        try { zapamceno = localStorage.getItem('prikazGalerija'); } catch (e) { zapamceno = null; }
        if (zapamceno === 'mreza' || zapamceno === 'tabela') return zapamceno;
        return this.props.uData && this.props.uData.userRole === 'admin' ? 'tabela' : 'mreza';
    }

    promeniPrikaz(prikaz) {
        try { localStorage.setItem('prikazGalerija', prikaz); } catch (e) { /* bez pamćenja */ }
        this.setState({ prikaz });
    }

    vezaIzmene(item) {
        // Administrator ide na put koji zna za vlasnika galerije.
        return (this.props.uData && this.props.uData.userRole == 'admin' && item.uid && String(item.uid) !== String(this.props.uData._id))
            ? `/account/gallery-photographer/${item.uid}/${item._id}`
            : `/account/gallery/${item._id}`;
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

        // Administrator: isti brojevi kao na nadzornoj ploči (`/admin/brojevi-arhive`).
        if (this.props.uData && this.props.uData.userRole === 'admin') {
            fetch(`${API_ENDPOINT}/admin/brojevi-arhive`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
            }).then((res) => (res.ok ? res.json() : null))
                .then((brojeviArhive) => { if (brojeviArhive && brojeviArhive.galerija) this.setState({ brojeviArhive }); })
                .catch(() => {});
        }

    }

    componentDidUpdate(prevProps) {

        if (prevProps[0].location.pathname != this.props[0].location.pathname || prevProps[0].location.search != this.props[0].location.search) {
            this.init();
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
                naslov={'Galerije'.translate(this.props.lang)}
            >
                <div className="account-wrap">
                <section className="edit-account-section">
                    <Container>
                        <Row>
                            <Col lg="12" className="page-top-wrapper">
                                <h2>{'Galerije'.translate(this.props.lang)}</h2>
                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                    <li><Link>{'Galerije'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>

                            {/*
                              * PRETRAGA
                              *
                              * Administrator sada vidi celu arhivu — 9.965
                              * galerija, oko 500 strana. Bez pretrage se do
                              * jedne galerije dolazi samo listanjem.
                              *
                              * Pojam ide u adresu (`?search=`), pa strana
                              * ostaje deljiva i osvežavanje je pamti; strana
                              * na promenu adrese vec sama dovlaci ispocetka.
                              */}
                            {/* Isti brojevi kao na nadzornoj ploči (2026-10-27). */}
                            {this.state.brojeviArhive ? (
                                <Col lg="12">
                                    <p className="z-spisak-brojevi">
                                        {'U bazi'.translate(this.props.lang)} <b>{Number(this.state.brojeviArhive.galerija.ukupno).toLocaleString('sr-RS')}</b> {'galerija'.translate(this.props.lang)}:{' '}
                                        <b>{Number(this.state.brojeviArhive.galerija.naSajtu).toLocaleString('sr-RS')}</b> {'na sajtu'.translate(this.props.lang)},{' '}
                                        <b>{Number(this.state.brojeviArhive.galerija.skrivene).toLocaleString('sr-RS')}</b> {'skrivenih'.translate(this.props.lang)}
                                        {this.state.brojeviArhive.galerija.prazne
                                            ? <> ({'od toga'.translate(this.props.lang)} {this.state.brojeviArhive.galerija.prazne} {'praznih nacrta'.translate(this.props.lang)})</>
                                            : null}.
                                        {' '}{'Spisak pokazuje sve, najnovije prve; skrivene su označene.'.translate(this.props.lang)}
                                    </p>
                                    {/* Šta su skrivene i prazni nacrti (2026-11-06). */}
                                    <div className="z-spisak-objasnjenje">
                                        <p>
                                            <b>Skrivene</b> su galerije kojima je u izmjeni isključen „Status" — postoje, imaju fotografije, ali se ne vide na sajtu.
                                            Pregledajte ih i uključite Status onima koje treba da budu javne, a nepotrebne obrišite.
                                        </p>
                                        <p>
                                            <b>Prazni nacrti</b> su galerije koje su otvorene, ali nikad nisu dobile nijednu fotografiju niti su objavljene
                                            (npr. „temp value", „test arhiva"). Ne služe ničemu i mogu se obrisati.
                                        </p>
                                        <div className="z-spisak-objasnjenje__radnje">
                                            {this.getSearchParams().skrivene ? (
                                                <Link className="z-dugme z-dugme--sporedno z-dugme--malo" to={this.props[0].location.pathname}>{'Prikaži sve galerije'.translate(this.props.lang)}</Link>
                                            ) : (
                                                <Link className="z-dugme z-dugme--sporedno z-dugme--malo" to={this.props[0].location.pathname + '?skrivene=1'}>{'Prikaži samo skrivene'.translate(this.props.lang)}</Link>
                                            )}
                                            {this.state.brojeviArhive.galerija.prazne ? (
                                                <button type="button" className="z-dugme z-dugme--opasno z-dugme--malo"
                                                        disabled={this.state.brisePrazne}
                                                        onClick={() => {
                                                            const n = this.state.brojeviArhive.galerija.prazne;
                                                            if (!window.confirm(`Obrisati ${n} praznih nacrta? To su galerije bez ijedne fotografije; ne može se poništiti.`)) return;
                                                            this.setState({ brisePrazne: true });
                                                            fetch(`${API_ENDPOINT}/admin/galerije/obrisi-prazne`, {
                                                                method: 'POST',
                                                                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                                                            }).then((r) => r.json()).then((r) => {
                                                                const b = this.state.brojeviArhive;
                                                                const obr = (r && r.obrisano) || 0;
                                                                this.setState({
                                                                    brisePrazne: false,
                                                                    brojeviArhive: Object.assign({}, b, { galerija: Object.assign({}, b.galerija, {
                                                                        prazne: 0, ukupno: b.galerija.ukupno - obr, skrivene: b.galerija.skrivene - obr,
                                                                    }) }),
                                                                    porukaPrazne: `Obrisano praznih nacrta: ${obr}.`,
                                                                });
                                                                this.init();
                                                            }).catch(() => this.setState({ brisePrazne: false, porukaPrazne: 'Brisanje nije uspjelo.' }));
                                                        }}>
                                                    {this.state.brisePrazne ? 'Brišem…' : `Obriši prazne nacrte (${this.state.brojeviArhive.galerija.prazne})`}
                                                </button>
                                            ) : null}
                                            {this.state.porukaPrazne ? <span role="status">{this.state.porukaPrazne}</span> : null}
                                        </div>
                                    </div>
                                </Col>
                            ) : null}

                            <Col lg="12">
                                <form
                                    className="z-spisak-pretraga"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        // Pojam i datum odjednom, od prve strane (2026-11-06).
                                        const p = this.getSearchParams();
                                        const vrednost = (k, stanje) => (this.state[stanje] !== undefined ? this.state[stanje] : (p[k] ? decodeURIComponent(p[k]) : ''));
                                        const novi = { search: vrednost('search', 'pojam'), od: vrednost('od', 'odDana'), do: vrednost('do', 'doDana') };
                                        const upit = Object.keys(novi).filter((k) => novi[k]).map((k) => `${k}=${encodeURIComponent(novi[k])}`).join('&');
                                        this.props[0].history.push(this.props[0].location.pathname + (upit ? '?' + upit : ''));
                                    }}
                                >
                                    <input
                                        type="text"
                                        className="z-polje__unos"
                                        value={this.state.pojam !== undefined
                                            ? this.state.pojam
                                            : (this.getSearchParams().search
                                                ? decodeURIComponent(this.getSearchParams().search)
                                                : '')}
                                        placeholder={'Naziv galerije, mjesto ili fotograf…'.translate(this.props.lang)}
                                        aria-label={'Pretraga galerija'.translate(this.props.lang)}
                                        onChange={(e) => this.setState({ pojam: e.target.value })}
                                    />
                                    {/* Datum galerije od–do (2026-11-06). */}
                                    <label className="z-spisak-pretraga__datum">
                                        <span>{'Od'.translate(this.props.lang)}</span>
                                        <input type="date" className="z-polje__unos"
                                               value={this.state.odDana !== undefined ? this.state.odDana : (this.getSearchParams().od || '')}
                                               onChange={(e) => this.setState({ odDana: e.target.value })} />
                                    </label>
                                    <label className="z-spisak-pretraga__datum">
                                        <span>{'Do'.translate(this.props.lang)}</span>
                                        <input type="date" className="z-polje__unos"
                                               value={this.state.doDana !== undefined ? this.state.doDana : (this.getSearchParams().do || '')}
                                               onChange={(e) => this.setState({ doDana: e.target.value })} />
                                    </label>
                                    <button type="submit" className="z-dugme z-dugme--glavno">
                                        {'Traži'.translate(this.props.lang)}
                                    </button>
                                    {(this.getSearchParams().search || this.getSearchParams().od || this.getSearchParams().do) ? (
                                        <button type="button" className="z-dugme z-dugme--tiho"
                                                onClick={() => {
                                                    this.setState({ pojam: '', odDana: '', doDana: '' });
                                                    this.props[0].history.push(this.props[0].location.pathname);
                                                }}>
                                            {'Poništi'.translate(this.props.lang)}
                                        </button>
                                    ) : null}
                                </form>
                            </Col>

                            <Col lg="12">
                                <div className="z-moje-galerije__prikaz" role="group" aria-label={'Prikaz'.translate(this.props.lang)}>
                                    {[['mreza', 'Mreža'], ['tabela', 'Tabela']].map(([k, n]) => (
                                        <button key={k} type="button" aria-pressed={this.prikaz() === k}
                                                className={'z-alatna-traka__prekidac-dugme' + (this.prikaz() === k ? ' z-alatna-traka__prekidac-dugme--aktivan' : '')}
                                                onClick={() => this.promeniPrikaz(k)}>
                                            {n.translate(this.props.lang)}
                                        </button>
                                    ))}
                                </div>

                                {this.prikaz() === 'mreza' ? (
                                    <div className="z-moje-galerije">
                                        {(this.state.items || []).map((item) => {
                                            const slika = Object.get(item, 'photos[0].image');
                                            const broj = item.photos ? item.photos.length : 0;
                                            const skrivena = item.isActive === false || item.userDisabled;
                                            return (
                                                <div key={item._id} className="z-moje-galerije__kartica">
                                                    <Link to={this.vezaIzmene(item)} className="z-moje-galerije__slika">
                                                        {slika ? <img src={`${PHOTOS_ENDPOINT}/photos/350x/${encodeURI(slika)}`} alt="" loading="lazy" /> : null}
                                                        {broj ? <span className="z-moje-galerije__broj">{broj}</span> : null}
                                                        {skrivena ? <span className="z-oznaka z-oznaka--upozorenje z-moje-galerije__skrivena">{'skrivena'.translate(this.props.lang)}</span> : null}
                                                    </Link>
                                                    <h4 className="z-moje-galerije__naziv">{Object.translate(item, 'name', this.props.lang)}</h4>
                                                    <p className="z-moje-galerije__podaci">
                                                        {item.date ? <span>{new Date(Number(item.date) * 1000).toLocaleDateString('sr-RS')}</span> : null}
                                                        {item.location ? <span>{item.location}</span> : null}
                                                    </p>
                                                    <div className="z-moje-galerije__radnje">
                                                        <Link to={this.vezaIzmene(item)} className="z-dugme z-dugme--sporedno z-dugme--malo">{'Izmijeni'.translate(this.props.lang)}</Link>
                                                        {!skrivena && item.alias ? (
                                                            <a href={`/galerija/${Object.translate(item, 'alias', this.props.lang) || item.alias.ba}/${item._id}`}
                                                               target="_blank" rel="noopener noreferrer" className="z-dugme z-dugme--tiho z-dugme--malo">
                                                                {'Vidi na sajtu'.translate(this.props.lang)}
                                                            </a>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : null}

                                <div className="table" style={this.prikaz() === 'mreza' ? { display: 'contents' } : undefined}>
                                    <div style={this.prikaz() === 'mreza' ? { display: 'none' } : undefined}>
                                        <table>
                                            <tr>
                                                <th></th>
                                                <th>{'Naziv'.translate(this.props.lang)}</th>
                                                <th>{'Datum'.translate(this.props.lang)}</th>
                                                <th>{'Lokacija'.translate(this.props.lang)}</th>
                                                <th>{'Cijena'.translate(this.props.lang)}</th>
                                                <th>{'Akcije'.translate(this.props.lang)}</th>
                                            </tr>

                                            {
                                                this.state.items && this.state.items.length && this.state.items.map((item, idx) => {
                                                    return (
                                                        <tr>
                                                            <td><img src={`${PHOTOS_ENDPOINT}/photos/350x/` + Object.get(item, `photos[0].image`)} /></td>
                                                            <td>
                                                                {Object.translate(item, 'name', this.props.lang)}
                                                                {/* Skrivena = ne vidi se na sajtu (isti uslov kao na nadzornoj ploči). */}
                                                                {item.isActive === false || item.userDisabled
                                                                    ? <span className="z-oznaka z-oznaka--upozorenje" style={{ marginLeft: 8 }}>{'skrivena'.translate(this.props.lang)}</span>
                                                                    : null}
                                                            </td>
                                                            <td>{item.date ? new Date(Number(item.date) * 1000).toLocaleDateString('sr-RS') : '—'}</td>
                                                            <td>{item.location}</td>
                                                            <td>{item.price.formatPrice(2)} KM</td>

                                                            <td>
                                                                {/* Administrator ide na put koji zna za vlasnika
                                                                    galerije; `/account/gallery/:id` radi samo za
                                                                    fotografa nad SVOJOM galerijom. */}
                                                                <Link to={
                                                                    (this.props.uData && this.props.uData.userRole == 'admin' && item.uid && String(item.uid) !== String(this.props.uData._id))
                                                                        ? `/account/gallery-photographer/${item.uid}/${item._id}`
                                                                        : `/account/gallery/${item._id}`
                                                                }><button><Isvg src={penIcon} /></button></Link>
                                                                <button onClick={() => {
                                                                    this.props.handleDelete(() => {
                                                                        fetch(`${API_ENDPOINT}/gallery/delete/` + item._id, {
                                                                            method: 'DELETE',
                                                                            headers: {
                                                                                Accept: 'application/json',
                                                                                //'Content-Type': 'multipart/form-data',
                                                                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                                                                            },
                                                                        }).then((res) => res.text()).then((img) => {
                                                                            this.init()
                                                                        });

                                                                    })
                                                                }}><Isvg src={trashIcon} /></button>
                                                            </td>
                                                        </tr>

                                                    )
                                                })
                                            }
                                        </table>
                                    </div>

                                    <ReactPaginate
                                        previousLabel={''}
                                        nextLabel={''}
                                        breakLabel={'...'}
                                        breakClassName={'break-me'}
                                        pageCount={this.state.total}
                                        marginPagesDisplayed={1}
                                        pageRangeDisplayed={2}
                                        onPageChange={(page) => { this.props[0].history.push(this.generateSearchLink('page', page.selected)) }}
                                        containerClassName={'pagination'}
                                        subContainerClassName={'pages pagination'}
                                        activeClassName={'active'}
                                        hrefBuilder={(page) => { return this.generateSearchLink('page', page) }}
                                    />




                                </div></Col>
                        </Row>

                    </Container>

                </section>






                </div>
            </Okvir>
        );
    }
}

export default Page(GalleriesPage);