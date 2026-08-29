import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import Tabela from '../../components/admin/Tabela';
import { Obavestenja, napraviPoruke } from '../../components/admin/Stanja';
import { API_ENDPOINT } from '../../constants';

import {
    Container,
    Row,
    Col,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Carousel,
    CarouselItem,
    CarouselControl,
    CarouselIndicators,
    CarouselCaption,
    UncontrolledDropdown
} from 'reactstrap';


import BlogArticle from '../../components/articles/blogArticle';
import ToggleSwitch from '../../components/forms/fields/toggleCheckbox';


import save from '../../assets/svg/save.svg';
import user from '../../assets/svg/user.svg';
import penIcon from '../../assets/svg/orders-pen.svg';
import trashIcon from '../../assets/svg/orders-trash.svg';


class CategoriesPage extends Component {
    constructor(props) {
        super(props);
        this.submit = this.submit.bind(this);

        this.state = {
            ...props.initialData,
            ucitavanje: true,
            poruke: [],
            categories: []
        };

        this.poruke = napraviPoruke(this);
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

        fetch(`${API_ENDPOINT}/all-cateogires`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                items: result,
                ucitavanje: false
            })
        }).catch(() => this.setState({ ucitavanje: false }))

    }

    submit(data) {
        console.log(data);

    }


    /*
     * Prekidači i pozicija u redu — LOGIKA JE NEPROMENJENA. I dalje se šalje
     * ceo zapis na `/categories/update/:id`, kao i ranije; jedino se sada
     * javlja ishod obaveštenjem umesto da radnja prođe nemo.
     */
    sacuvaj(item, poruka) {
        const l = this.props.lang;
        fetch(`${API_ENDPOINT}/categories/update/` + item._id, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(item)
        }).then((res) => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        }).then(() => {
            if (poruka) this.poruke.dodaj('uspeh', poruka.translate(l));
            this.osvezi();
        }).catch(() => {
            this.poruke.dodaj('greska', 'Izmjena nije sačuvana. Pokušajte ponovo.'.translate(l));
        });
    }

    osvezi() {
        fetch(`${API_ENDPOINT}/all-cateogires`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then((res) => res.json()).then((result) => {
            this.setState({ items: result });
        });
    }

    render() {
        const l = this.props.lang;

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Kategorije'.translate(l)}
                radnja={<Link to="/account/categories/new" className="z-adminokvir__radnja">{'Dodaj kategoriju'.translate(l)}</Link>}
            >
                <Tabela
                    lang={l}
                    ucitavanje={this.state.ucitavanje}
                    kolone={[
                        { kljuc: 'naziv',     naziv: 'Naziv' },
                        { kljuc: 'broj',      naziv: 'Fotografija', broj: true },
                        { kljuc: 'vidljiva',  naziv: 'Vidljiva' },
                        { kljuc: 'pocetna',   naziv: 'Na početnoj' },
                        { kljuc: 'pozicija',  naziv: 'Pozicija', broj: true },
                    ]}
                    redovi={this.state.items || []}
                    kljucReda={(r) => r._id}
                    ukupnoStavki={(this.state.items || []).length}
                    prazno={{
                        znak: '▦',
                        naslov: 'Nema nijedne kategorije',
                        tekst: 'Kategorije razvrstavaju galerije u arhivi i u meniju sajta.',
                        radnja: <Link to="/account/categories/new" className="z-dugme z-dugme--glavno">{'Dodaj kategoriju'.translate(l)}</Link>,
                    }}
                    celija={(r, k, idx) => {
                        if (k.kljuc === 'naziv') return Object.translate(r, 'name', l) || '—';
                        if (k.kljuc === 'broj')  return (r.photosCount || 0).toLocaleString('sr-RS');

                        if (k.kljuc === 'vidljiva' || k.kljuc === 'pocetna') {
                            const polje = k.kljuc === 'vidljiva' ? 'isVisible' : 'isVisibleOnHome';
                            return (
                                <ToggleSwitch
                                    value={r[polje]}
                                    onChange={() => {
                                        let items = this.state.items;
                                        items[idx][polje] = !items[idx][polje];
                                        this.setState({ items }, () => this.sacuvaj(items[idx], 'Izmjena je sačuvana.'));
                                    }}
                                />
                            );
                        }

                        return (
                            <div className="sort-field">
                                <input
                                    type="number"
                                    value={r.position != null ? r.position : ''}
                                    aria-label={'Pozicija'.translate(l)}
                                    onChange={(e) => {
                                        let items = this.state.items;
                                        items[idx].position = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                        this.setState({ items });
                                    }}
                                />
                                <button type="button"
                                        title={'Sačuvaj poziciju'.translate(l)}
                                        onClick={() => this.sacuvaj(r, 'Pozicija je sačuvana.')}>
                                    <Isvg src={save} />
                                </button>
                            </div>
                        );
                    }}
                    radnje={(r) => (
                        <Link to={`/account/categories/${r._id}`} className="z-tabela__radnja" title={'Izmijeni'.translate(l)}>
                            <svg viewBox="0 0 24 24"><path d="M3 17.2V21h3.8L17.8 10 14 6.2 3 17.2zM20.7 7.1a1 1 0 000-1.4l-2.4-2.4a1 1 0 00-1.4 0l-1.8 1.8L18.9 9l1.8-1.9z" fill="currentColor"/></svg>
                        </Link>
                    )}
                />

                <Obavestenja
                    lang={l}
                    poruke={this.state.poruke}
                    naZatvaranje={(id) => this.poruke.skloni(id)}
                />
            </AdminOkvir>
        );
    }
}

export default Page(CategoriesPage);