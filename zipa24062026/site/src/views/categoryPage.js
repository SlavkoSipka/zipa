import React, {Component} from 'react';
import {Link} from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import Page from '../containers/page';


import {
    Container,
    Row,
    Col,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    UncontrolledDropdown
} from 'reactstrap';


import Article from '../components/articles/article';
import BlogArticle from '../components/articles/blogArticle';

import keywordX from '../assets/svg/keyword-x.svg';
import downArrow from '../assets/svg/down-arrow.svg';

import grid from '../assets/svg/grid.svg';
import list from '../assets/svg/list.svg';
import filterIcon from '../assets/svg/filters.svg';

import SelectList from '../components/forms/fields/selectList';
import MultiselectList from '../components/forms/fields/multiselectList';

import regions from '../regions';

import image1 from '../assets/images/image1.png';
import image2 from '../assets/images/image2.png';

import banner1 from '../assets/images/banner1.png';
import banner2 from '../assets/images/banner2.png';
import banner3 from '../assets/images/banner3.png';

import searchIcon from '../assets/svg/search-icon-btn.svg';
import picture from '../assets/svg/picture-icon.svg';
import DatePicker from '../components/forms/fields/date';
import Check from '../components/forms/fields/check';
import Select from '../components/forms/fields/select';
import ReactPaginate from 'react-paginate';
import Autotext from '../components/forms/fields/autoText1';
import {API_ENDPOINT, PHOTOS_ENDPOINT} from '../constants';

class CategoryPage extends Component {
    constructor(props) {
        super(props);
        this.getSearchParams = this.getSearchParams.bind(this);
        this.generateSearchLink = this.generateSearchLink.bind(this);
        this.alatnaTrakaRef = React.createRef();

        this.state = {
            ...props.initialData,
            categories: [],
            cities: [],
            displayStyle: 'grid',
            showForms: false,
            // Koji filter u alatnoj traci ima otvoren padajući panel.
            otvoreniFilter: null
        };
    }

    // Datum snimanja uz fotografiju u rezultatima pretrage.
    formatDate(sekunde) {
        if (!sekunde) return '';
        const d = new Date(sekunde * 1000);
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`;
    }

    componentDidMount() {
        this.setState({showForms: false})
        window.scrollTo(0, 0);

        document.addEventListener('mousedown', this.naKlikVanFiltera);
        document.addEventListener('keydown', this.naTasterFiltera);

        let searchParams = this.getSearchParams();
        if (searchParams.search) {
            this.setState({
                search: searchParams.search
            })
        }

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, this.getSearchParams(), this.props.lang).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }
        setTimeout(() => {
            if (this.props[0].location.pathname == '/account/subscription')
                fetch(`${API_ENDPOINT}/gallery/check-resolutions/get/` + this.props.uData._id, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                }).then(res => res.json()).then((result) => {
                    this.setState({
                        userResolutins: result
                    })
                })
            this.setState({showForms: true})
        }, 1000);


        fetch(`${API_ENDPOINT}/cities`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                cities: result
            })
        })


    }

    componentDidUpdate(prevProps) {


        if (prevProps[0].location.pathname != this.props[0].location.pathname || prevProps[0].location.search != this.props[0].location.search) {

            for (let i = 0; i < this.props.loadData.length; i++) {
                this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, this.getSearchParams(), this.props.lang).then((data) => {
                    this.setState({
                        ...data,
                    }, () => {
                        this.props.updateMeta(this.props.generateSeoTags(this.state));
                    })
                })
            }
            this.setState({showForms: false})
            setTimeout(() => {
                this.setState({showForms: true})
            }, 100)
        }
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.naKlikVanFiltera);
        document.removeEventListener('keydown', this.naTasterFiltera);
    }

    naKlikVanFiltera = (e) => {
        if (this.state.otvoreniFilter && this.alatnaTrakaRef.current && !this.alatnaTrakaRef.current.contains(e.target)) {
            this.setState({otvoreniFilter: null});
        }
    };

    naTasterFiltera = (e) => {
        if ((e.key === 'Escape' || e.keyCode === 27) && this.state.otvoreniFilter) {
            this.setState({otvoreniFilter: null});
        }
    };

    prebaciFilter = (ime) => {
        this.setState((prev) => ({otvoreniFilter: prev.otvoreniFilter === ime ? null : ime}));
    };

    // Uklanja više parametara odjednom u JEDNOM upisu u istoriju — dva
    // uzastopna `history.push` bi drugi računao iz zastarelih propova i
    // poništio prvo brisanje (probano, `date-from` se vraćalo).
    ukloniParametre = (imena) => {
        let params = this.getSearchParams();
        imena.forEach((ime) => { delete params[ime]; });

        let paramsGroup = [];
        for (let key in params) {
            if (params.hasOwnProperty(key) && params[key]) {
                paramsGroup.push(`${key}=${params[key]}`);
            }
        }
        this.props[0].history.push(`${this.props[0].location.pathname}${paramsGroup.length ? '?' + paramsGroup.join('&') : ''}`);
    };

    kratakDatum(sekunde) {
        if (!sekunde) return null;
        const d = new Date(sekunde * 1000);
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
    }

    oznakaDatuma(params) {
        const od = this.kratakDatum(params['date-from']);
        const doDatuma = this.kratakDatum(params['date-to']);
        if (od && doDatuma) return `${od} – ${doDatuma}`;
        if (od) return `${'od'.translate(this.props.lang)} ${od}`;
        if (doDatuma) return `${'do'.translate(this.props.lang)} ${doDatuma}`;
        return 'Datum'.translate(this.props.lang);
    }

    oznakaOrijentacije(params) {
        const delovi = [];
        if (params['orientation-portrait']) delovi.push('Portret'.translate(this.props.lang));
        if (params['orientation-horizontal']) delovi.push('Horizontalna'.translate(this.props.lang));
        return delovi.length ? delovi.join(', ') : 'Orjentacija'.translate(this.props.lang);
    }

    nazivKategorije(alias, categories) {
        if (!alias) return null;
        const nadjena = (categories || []).find((k) => Object.translate(k, 'alias', this.props.lang) === alias);
        return nadjena ? Object.translate(nadjena, 'name', this.props.lang) : null;
    }

    // Primenjeni filteri kao spisak uklonjivih pilula — jedan izvor
    // istine, koristi ga i traka i dugme „Poništi sve".
    pilule(params, categories) {
        const l = this.props.lang;
        const spisak = [];

        if (params.search) {
            spisak.push({
                tekst: `${'Pretraga'.translate(l)}: ${params.search}`,
                ukloni: () => this.ukloniParametre(['search'])
            });
        }
        if (params['date-from'] || params['date-to']) {
            spisak.push({
                tekst: `${'Datum'.translate(l)}: ${this.oznakaDatuma(params)}`,
                ukloni: () => this.ukloniParametre(['date-from', 'date-to'])
            });
        }
        if (params.city) {
            spisak.push({tekst: params.city, ukloni: () => this.ukloniParametre(['city'])});
        }
        if (params.category) {
            spisak.push({
                tekst: this.nazivKategorije(params.category, categories) || params.category,
                ukloni: () => this.ukloniParametre(['category'])
            });
        }
        if (params['orientation-portrait']) {
            spisak.push({tekst: 'Portret'.translate(l), ukloni: () => this.ukloniParametre(['orientation-portrait'])});
        }
        if (params['orientation-horizontal']) {
            spisak.push({tekst: 'Horizontalna'.translate(l), ukloni: () => this.ukloniParametre(['orientation-horizontal'])});
        }
        if (params.keywords) {
            params.keywords.split(',').forEach((rec, idx) => {
                if (!rec) return;
                spisak.push({
                    tekst: rec,
                    ukloni: () => {
                        let keywords = params.keywords.split(',');
                        keywords.splice(idx, 1);
                        this.props[0].history.push(this.generateSearchLink('keywords', keywords.join(',')));
                    }
                });
            });
        }

        return spisak;
    }

    getSearchParams() {
        let brokenParams = this.props[0].location.search.replace('?', '').split('&');
        let params = {};
        for (let i = 0; i < brokenParams.length; i++) {
            params[brokenParams[i].split('=')[0]] = decodeURIComponent(brokenParams[i].split('=')[1]);
        }

        if (params.tags) {
            params.tags = params.tags.split(',');
        }

        if (params['compatible-with']) {
            params['compatible-with'] = params['compatible-with'].split(',');
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

        if (name == 'region') {
            delete params['city'];
        }

        let paramsGroup = [];
        for (var key in params) {
            if (params.hasOwnProperty(key) && params[key]) {
                if (key && params[key])
                    paramsGroup.push(`${key}=${params[key]}`)
            }
        }

        return `?${paramsGroup.join('&')}`;
    }

    render() {
        let params = this.getSearchParams();

        /*
         * Uz nove izglede spisak galerija je gušći — četiri u redu umesto tri —
         * i kartice nose isti izgled kao na novoj naslovnoj. Dok je izabran
         * „trenutni", spisak ostaje kakav je bio.
         */
        const noviPrikaz =
            this.props.settings && this.props.settings.homepageLayout &&
            this.props.settings.homepageLayout !== 'trenutni';

        let categories = [{
            name: {ba: 'Sve kategorije', en: 'Sve kategorije'.translate(this.props.lang)},
            alias: {ba: null, en: null}
        }, ...this.props.categories];

        let category;

        if (params.category) {
            for (let i = 0; i < this.props.categories.length; i++) {
                if (this.props.categories[i].alias.ba == params.category) {
                    category = this.props.categories[i];
                    break;
                }
            }
        }

        /*
         * Jedan naslov umesto tri. Poredak pokriva sve stare izvore naslova
         * odjednom: stranu pretplate (posebna ruta kroz istu komponentu),
         * kategoriju sa sopstvene rute (breadcrumb), kategoriju izabranu kroz
         * filter, pa pretragu, pa podrazumevano.
         *
         * Broj pronađenih namerno NE stoji ovde: API vraća samo broj STRANA
         * (`Math.ceil(totalCount / ipp)`, u `products/products.js`), ne broj
         * stavki — a menjanje API odgovora je van ove izmene (raspored i
         * veličine, ne funkcija).
         */
        let naslovStrane;
        if (this.props[0].location.pathname.indexOf('/account/subscription') == 0) {
            naslovStrane = 'Pretplata'.translate(this.props.lang);
        } else if (this.state.category && this.state.category.breadcrumb) {
            naslovStrane = this.state.category.name;
        } else if (category) {
            naslovStrane = Object.translate(category, 'name', this.props.lang);
        } else if (params.search) {
            naslovStrane = `${'Rezultati za'.translate(this.props.lang)}: ${params.search}`;
        } else {
            naslovStrane = 'Galerije'.translate(this.props.lang);
        }

        const primenjeneFiltere = this.pilule(params, categories);

        return (
            <div className="category-wrap">
                {
                    this.state.userResolutins && this.state.userResolutins._id || this.props[0].location.pathname != '/account/subscription' ?
                        <>
                            <div className="z-stranica-galerija__vrh">
                                <Container>
                                    <div className="z-stranica-galerija__naslov-red">
                                        <h1 className="z-stranica-galerija__naslov">{naslovStrane}</h1>
                                    </div>
                                </Container>

                                {/* Jedna alatna traka umesto tri naslova i bloka filtera
                                    razvučenog preko dva reda. Traka se lepi ispod zaglavlja
                                    pri skrolovanju (`position: sticky` u _category.scss) —
                                    zaglavlje samo nije više fiksirano, pa traka zauzima
                                    njegovo mesto na vrhu čim ono ode iz kadra. */}
                                <div className="z-alatna-traka" ref={this.alatnaTrakaRef}>
                                    <Container className="z-alatna-traka__sirina">
                                        <div className="z-alatna-traka__pretraga">
                                            <Isvg src={picture}/>
                                            <input type="text"
                                                   placeholder={'Unesite pojam za pretragu'.translate(this.props.lang)}
                                                   value={this.state.search}
                                                   onChange={(e) => this.setState({search: e.target.value})}
                                                   onKeyUp={(e) => {
                                                       if (e.keyCode == 13) {
                                                           e.preventDefault();
                                                           this.props[0].history.push(this.props[0].location.pathname + this.generateSearchLink('search', encodeURIComponent(this.state.search)));
                                                       }
                                                   }}/>
                                            <button type="button" className="z-alatna-traka__pretrazi"
                                                    aria-label={'Pretraži'.translate(this.props.lang)}
                                                    onClick={() => {
                                                        this.props[0].history.push(this.props[0].location.pathname + this.generateSearchLink('search', encodeURIComponent(this.state.search)));
                                                    }}>
                                                <Isvg src={searchIcon}/>
                                            </button>
                                        </div>

                                        {/* Polja polazne pretrage (datum/grad/kategorija/orijentacija)
                                            čekaju `showForms` — isto kao ranije: sprečava da polja
                                            ostanu na starim vrednostima posle promene rute (zato se
                                            gase na 100ms pa vraćaju u `componentDidUpdate`). */}
                                        {this.state.showForms ?
                                            <>
                                                <div className="z-alatna-traka__filteri">
                                                <div className="z-alatna-traka__filter-spisak">
                                                    <div className="z-alatna-traka__filter-grupa">
                                                        <button type="button"
                                                                className={'z-alatna-traka__filter' + (params['date-from'] || params['date-to'] ? ' z-alatna-traka__filter--aktivan' : '')}
                                                                aria-expanded={this.state.otvoreniFilter === 'datum'}
                                                                onClick={() => this.prebaciFilter('datum')}>
                                                            {this.oznakaDatuma(params)}
                                                        </button>
                                                        {this.state.otvoreniFilter === 'datum' ?
                                                            <div className="z-alatna-traka__panel">
                                                                <DatePicker value={params['date-from']}
                                                                            onChange={(val) => {
                                                                                this.props[0].history.push(this.generateSearchLink('date-from', val))
                                                                            }}
                                                                            placeholder={'OD'.translate(this.props.lang)}
                                                                            label={'OD'.translate(this.props.lang)}/>
                                                                <DatePicker value={params['date-to']}
                                                                            onChange={(val) => {
                                                                                let date = new Date(val * 1000);
                                                                                date.setHours(23, 59, 59, 0);
                                                                                this.props[0].history.push(this.generateSearchLink('date-to', date.getTime() / 1000))
                                                                            }}
                                                                            placeholder={'DO'.translate(this.props.lang)}
                                                                            label={'DO'.translate(this.props.lang)}/>
                                                            </div>
                                                            : null}
                                                    </div>

                                                    <div className="z-alatna-traka__filter-grupa">
                                                        <button type="button"
                                                                className={'z-alatna-traka__filter' + (params.city ? ' z-alatna-traka__filter--aktivan' : '')}
                                                                aria-expanded={this.state.otvoreniFilter === 'grad'}
                                                                onClick={() => this.prebaciFilter('grad')}>
                                                            {params.city || 'Grad'.translate(this.props.lang)}
                                                        </button>
                                                        {this.state.otvoreniFilter === 'grad' ?
                                                            <div className="z-alatna-traka__panel">
                                                                <Autotext
                                                                    label={'Grad'.translate(this.props.lang)}
                                                                    value={params['city'] ? params['city'] : ''}
                                                                    suggestions={this.state.cities}
                                                                    onChange={(val) => {
                                                                        this.props[0].history.push(this.generateSearchLink('city', val))
                                                                    }}/>
                                                            </div>
                                                            : null}
                                                    </div>

                                                    {this.props.categories && this.props.categories.length ?
                                                        <div className="z-alatna-traka__filter-grupa">
                                                            <button type="button"
                                                                    className={'z-alatna-traka__filter' + (params.category ? ' z-alatna-traka__filter--aktivan' : '')}
                                                                    aria-expanded={this.state.otvoreniFilter === 'kategorija'}
                                                                    onClick={() => this.prebaciFilter('kategorija')}>
                                                                {this.nazivKategorije(params.category, categories) || 'Kategorija'.translate(this.props.lang)}
                                                            </button>
                                                            {this.state.otvoreniFilter === 'kategorija' ?
                                                                <div className="z-alatna-traka__panel">
                                                                    <Select
                                                                        label={'Kategorija'.translate(this.props.lang)}
                                                                        value={params.category}
                                                                        onChange={(val) => {
                                                                            this.props[0].history.push(this.generateSearchLink('category', val));
                                                                            this.setState({otvoreniFilter: null});
                                                                        }}>
                                                                        {
                                                                            categories.map((item, idx) => {
                                                                                return (
                                                                                    <option key={idx}
                                                                                            value={Object.translate(item, 'alias', this.props.lang)}>{Object.translate(item, 'name', this.props.lang)}</option>
                                                                                )
                                                                            })
                                                                        }
                                                                    </Select>
                                                                </div>
                                                                : null}
                                                        </div>
                                                        : null}

                                                    <div className="z-alatna-traka__filter-grupa">
                                                        <button type="button"
                                                                className={'z-alatna-traka__filter' + ((params['orientation-portrait'] || params['orientation-horizontal']) ? ' z-alatna-traka__filter--aktivan' : '')}
                                                                aria-expanded={this.state.otvoreniFilter === 'orijentacija'}
                                                                onClick={() => this.prebaciFilter('orijentacija')}>
                                                            {this.oznakaOrijentacije(params)}
                                                        </button>
                                                        {this.state.otvoreniFilter === 'orijentacija' ?
                                                            <div className="z-alatna-traka__panel z-alatna-traka__panel--usko">
                                                                <Check
                                                                    value={params['orientation-portrait']}
                                                                    onChange={(val) => {
                                                                        this.props[0].history.push(this.generateSearchLink('orientation-portrait', val))
                                                                    }}
                                                                    label={'Portret'.translate(this.props.lang)}></Check>
                                                                <Check
                                                                    value={params['orientation-horizontal']}
                                                                    onChange={(val) => {
                                                                        this.props[0].history.push(this.generateSearchLink('orientation-horizontal', val))
                                                                    }}
                                                                    label={'Horizontalna'.translate(this.props.lang)}></Check>
                                                            </div>
                                                            : null}
                                                    </div>
                                                </div>

                                                    <button type="button" className="z-alatna-traka__vise"
                                                            onClick={() => this.props.handleDetailSearch(true)}>
                                                        <Isvg src={filterIcon}/>
                                                        {'Više filtera'.translate(this.props.lang)}
                                                    </button>
                                                </div>

                                                <div className="z-alatna-traka__desno">
                                                    <div className="z-alatna-traka__prekidac">
                                                        <Link to={this.props[0].location.pathname + this.generateSearchLink('view', null)}
                                                              className={'z-alatna-traka__prekidac-dugme' + (params.view !== 'photos' ? ' z-alatna-traka__prekidac-dugme--aktivan' : '')}>
                                                            {'Galerije'.translate(this.props.lang)}
                                                        </Link>
                                                        <Link to={this.props[0].location.pathname + this.generateSearchLink('view', 'photos')}
                                                              className={'z-alatna-traka__prekidac-dugme' + (params.view === 'photos' ? ' z-alatna-traka__prekidac-dugme--aktivan' : '')}>
                                                            {'Fotografije'.translate(this.props.lang)}
                                                        </Link>
                                                    </div>

                                                    <div className="z-alatna-traka__prikazi">
                                                        <button type="button"
                                                                onClick={() => this.setState({displayStyle: 'grid'})}
                                                                aria-label={'Mreža'.translate(this.props.lang)}
                                                                className={this.state.displayStyle == 'grid' ? 'active' : ''}>
                                                            <Isvg src={grid}/>
                                                        </button>
                                                        <button type="button"
                                                                onClick={() => this.setState({displayStyle: 'list'})}
                                                                aria-label={'Spisak'.translate(this.props.lang)}
                                                                className={this.state.displayStyle == 'list' ? 'active' : ''}>
                                                            <Isvg src={list}/>
                                                        </button>
                                                        <button type="button"
                                                                onClick={() => this.setState({displayStyle: 'image'})}
                                                                aria-label={'Fotografije, jedna do druge'.translate(this.props.lang)}
                                                                className={this.state.displayStyle == 'image' ? 'active' : ''}>
                                                            <Isvg src={grid}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                            : null}
                                    </Container>
                                </div>

                                {/* Primenjeni filteri kao uklonjive pilule — samo kad ih ima. */}
                                {this.state.showForms && primenjeneFiltere.length ?
                                    <Container>
                                        <div className="z-primenjeni-filteri">
                                            {primenjeneFiltere.map((f, idx) => (
                                                <button key={idx} type="button" className="z-primenjeni-filteri__pilula"
                                                        onClick={f.ukloni}>
                                                    {f.tekst}
                                                    <Isvg src={keywordX}/>
                                                </button>
                                            ))}
                                            <button type="button" className="z-primenjeni-filteri__ponisti"
                                                    onClick={() => this.props[0].history.push(this.props[0].location.pathname)}>
                                                {'Poništi sve'.translate(this.props.lang)}
                                            </button>
                                        </div>
                                    </Container>
                                    : null}
                            </div>


                            <section className="category-section">
                                <Container>
                                    {
                                        this.state.showForms ?
                                            (
                                                <Row>
                                                    <Col lg="12" className="area">


                                                        {/*
                                                          * Rezultati kao pojedinačne fotografije. Klik vodi na
                                                          * galeriju kojoj fotografija pripada, na njeno mesto.
                                                          */}
                                                        {params.view === 'photos' ?
                                                            <Row className="articles photo-results">
                                                                {this.state.items && this.state.items.map((foto, idx) => {
                                                                    const podaci = foto.foto || {};
                                                                    return (
                                                                        <Col lg="3" md="4" xs="6" key={idx}>
                                                                            <Link
                                                                                className="photo-result"
                                                                                /* Ruta ima dva dela: /galerija/naziv/oznaka.
                                                                                   Sa tri dela veza vodi u prazno. */
                                                                                to={`/galerija/${foto.galleryAlias}/${foto.galleryId}?photo=${foto.idx}`}>
                                                                                <div className="photo-result-image">
                                                                                    <img
                                                                                        src={`${PHOTOS_ENDPOINT}/photos/350x/${foto.image}`}
                                                                                        alt={podaci.description || foto.name}/>
                                                                                </div>
                                                                                <div className="photo-result-info">
                                                                                    <h4>{podaci.description || foto.galleryName}</h4>
                                                                                    <p>
                                                                                        {foto.location ? <span>{foto.location}</span> : null}
                                                                                        {foto.date ?
                                                                                            <span>{this.formatDate(foto.date)}</span> : null}
                                                                                        {podaci.author ?
                                                                                            <span>{podaci.author}</span> : null}
                                                                                    </p>
                                                                                </div>
                                                                            </Link>
                                                                        </Col>
                                                                    )
                                                                })}
                                                            </Row>
                                                            :
                                                        <Row className={noviPrikaz ? 'articles novi-spisak' : 'articles'}>
                                                            {
                                                                this.state.items && this.state.items.map((article, idx) => {
                                                                    return (
                                                                        <Col
                                                                            lg={this.state.displayStyle == 'list' ? '12' : (noviPrikaz ? '3' : '4')}
                                                                            md={this.state.displayStyle == 'list' ? '12' : (noviPrikaz ? '4' : '6')}
                                                                            key={idx}>
                                                                            <Article
                                                                                _id={article._id}
                                                                                categoryName={Object.translate(article, 'categoryName', this.props.lang)}
                                                                                image={article.photos && article.photos[0] && article.photos[0].image}
                                                                                name={Object.translate(article, 'name', this.props.lang)}
                                                                                shortDescription={Object.translate(article, 'description', this.props.lang)}
                                                                                alias={Object.translate(article, 'alias', this.props.lang)}
                                                                                userAlias={article.userAlias}
                                                                                imagesCount={article.photosCount !== undefined ? article.photosCount : (article.photos && article.photos.length)}
                                                                                location={article.location}
                                                                                published={article.date}
                                                                                homeArticle
                                                                                listView={this.state.displayStyle == 'list'}
                                                                                imageArticle={this.state.displayStyle == 'image'}
                                                                            ></Article>
                                                                        </Col>
                                                                    )
                                                                })
                                                            }


                                                        </Row>
                                                        }

                                                        <Row>
                                                            <Col lg="12">
                                                                {/* Broj po strani je sišao ovde, uz podelu na strane —
                                                                    sitno, van alatne trake koja je sad jedan red. */}
                                                                <div className="z-podela-dno">
                                                                    <ReactPaginate
                                                                        previousLabel={''}
                                                                        nextLabel={''}
                                                                        breakLabel={'...'}
                                                                        breakClassName={'break-me'}
                                                                        pageCount={this.state.total}
                                                                        marginPagesDisplayed={1}
                                                                        pageRangeDisplayed={2}
                                                                        onPageChange={(page) => {
                                                                            this.props[0].history.push(this.generateSearchLink('page', page.selected));
                                                                            window.scrollTo(0, 0);
                                                                        }}
                                                                        containerClassName={'pagination'}
                                                                        subContainerClassName={'pages pagination'}
                                                                        activeClassName={'active'}
                                                                        hrefBuilder={(page) => {
                                                                            return this.generateSearchLink('page', page)
                                                                        }}
                                                                    />

                                                                    <ul className="z-broj-po-strani">
                                                                        <li>
                                                                            <span>{'Po strani:'.translate(this.props.lang)}</span>
                                                                        </li>
                                                                        {/* 36 je podrazumevani prikaz — koliko je snimaka imao film. */}
                                                                        <li className={!params.ipp ? 'z-broj-po-strani__aktivan' : ''}>
                                                                            <Link to={this.props[0].location.pathname + this.generateSearchLink('ipp', null)}>36</Link>
                                                                        </li>
                                                                        <li className={params.ipp === '96' ? 'z-broj-po-strani__aktivan' : ''}>
                                                                            <Link to={this.props[0].location.pathname + this.generateSearchLink('ipp', '96')}>96</Link>
                                                                        </li>
                                                                        <li className={params.ipp === '200' ? 'z-broj-po-strani__aktivan' : ''}>
                                                                            <Link to={this.props[0].location.pathname + this.generateSearchLink('ipp', '200')}>200</Link>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </Col>

                                                        </Row>


                                                    </Col>
                                                </Row>
                                            )
                                            :
                                            null
                                    }

                                </Container>

                            </section>

                            <section className="section-banners">
                                <Container>
                                    <Row>
                                        <Col lg="12" className="banners">
                                            {
                                                this.props.banners && this.props.banners[1] && this.props.banners[1].images.map((item, idx) => {
                                                    return (
                                                        <a href={item.link} target="_blank"
                                                           onClick={() => this.props.bannerClick(item.link)}>
                                                            <img src={item.image} className="banner"/>
                                                        </a>
                                                    )
                                                })
                                            }

                                        </Col>
                                    </Row>
                                </Container>
                            </section>
                        </>
                        :
                        <div style={{marginTop: '200px', marginBottom: '500px'}}>
                            <Container>
                                <Row>
                                    <Col lg="12">
                                        <h4>{"Trenutno nemate pretplatu".translate(this.props.lang)}...</h4>
                                    </Col>
                                </Row>
                            </Container>
                        </div>
                }

            </div>
        );
    }
}

export default Page(CategoryPage);