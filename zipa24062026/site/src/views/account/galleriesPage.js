import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


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
import { API_ENDPOINT } from '../../constants';
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
                                <h2>{'Galerije'.translate(this.props.lang)}</h2>
                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                    <li><Link>{'Galerije'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>

                            <Col lg="12">
                                <div className="table">
                                    <div>
                                        <table>
                                            <tr>
                                                <th></th>
                                                <th>{'Naziv'.translate(this.props.lang)}</th>
                                                <th>{'Lokacija'.translate(this.props.lang)}</th>
                                                <th>{'Cijena'.translate(this.props.lang)}</th>
                                                <th>{'Akcije'.translate(this.props.lang)}</th>
                                            </tr>

                                            {
                                                this.state.items && this.state.items.length && this.state.items.map((item, idx) => {
                                                    return (
                                                        <tr>
                                                            <td><img src={`${API_ENDPOINT}/photos/350x/` + Object.get(item, `photos[0].image`)} /></td>
                                                            <td>{Object.translate(item, 'name', this.props.lang)}</td>
                                                            <td>{item.location}</td>
                                                            <td>{item.price.formatPrice(2)} KM</td>

                                                            <td>
                                                                <Link to={`/account/gallery/${item._id}`}><button><Isvg src={penIcon} /></button></Link>
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
        );
    }
}

export default Page(GalleriesPage);