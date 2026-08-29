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
} from 'reactstrap';

import rightArrow from '../../assets/svg/right-arrow.svg';
import user from '../../assets/svg/user.svg';
import penIcon from '../../assets/svg/orders-pen.svg';
import trashIcon from '../../assets/svg/orders-trash.svg';
import { API_ENDPOINT } from '../../constants';


class PagesPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialData,
            ucitavanje: true,
            zaBrisanje: null,
            poruke: [],
            items: []
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

        fetch(`${API_ENDPOINT}/pages/all`, {
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
        fetch(`${API_ENDPOINT}/pages/all`, {
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
        const b = this.state.zaBrisanje;

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Stranice'.translate(l)}
                radnja={<Link to="/account/pages/new" className="z-adminokvir__radnja">{'Dodaj stranicu'.translate(l)}</Link>}
            >
                <Tabela
                    lang={l}
                    ucitavanje={this.state.ucitavanje}
                    kolone={[
                        { kljuc: 'naziv', naziv: 'Naziv' },
                        { kljuc: 'adresa', naziv: 'Adresa' },
                    ]}
                    redovi={this.state.items || []}
                    kljucReda={(r) => r._id}
                    ukupnoStavki={(this.state.items || []).length}
                    prazno={{
                        znak: '▤',
                        naslov: 'Nema sadržajnih stranica',
                        tekst: 'Ovdje se uređuju „O nama", „Uslovi korišćenja", „Impresum" i slične strane.',
                        radnja: <Link to="/account/pages/new" className="z-dugme z-dugme--glavno">{'Dodaj stranicu'.translate(l)}</Link>,
                    }}
                    celija={(r, k) => {
                        if (k.kljuc === 'naziv') return Object.translate(r, 'name', l) || '—';
                        const alias = r.alias && (r.alias.ba || r.alias.en) ? (r.alias.ba || r.alias.en) : null;
                        return alias
                            ? <a href={`/page/${alias}`} target="_blank" rel="noopener noreferrer">/page/{alias}</a>
                            : <span className="z-tabela__tiho">{'nema adrese'.translate(l)}</span>;
                    }}
                    radnje={(r) => (
                        <>
                            <Link to={`/account/pages/${r._id}`} className="z-tabela__radnja" title={'Izmijeni'.translate(l)}>
                                <svg viewBox="0 0 24 24"><path d="M3 17.2V21h3.8L17.8 10 14 6.2 3 17.2zM20.7 7.1a1 1 0 000-1.4l-2.4-2.4a1 1 0 00-1.4 0l-1.8 1.8L18.9 9l1.8-1.9z" fill="currentColor"/></svg>
                            </Link>
                        </>
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

export default Page(PagesPage);