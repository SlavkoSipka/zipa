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


/*
 * Pravilan oblik uz broj: 1 adresu, 2–4 adrese, 5+ adresa — uz izuzetak za
 * 11–14, koji uvek idu sa „adresa". Bez ovoga je pisalo „62 adresa".
 */
function oblikAdresa(n) {
    const zadnja = n % 10;
    const zadnjeDve = n % 100;
    if (zadnjeDve >= 11 && zadnjeDve <= 14) return 'adresa';
    if (zadnja === 1) return 'adresu';
    if (zadnja >= 2 && zadnja <= 4) return 'adrese';
    return 'adresa';
}

class CategoriesPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialData,
            categories: [],
            ucitavanje: true,
            zaPotvrdu: null,
            poruke: [],
        };

        this.poruke = napraviPoruke(this);
    }

    /* Tekst potvrde — posledica se piše konkretno, sa brojem primalaca. */
    tekstPotvrde(p) {
        const l = this.props.lang;
        const naslov = Object.translate(p.zapis, 'title', l);
        const n = this.state.brojPretplatnika;

        if (p.vrsta === 'test') {
            return <>{'Probna poruka ide na adrese agencije, ne pretplatnicima.'.translate(l)}</>;
        }
        if (p.vrsta === 'slanje') {
            return (
                <>
                    <strong>{naslov}</strong>{' '}
                    {n === null || n === undefined
                        ? 'će biti poslat svim pretplatnicima. Slanje se ne može opozvati.'.translate(l)
                        : ('će biti poslat na ' + n + ' ' + oblikAdresa(n) + '. Slanje se ne može opozvati.')}
                </>
            );
        }
        return (
            <>
                {'Newsletter'.translate(l)} <strong>{naslov}</strong>{' '}
                {'se briše trajno.'.translate(l)}
            </>
        );
    }

    /* Jedno mesto za sve tri radnje — svaka javlja ishod obaveštenjem. */
    izvrsi(p) {
        const l = this.props.lang;
        const id = p.zapis._id;
        const zaglavlje = {
            Accept: 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        };

        const putanje = {
            test:     { url: `${API_ENDPOINT}/newsletter/send/test/${id}`, metod: 'GET',    uspeh: 'Probna poruka je poslata.' },
            slanje:   { url: `${API_ENDPOINT}/newsletter/send/${id}`,      metod: 'GET',    uspeh: 'Newsletter je poslat.' },
            brisanje: { url: `${API_ENDPOINT}/newsletter/delete/${id}`,    metod: 'DELETE', uspeh: 'Newsletter je obrisan.' },
        };

        const r = putanje[p.vrsta];
        this.setState({ zaPotvrdu: null });

        fetch(r.url, { method: r.metod, headers: zaglavlje })
            .then((res) => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            })
            .then(() => {
                this.poruke.dodaj('uspeh', r.uspeh.translate(l));
                this.osvezi();
            })
            .catch(() => {
                this.poruke.dodaj('greska', 'Radnja nije uspjela. Pokušajte ponovo.'.translate(l));
            });
    }

    osvezi() {
        fetch(`${API_ENDPOINT}/newsletter/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        }).then((res) => res.json()).then((result) => {
            this.setState({ items: result, ucitavanje: false });
        }).catch(() => this.setState({ ucitavanje: false }));
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

        fetch(`${API_ENDPOINT}/newsletter/all`, {
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

        /* Broj pretplatnika ide u pitanje pre slanja — da administrator vidi
           domet radnje PRE nego što je potvrdi, a ne posle. */
        fetch(`${API_ENDPOINT}/subscribers/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({ brojPretplatnika: Array.isArray(result) ? result.length : null })
        }).catch(() => this.setState({ brojPretplatnika: null }))

    }



    render() {
        const l = this.props.lang;
        const p = this.state.zaPotvrdu;

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Newsletter'.translate(l)}
                radnja={<Link to="/account/newsletter/new" className="z-adminokvir__radnja">{'Dodaj newsletter'.translate(l)}</Link>}
            >
                <Tabela
                    lang={l}
                    ucitavanje={this.state.ucitavanje}
                    kolone={[
                        { kljuc: 'naslov', naziv: 'Naslov' },
                        { kljuc: 'status', naziv: 'Status' },
                    ]}
                    redovi={this.state.items || []}
                    kljucReda={(r) => r._id}
                    ukupnoStavki={(this.state.items || []).length}
                    prazno={{
                        znak: '✉',
                        naslov: 'Nema nijednog newslettera',
                        tekst: 'Napravite prvi — poslaće se pretplatnicima tek kad to sami potvrdite.',
                        radnja: <Link to="/account/newsletter/new" className="z-dugme z-dugme--glavno">{'Dodaj newsletter'.translate(l)}</Link>,
                    }}
                    celija={(r, k) => {
                        if (k.kljuc === 'naslov') return Object.translate(r, 'title', l);

                        const poslat = r.status === 'Poslato';
                        const kada = r.sentAt ? new Date(r.sentAt * 1000).toLocaleDateString('sr-RS') : null;
                        return (
                            <span>
                                {r.status}
                                {poslat && kada ? (
                                    <span className="poslato-kada"> · {kada}
                                        {r.sentCount ? ' · ' + r.sentCount + ' ' + oblikAdresa(r.sentCount) : ''}
                                    </span>
                                ) : null}
                            </span>
                        );
                    }}
                    radnje={(r) => {
                        const poslat = r.status === 'Poslato';
                        return (
                            <>
                                <button type="button" className="z-tabela__radnja"
                                        title={'Pošalji test'.translate(l)}
                                        onClick={() => this.setState({ zaPotvrdu: { vrsta: 'test', zapis: r } })}>
                                    <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor"/></svg>
                                </button>

                                <button type="button" className="z-tabela__radnja"
                                        disabled={poslat}
                                        title={poslat
                                            ? 'Već poslato'.translate(l)
                                            : 'Pošalji newsletter'.translate(l)}
                                        onClick={() => this.setState({ zaPotvrdu: { vrsta: 'slanje', zapis: r } })}>
                                    <svg viewBox="0 0 24 24"><path d="M3 5h18v14H3V5zm2.4 2L12 12l6.6-5H5.4zM5 8.5V17h14V8.5l-7 5.2-7-5.2z" fill="currentColor"/></svg>
                                </button>

                                {/* Pregled prije slanja — poruka onakva kakvu
                                    dobija primalac. */}
                                <Link to={`/account/newsletter-pregled/${r._id}`} className="z-tabela__radnja" title={'Pregledaj'.translate(l)}>
                                    <svg viewBox="0 0 24 24"><path d="M12 5c-5 0-9 4.5-9 7s4 7 9 7 9-4.5 9-7-4-7-9-7zm0 11a4 4 0 110-8 4 4 0 010 8zm0-6.2a2.2 2.2 0 100 4.4 2.2 2.2 0 000-4.4z" fill="currentColor"/></svg>
                                </Link>

                                <Link to={`/account/newsletter/${r._id}`} className="z-tabela__radnja" title={'Izmijeni'.translate(l)}>
                                    <svg viewBox="0 0 24 24"><path d="M3 17.2V21h3.8L17.8 10 14 6.2 3 17.2zM20.7 7.1a1 1 0 000-1.4l-2.4-2.4a1 1 0 00-1.4 0l-1.8 1.8L18.9 9l1.8-1.9z" fill="currentColor"/></svg>
                                </Link>

                                <button type="button" className="z-tabela__radnja z-tabela__radnja--opasno"
                                        title={'Obriši'.translate(l)}
                                        onClick={() => this.setState({ zaPotvrdu: { vrsta: 'brisanje', zapis: r } })}>
                                    <svg viewBox="0 0 24 24"><path d="M6 7h12l-1 14H7L6 7zm3-4h6l1 2h4v2H4V5h4l1-2z" fill="currentColor"/></svg>
                                </button>
                            </>
                        );
                    }}
                />

                <Potvrda
                    lang={l}
                    otvoren={!!p}
                    opasno={p && p.vrsta !== 'test'}
                    naslov={p ? ({
                        test: 'Probno slanje',
                        slanje: 'Slanje newslettera',
                        brisanje: 'Brisanje newslettera',
                    })[p.vrsta] : ''}
                    natpisPotvrde={p ? ({
                        test: 'Pošalji test',
                        slanje: 'Pošalji svima',
                        brisanje: 'Obriši',
                    })[p.vrsta] : ''}
                    tekst={p ? this.tekstPotvrde(p) : null}
                    naPotvrdu={() => this.izvrsi(p)}
                    naOdustani={() => this.setState({ zaPotvrdu: null })}
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