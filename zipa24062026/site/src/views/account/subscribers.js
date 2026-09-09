import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import moment from 'moment';


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
            categories: []
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

        fetch(`${API_ENDPOINT}/subscribers/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                items: result
            })
        })

    }



    render() {

        return (
            <AdminOkvir
                lang={this.props.lang}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Pretplaćeni na newsletter'.translate(this.props.lang)}
            >
                <div className="account-wrap">

                <section className="edit-account-section">
                    <Container>
                        <Row>
                            <Col lg="12" className="page-top-wrapper">
                                <h2>{'Lista prijavljenih'.translate(this.props.lang)}</h2>
                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                    <li><Link>{'Lista prijavljenih'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>

                            {/*
                              * RUCNO DODAVANJE ADRESE.
                              *
                              * Do sada je postojao samo masovni „Uvoz
                              * pretplatnika" (nalepi spisak). Za jednu adresu
                              * to je bilo preveliko sredstvo, pa je nedostajalo
                              * ocigledno mesto da se neko doda.
                              *
                              * Koristi POSTOJECU javnu rutu `/newsletter/subscribe`
                              * — ista provera adrese i ista zastita od duplikata
                              * kao kad se covek sam prijavi sa sajta.
                              */}
                            <Col lg="12">
                                <form className="z-spisak-pretraga" onSubmit={(e) => {
                                    e.preventDefault();
                                    const adresa = (this.state.novaAdresa || '').trim();
                                    if (!adresa) return;

                                    fetch(`${API_ENDPOINT}/newsletter/subscribe`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email: adresa })
                                    }).then(res => res.json()).then((odgovor) => {
                                        if (odgovor && odgovor.error) {
                                            this.setState({ greskaDodavanja: 'Adresa nije ispravna.'.translate(this.props.lang) });
                                            return;
                                        }
                                        this.setState({ novaAdresa: '', greskaDodavanja: null });
                                        fetch(`${API_ENDPOINT}/subscribers/all`, {
                                            method: 'GET',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                            },
                                        }).then(res => res.json()).then((result) => this.setState({ items: result }));
                                    }).catch(() => this.setState({
                                        greskaDodavanja: 'Adresa nije dodata. Pokušajte ponovo.'.translate(this.props.lang)
                                    }));
                                }}>
                                    <input
                                        type="email"
                                        className="z-polje__unos"
                                        value={this.state.novaAdresa || ''}
                                        placeholder={'ime@primjer.com'}
                                        aria-label={'Nova adresa'.translate(this.props.lang)}
                                        onChange={(e) => this.setState({ novaAdresa: e.target.value })}
                                    />
                                    <button type="submit" className="z-dugme z-dugme--glavno">
                                        {'Dodaj adresu'.translate(this.props.lang)}
                                    </button>
                                </form>
                                {this.state.greskaDodavanja
                                    ? <p className="error">{this.state.greskaDodavanja}</p>
                                    : null}
                            </Col>

                            <Col lg="12">
                                <div className="table">
                                    <div>
                                        <table>
                                            <tr>
                                                <th>{'E-mail'.translate(this.props.lang)}</th>
                                                <th>{'Prijavljen'.translate(this.props.lang)}</th>
                                                <th>{'Status'.translate(this.props.lang)}</th>
                                                <th>{'Akcije'.translate(this.props.lang)}</th>
                                            </tr>

                                            {
                                                this.state.items && this.state.items.length && this.state.items.map((item, idx) => {
                                                    return (
                                                        <tr>
                                                            <td>{item.email}</td>

                                                            {/*
                                                              * Datum prijave. Zapisi upisani prije nego što se
                                                              * datum počeo pratiti nemaju `timestamp` — za njih
                                                              * kolona ostaje prazna, jer se datum ne izmišlja.
                                                              */}
                                                            <td>
                                                                {item.timestamp
                                                                    ? moment.unix(item.timestamp).format('DD.MM.YYYY.')
                                                                    : <span className="z-tabela__tiho">&mdash;</span>}
                                                            </td>

                                                            {/*
                                                              * Odjavljeni ostaju na spisku, sa datumom odjave —
                                                              * ranije se zapis brisao, pa se nije znalo ni ko se
                                                              * odjavio ni kada. Poruke im se vise ne salju.
                                                              */}
                                                            <td>
                                                                {item.unsubscribedAt
                                                                    ? <span className="z-oznaka-odjave">
                                                                        {'Odjavljen'.translate(this.props.lang)}
                                                                        {' '}
                                                                        {moment.unix(item.unsubscribedAt).format('DD.MM.YYYY.')}
                                                                      </span>
                                                                    : <span className="z-oznaka-prijave">
                                                                        {'Prima poruke'.translate(this.props.lang)}
                                                                      </span>}
                                                            </td>

                                                            <td>
                                                                <button onClick={() => {
                                                                    this.props.handleDelete(() => {
                                                                        fetch(`${API_ENDPOINT}/subscribers/delete/` + item._id, {
                                                                            method: 'DELETE',
                                                                            headers: {
                                                                                Accept: 'application/json',
                                                                                //'Content-Type': 'multipart/form-data',
                                                                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                                                                            },
                                                                        }).then((res) => res.text()).then((img) => {
                                                                            fetch(`${API_ENDPOINT}/subscribers/all`, {
                                                                                method: 'GET',
                                                                                headers: {
                                                                                    'Content-Type': 'application/json',
                                                                                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                                                                },
                                                                            }).then(res => res.json()).then((result) => {
                                                                                this.setState({
                                                                                    items: result
                                                                                })
                                                                            })

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

                                </div>                            </Col>

                        </Row>

                    </Container>

                </section>





                </div>
            </AdminOkvir>
        );
    }
}

export default Page(CategoriesPage);