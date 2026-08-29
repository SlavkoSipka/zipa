import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import Tabela from '../../components/admin/Tabela';
import { Potvrda, Obavestenja, napraviPoruke } from '../../components/admin/Stanja';


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


import rightArrow from '../../assets/svg/right-arrow.svg';
import user from '../../assets/svg/user.svg';
import penIcon from '../../assets/svg/orders-pen.svg';
import trashIcon from '../../assets/svg/orders-trash.svg';
import { API_ENDPOINT } from '../../constants';


class CategoriesPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialData,
            ucitavanje: true,
            zaBrisanje: null,
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

        fetch(`${API_ENDPOINT}/slides/all`, {
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



    osvezi() {
        fetch(`${API_ENDPOINT}/slides/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then((res) => res.json()).then((result) => {
            this.setState({ items: result });
        });
    }

    obrisi(zapis) {
        const l = this.props.lang;
        this.setState({ zaBrisanje: null });

        fetch(`${API_ENDPOINT}/slides/delete/` + zapis._id, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then((res) => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        }).then(() => {
            this.poruke.dodaj('uspeh', 'Slajd je obrisan.'.translate(l));
            this.osvezi();
        }).catch(() => {
            this.poruke.dodaj('greska', 'Brisanje nije uspjelo. Pokušajte ponovo.'.translate(l));
        });
    }

    render() {
        const l = this.props.lang;
        const b = this.state.zaBrisanje;

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Slajder'.translate(l)}
                radnja={<Link to="/account/slides/new" className="z-adminokvir__radnja">{'Dodaj slajd'.translate(l)}</Link>}
            >
                <Tabela
                    lang={l}
                    ucitavanje={this.state.ucitavanje}
                    kolone={[
                        { kljuc: 'naslov',   naziv: 'Naslov' },
                        { kljuc: 'slika',    naziv: 'Slika' },
                        { kljuc: 'pozicija', naziv: 'Pozicija', broj: true },
                    ]}
                    redovi={this.state.items || []}
                    kljucReda={(r) => r._id}
                    ukupnoStavki={(this.state.items || []).length}
                    prazno={{
                        znak: '▭',
                        naslov: 'Nema nijednog slajda',
                        tekst: 'Slajder se prikazuje samo pod izgledom naslovne „Trenutni".',
                        radnja: <Link to="/account/slides/new" className="z-dugme z-dugme--glavno">{'Dodaj slajd'.translate(l)}</Link>,
                    }}
                    celija={(r, k) => {
                        if (k.kljuc === 'naslov') return Object.translate(r, 'title', l) || '—';
                        if (k.kljuc === 'pozicija') {
                            return r.position != null ? r.position
                                : <span className="z-tabela__tiho">{'nije zadata'.translate(l)}</span>;
                        }
                        /* Slajd bez slike se čuva bez upozorenja, a u vrtešci
                           pravi slomljenu sličicu — zato se to vidi u spisku. */
                        return r.image
                            ? <img src={r.image} alt="" style={{ height: 32, borderRadius: 4 }} />
                            : <span className="z-tabela__tiho">{'nema slike'.translate(l)}</span>;
                    }}
                    radnje={(r) => (
                        <>
                            <Link to={`/account/slides/${r._id}`} className="z-tabela__radnja" title={'Izmijeni'.translate(l)}>
                                <svg viewBox="0 0 24 24"><path d="M3 17.2V21h3.8L17.8 10 14 6.2 3 17.2zM20.7 7.1a1 1 0 000-1.4l-2.4-2.4a1 1 0 00-1.4 0l-1.8 1.8L18.9 9l1.8-1.9z" fill="currentColor"/></svg>
                            </Link>
                            <button type="button" className="z-tabela__radnja z-tabela__radnja--opasno"
                                    title={'Obriši'.translate(l)}
                                    onClick={() => this.setState({ zaBrisanje: r })}>
                                <svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7zm3-4h6l1 2h4v2H4V5h4l1-2z" fill="currentColor"/></svg>
                            </button>
                        </>
                    )}
                />

                <Potvrda
                    lang={l}
                    otvoren={!!b}
                    opasno
                    naslov={'Brisanje slajda'}
                    natpisPotvrde={'Obriši'}
                    tekst={b ? (<>{'Slajd'.translate(l)} <strong>{Object.translate(b, 'title', l)}</strong> {'se briše trajno.'.translate(l)}</>) : null}
                    naPotvrdu={() => this.obrisi(b)}
                    naOdustani={() => this.setState({ zaBrisanje: null })}
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