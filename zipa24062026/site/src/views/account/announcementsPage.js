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

        fetch(`${API_ENDPOINT}/announcements/all`, {
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
        fetch(`${API_ENDPOINT}/announcements/all`, {
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

        fetch(`${API_ENDPOINT}/announcements/delete/` + zapis._id, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then((res) => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        }).then(() => {
            this.poruke.dodaj('uspeh', 'Najava je obrisana.'.translate(l));
            this.osvezi();
        }).catch(() => {
            this.poruke.dodaj('greska', 'Brisanje nije uspjelo. Pokušajte ponovo.'.translate(l));
        });
    }

    /*
     * Šta SADA stoji iznad navbara (2026-10-27) — isti izbor kao u `App.js`:
     * za svako mesto poslednja objavljena najava čiji period traje. Ranije se
     * iz spiska nije videlo koja je od više važećih stvarno u traci.
     */
    uTraci() {
        const sada = Math.floor(Date.now() / 1000);
        const vazece = (this.state.items || [])
            .filter((n) => n.from && n.to && Number(n.from) <= sada && Number(n.to) >= sada)
            .sort((a, b) => (Number(b.published) || 0) - (Number(a.published) || 0));
        return {
            levo: vazece.find((n) => n.pozicija !== 'desno') || null,
            desno: vazece.find((n) => n.pozicija === 'desno') || null,
        };
    }

    render() {
        const l = this.props.lang;
        const b = this.state.zaBrisanje;
        const traka = this.uTraci();
        const mesto = (naziv, n) => (
            <div className="z-najave-traka__mesto">
                <span className="z-najave-traka__oznaka">{naziv.translate(l)}</span>
                {n ? (
                    <>
                        <strong className="z-najave-traka__natpis">{Object.translate(n, 'content', l) || '—'}</strong>
                        <span className="z-najave-traka__do">
                            {'do'.translate(l)} {new Date(Number(n.to) * 1000).toLocaleDateString('sr-RS')}
                        </span>
                        <Link to={`/account/announcements/${n._id}`} className="z-dugme z-dugme--glavno z-dugme--malo">
                            {'Izmijeni'.translate(l)}
                        </Link>
                    </>
                ) : (
                    <span className="z-najave-traka__prazno">{'Prazno — ovo mjesto se ne prikazuje'.translate(l)}</span>
                )}
            </div>
        );

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Najave'.translate(l)}
                radnja={<Link to="/account/announcements/new" className="z-adminokvir__radnja">{'Dodaj najavu'.translate(l)}</Link>}
            >
                {/* Sada iznad navbara — obe najave, sa izmenom jednim klikom. */}
                {!this.state.ucitavanje ? (
                    <div className="z-najave-traka">
                        <h2 className="z-najave-traka__naslov">{'Sada iznad navbara'.translate(l)}</h2>
                        {mesto('Obaveštenje 1 — levo', traka.levo)}
                        {mesto('Obaveštenje 2 — desno', traka.desno)}
                        <p className="z-najave-traka__savet">
                            {'Prikazuje se najava čiji period (OD–DO) traje; ako ih je više na istom mjestu, ide posljednja dodata. U izmjeni se vidi i mijenja tekst koji trenutno piše.'.translate(l)}
                        </p>
                    </div>
                ) : null}

                {/* Uspešno sačuvano — strana izmene vraća ovde sa `?sacuvano=1`. */}
                {this.props[0] && this.props[0].location && /sacuvano=1/.test(this.props[0].location.search) ? (
                    <div className="z-najave-traka__uspeh" role="status">{'Najava je sačuvana.'.translate(l)}</div>
                ) : null}

                <Tabela
                    lang={l}
                    ucitavanje={this.state.ucitavanje}
                    kolone={[
                        { kljuc: 'naslov', naziv: 'Natpis u traci' },
                        { kljuc: 'mesto', naziv: 'Mesto' },
                        { kljuc: 'period', naziv: 'Prikazuje se' },
                    ]}
                    redovi={this.state.items || []}
                    kljucReda={(r) => r._id}
                    ukupnoStavki={(this.state.items || []).length}
                    prazno={{
                        znak: '◔',
                        naslov: 'Nema nijedne najave',
                        tekst: 'Najava se pokazuje u traci iznad sajta, u periodu koji joj zadate.',
                        radnja: <Link to="/account/announcements/new" className="z-dugme z-dugme--glavno">{'Dodaj najavu'.translate(l)}</Link>,
                    }}
                    celija={(r, k) => {
                        if (k.kljuc === 'naslov') return Object.translate(r, 'content', l) || '—';
                        if (k.kljuc === 'mesto') return r.pozicija === 'desno'
                            ? 'Obaveštenje 2 — desno'.translate(l)
                            : 'Obaveštenje 1 — levo'.translate(l);

                        /* Datumi se do sada nisu videli u spisku, iako SAMO oni
                           odlučuju da li je najava vidljiva. */
                        const d = (t) => t ? new Date(Number(t) * 1000).toLocaleDateString('sr-RS') : '—';
                        const sada = Math.floor(Date.now() / 1000);
                        const aktivna = r.from && r.to && Number(r.from) <= sada && Number(r.to) >= sada;
                        return (
                            <span>
                                {d(r.from)} — {d(r.to)}
                                {aktivna
                                    ? <span className="z-oznaka z-oznaka--uspeh" style={{ marginLeft: 8 }}>{'aktivna'.translate(l)}</span>
                                    : <span className="z-tabela__tiho" style={{ marginLeft: 8 }}>{'van perioda'.translate(l)}</span>}
                            </span>
                        );
                    }}
                    radnje={(r) => (
                        <>
                            <Link to={`/account/announcements/${r._id}`} className="z-tabela__radnja" title={'Izmijeni'.translate(l)}>
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
                    naslov={'Brisanje najave'}
                    natpisPotvrde={'Obriši'}
                    tekst={b ? (<>{'Najava'.translate(l)} <strong>{Object.translate(b, 'content', l)}</strong> {'se briše trajno.'.translate(l)}</>) : null}
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