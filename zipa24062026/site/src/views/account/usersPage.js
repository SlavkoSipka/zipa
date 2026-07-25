import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,
} from 'reactstrap';
import picture from '../../assets/svg/picture-icon.svg';
import searchIcon from '../../assets/svg/search-icon-btn.svg';

import BlogArticle from '../../components/articles/blogArticle';
import imagesCount from '../../assets/svg/images-count.svg';
import user from '../../assets/svg/user.svg';
import penIcon from '../../assets/svg/orders-pen.svg';
import trashIcon from '../../assets/svg/orders-trash.svg';

import ReactPaginate from 'react-paginate';
import moment from 'moment';
import ToggleSwitch from '../../components/forms/fields/toggleCheckbox';
import { API_ENDPOINT } from '../../constants';
class UsersPage extends Component {
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

    }

    componentDidUpdate(prevProps) {

        if (prevProps[0].location.pathname != this.props[0].location.pathname || prevProps[0].location.search != this.props[0].location.search) {
            this.init();
        }
    }



    render() {
        return (
            <div className="account-wrap">
                <div className="into-wrap">
                </div>
                <section className="edit-account-section">
                    <Container>
                        <Row>
                            <Col lg="12" className="page-top-wrapper">
                                <h2>{'Korisnici'.translate(this.props.lang)}</h2>
                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                    <li><Link>{'Korisnici'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>
                            <Col lg={{ size: 6, offset: 6 }}>
                                <div className="search-wrap">
                                    <input type="text" placeholder={'Unesite pojam za pretragu'.translate(this.props.lang)} value={this.state.search} onChange={(e) => this.setState({ search: e.target.value })} onKeyUp={(e) => {
                                        if (e.keyCode == 13) {
                                            e.preventDefault();
                                            this.props[0].history.push(`/account/users?search=${encodeURIComponent(this.state.search)}`);
                                        }
                                    }} />
                                    <button className="button" onClick={() => {
                                        this.props[0].history.push(`/account/users?search=${encodeURIComponent(this.state.search)}`);
                                    }}><Isvg src={searchIcon} /> {'PRETRAŽI'.translate(this.props.lang)}  </button>
                                </div>
                            </Col>

                            <Col lg="12">
                                <div className="table">
                                    <div>
                                        <table>
                                            <tr>
                                                <th>{'E-mail'.translate(this.props.lang)}</th>
                                                {
                                                    this.props.uData.userRole != 'photographer' || this.props.uData.permissions[0] != '*' ?
                                                        <th>{'Datum registracije'.translate(this.props.lang)}</th>
                                                        :
                                                        null
                                                }

                                                <th>{'Tip korisnika'.translate(this.props.lang)}</th>
                                                {
                                                    this.props.uData.userRole != 'photographer' || this.props.uData.permissions[0] != '*' ?
                                                        <th>{'E-mail verifikovan'.translate(this.props.lang)}</th>
                                                        :
                                                        null
                                                }
                                                {
                                                    this.props.uData.userRole != 'photographer' || this.props.uData.permissions[0] != '*' ?
                                                        <th>{'Aktivan nalog'.translate(this.props.lang)}</th>
                                                        :
                                                        null
                                                }


                                                <th>{'Akcije'.translate(this.props.lang)}</th>
                                            </tr>

                                            {
                                                this.state.items && this.state.items.length && this.state.items.map((item, idx) => {
                                                    return (
                                                        <tr>
                                                            <td>{item.name}<br /> {item.email}</td>
                                                            {
                                                                this.props.uData.userRole != 'photographer' || this.props.uData.permissions[0] != '*' ?
                                                                    <td>{item.registerTimestamp ? moment.unix(item.registerTimestamp).format('DD.MM.YYYY. | HH:mm') + ' h' : null}</td>
                                                                    :
                                                                    null
                                                            }
                                                            {
                                                                this.props.uData.userRole != 'photographer' || this.props.uData.permissions[0] != '*' ?
                                                                    <td>{item.userRole}</td>
                                                                    :
                                                                    item.userRole == 'photographer' ?
                                                                        <td>{item.userRole}</td>
                                                                        :
                                                                        <td></td>
                                                            }
                                                            {
                                                                this.props.uData.userRole != 'photographer' || this.props.uData.permissions[0] != '*' ?
                                                                    <td><ToggleSwitch value={item.emailVerified} onChange={() => {
                                                                        fetch(`${API_ENDPOINT}/users/change/emailVerified/${item._id}/${item.emailVerified ? '0' : '1'}`, {
                                                                            method: 'GET',
                                                                            headers: {
                                                                                'content-type': 'application/json',
                                                                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                                                                            },
                                                                        }).then(res => res.json()).then((result) => {
                                                                            this.init();
                                                                        })


                                                                    }} /></td>
                                                                    :
                                                                    null
                                                            }
                                                            {
                                                                this.props.uData.userRole != 'photographer' || this.props.uData.permissions[0] != '*' ?
                                                                    <td><ToggleSwitch value={item.accountEnabled} onChange={() => {
                                                                        fetch(`${API_ENDPOINT}/users/change/accountEnabled/${item._id}/${item.accountEnabled ? '0' : '1'}`, {
                                                                            method: 'GET',
                                                                            headers: {
                                                                                'content-type': 'application/json',
                                                                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                                                                            },
                                                                        }).then(res => res.json()).then((result) => {
                                                                            this.init();
                                                                        })


                                                                    }} /></td>
                                                                    :
                                                                    null
                                                            }



                                                            <td>
                                                                {
                                                                    this.props.uData.userRole != 'photographer' || this.props.uData.permissions[0] != '*' ?
                                                                        <Link to={`/account/users/${item._id}`}><button><Isvg src={penIcon} /></button></Link>
                                                                        :
                                                                        null
                                                                }


                                                                {item.userRole == 'photographer' ? <Link to={`/account/gallery-photographer/${item._id}/new`}><button><Isvg src={imagesCount} /></button></Link> : null}
                                                                {
                                                                    this.props.uData.userRole != 'photographer' || this.props.uData.permissions[0] != '*' ?
                                                                        item.userRole == 'agency' ? <Link to={`/account/agency-settings/${item._id}`}><button>PODESI</button></Link> : null
                                                                        :
                                                                        null
                                                                }

                                                                {
                                                                    this.props.uData.userRole != 'photographer' || this.props.uData.permissions[0] != '*' ?
                                                                        <button onClick={() => {
                                                                            this.props.handleDelete(() => {
                                                                                fetch(`${API_ENDPOINT}/users/delete/` + item._id, {
                                                                                    method: 'DELETE',
                                                                                    headers: {
                                                                                        Accept: 'application/json',
                                                                                        //'Content-Type': 'multipart/form-data',
                                                                                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                                                                                    },
                                                                                }).then((res) => res.text()).then((img) => {
                                                                                    this.init();
                                                                                });

                                                                            })
                                                                        }}> <Isvg src={trashIcon} /></button>
                                                                        :
                                                                        null
                                                                }

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
        );
    }
}

export default Page(UsersPage);