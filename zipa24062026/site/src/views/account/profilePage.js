import React, {Component} from 'react';
import {Link} from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    UncontrolledDropdown
} from 'reactstrap';

import NalogOkvir from '../../components/nalogOkvir';
import AdminOkvir from '../../components/adminOkvir';
import AdminPregled from '../../components/nalog/adminPregled';


import infoIcon from '../../assets/svg/account-info.svg';
import statIcon from '../../assets/svg/stat-icon.svg';
import {Line, Bar} from 'react-chartjs-2';

import lock from '../../assets/svg/lock.svg';
import userPhoto from '../../assets/images/user.png';

import backup from '../../assets/svg/backup.svg';
import trash from '../../assets/svg/orders-trash.svg';
import moment from 'moment';

import FromToForm from '../../components/forms/fromToForm';
import trashIcon from '../../assets/svg/orders-trash.svg';
import FromToForm1 from '../../components/forms/fromToForm1';
import {API_ENDPOINT} from '../../constants';
import Loader from "../../components/loader";
import {reset} from "redux-form";



class ProfilePage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialData,
            announcements: [],
            // statistika se dovlači nakon montiranja; do tada se u prikazu
            // vide crtice umesto nula
            loadingData: true,
            adminStatistics: {
                photosCount: 0,
                photographersCount: 0,
                todayEarnings: 0,
                yesterdayEarnings: 0,
                prevMonthEarnings: 0,
                currentMonthEarnings: 0,
                totalDownloads: 0,
                todayDownloads: 0,
                visitsPerDay: [],
                todayVisits: [],
                lastTransactions: [],
                loadingData: true,
                sameTimestamp: false,
            },
            photographerStatistics: []

        };
    }

    /**
     * Statistika stiže sa zakašnjenjem od nekoliko sekundi, pa se do tada
     * prikazuje crtica umesto nule — inače deluje kao da podaci nedostaju.
     */
    stat = (value, suffix = '') => {
        if (this.state.loadingData || value === undefined || value === null) return '—';
        return `${value}${suffix}`;
    }

    adminStatistics = () => {
        const {timeData} = this.state;
        this.setState({
            photosCount: 0,
            photographersCount: 0,
            todayEarnings: 0,
            yesterdayEarnings: 0,
            prevMonthEarnings: 0,
            currentMonthEarnings: 0,
            totalDownloads: 0,
            todayDownloads: 0,
            visitsPerDay: [],
            todayVisits: [],
            lastTransactions: [],
            loadingData: true,
            sameTimestamp: false,
            showForm: true,
        }, () => {
            if (timeData) {
                let from = timeData.from;
                let to = timeData.to;
                if (timeData.from === timeData.to) {
                    this.setState({
                        sameTimestamp: true
                    })
                }
                fetch(`${API_ENDPOINT}/admin/statistics`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({from, to})
                })
                    .then(res => res.json())
                    .then(result => {
                        if (result.visitsPerDay && result.visitsPerDay.length) {
                            let sum = result.visitsPerDay.reduce((acc, {count}) => acc + count, 0);
                            result.sumVisitsPerDay = sum;
                        }

                        this.setState({
                            adminStatistics: result,
                            loadingData: false,
                            sameTimestamp: false
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching statistics:', error);
                    });
            } else {
                fetch(`${API_ENDPOINT}/admin/statistics`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                })
                    .then(res => res.json())
                    .then(result => {
                        if (result.visitsPerDay && result.visitsPerDay.length) {
                            let sum = result.visitsPerDay.reduce((acc, {count}) => acc + count, 0);
                            result.sumVisitsPerDay = sum;
                        }

                        this.setState({
                            adminStatistics: result,
                            loadingData: false,
                            sameTimestamp: false
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching statistics:', error);
                    });
            }
        });

    }

    componentDidMount() {
        window.scrollTo(0, 0);
        this.setState({
            showForm: false
        });
        setTimeout(() => {
            this.setState({showForm: true})
        }, 100)

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }

        fetch(`${API_ENDPOINT}/announcements`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                announcements: result
            })
        })

        if (this.props.uData.userRole === 'admin') {
            this.adminStatistics();
        }

        if (this.props.uData.userRole === 'photographer') {
            fetch(`${API_ENDPOINT}/photographer/statistics`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
            }).then(res => res.json()).then((result) => {
                this.setState({
                    photographerStatistics: result
                })
            })

        }
    }


    render() {
        /*
         * Lične strane naloga dele isti sadržaj za sve, ali ne i isti okvir:
         * administrator ostaje u administratorskom okviru (do njih dolazi iz
         * njegovog dna), svi ostali su u okviru svog naloga. Uloga se samo
         * čita — prava i pozivi ka API-ju su nepromenjeni.
         */
        const Okvir = this.props.uData && this.props.uData.userRole === 'admin'
            ? AdminOkvir : NalogOkvir;

        const l = this.props.lang;
        const u = this.props.uData || {};

        /*
         * Provera uloge je NEPROMENJENA — isti izraz koji je i do sada stajao
         * u ovom fajlu (`uData.userRole === 'admin'`), isti onaj koji odlučuje
         * i da li se `adminStatistics()` uopšte poziva u `componentDidMount`.
         */
        const jeAdmin = u.userRole === 'admin';

        return (
            <Okvir
                lang={l}
                settings={this.props.settings}
                uData={this.props.uData}
                putanja={this.props[0].location.pathname}
                signOut={this.props.signOut}
                naslov={'Profil'.translate(l)}
            >
                <a ref={(node) => this.aTag = node}></a>
                <a ref={(node) => this.aTag1 = node}></a>

                {/* ── obaveštenja ────────────────────────────────────── */}
                {this.state.announcements.map((item, idx) => (
                    <div className="z-nalog__obavestenje" key={idx}>
                        <Isvg src={infoIcon} />
                        <span>{Object.translate(item, 'content', l)}</span>
                    </div>
                ))}

                {/* ── osnovni podaci ─────────────────────────────────── */}
                <div className="z-nalog__odeljak">
                    <h2 className="z-nalog__odeljak-naslov">
                        {'Osnovni podaci'.translate(l)}
                    </h2>
                    <dl className="z-nalog__podaci">
                        {u.name ? (
                            <div className="z-nalog__red">
                                <dt>{'Ime i prezime'.translate(l)}</dt>
                                <dd>{u.name}</dd>
                            </div>
                        ) : null}
                        {u.email ? (
                            <div className="z-nalog__red">
                                <dt>{'E-mail adresa'.translate(l)}</dt>
                                <dd>{u.email}</dd>
                            </div>
                        ) : null}
                        <div className="z-nalog__red">
                            <dt>{'Posljednja prijava'.translate(l)}</dt>
                            <dd>
                                {u.previousLoginTimestamp
                                    ? moment.unix(u.previousLoginTimestamp).format('DD.MM.YYYY. HH:mm')
                                    : '—'}
                            </dd>
                        </div>
                        {u.freePhotos !== undefined ? (
                            <div className="z-nalog__red">
                                <dt>{'Besplatnih preuzimanja'.translate(l)}</dt>
                                <dd>{u.freePhotos}</dd>
                            </div>
                        ) : null}
                    </dl>
                </div>

                {/* ── kratak pregled ─────────────────────────────────── */}
                <div className="z-nalog__odeljak">
                    <h2 className="z-nalog__odeljak-naslov">
                        {'Kratak pregled'.translate(l)}
                    </h2>
                    <div className="z-nalog__pregled">
                        <div className="z-nalog__pregled-kartica">
                            <span className="z-nalog__pregled-naziv">
                                {'Ukupno preuzeto'.translate(l)}
                            </span>
                            <span className="z-nalog__pregled-broj">
                                {u.totalDownloads !== undefined ? u.totalDownloads : '—'}
                            </span>
                        </div>
                        <div className="z-nalog__pregled-kartica">
                            <span className="z-nalog__pregled-naziv">
                                {'Preuzeto ovaj mjesec'.translate(l)}
                            </span>
                            <span className="z-nalog__pregled-broj">
                                {u.currMonthDownloads !== undefined ? u.currMonthDownloads : '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── prečice ────────────────────────────────────────── */}
                <div className="z-nalog__odeljak">
                    <h2 className="z-nalog__odeljak-naslov">
                        {'Prečice'.translate(l)}
                    </h2>
                    <div className="z-nalog__precice">
                        <Link className="z-nalog__precica z-nalog__precica--glavna" to="/account/downloads">
                            {'Moja preuzimanja'.translate(l)}
                        </Link>
                        <Link className="z-nalog__precica" to="/account/edit">
                            {'Izmijeni podatke'.translate(l)}
                        </Link>
                        <Link className="z-nalog__precica" to="/account/change-password">
                            {'Promijeni lozinku'.translate(l)}
                        </Link>
                    </div>
                </div>

                {/* ── administratorski pregled ───────────────────────── */}
                {jeAdmin ? (
                    <AdminPregled
                        lang={l}
                        statistika={this.state.adminStatistics}
                        ucitava={this.state.loadingData}
                    />
                ) : null}
            </Okvir>
        );
    }
}

export default Page(ProfilePage);