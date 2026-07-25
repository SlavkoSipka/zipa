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
import rightArrow from '../../assets/svg/right-arrow.svg';
import user from '../../assets/svg/user.svg';
import penIcon from '../../assets/svg/orders-pen.svg';
import trashIcon from '../../assets/svg/orders-trash.svg';
import search from '../../assets/svg/search.svg';
import rightArrowSmall from '../../assets/svg/right-arrow-1.svg';
import ReactPaginate from 'react-paginate';
import ToggleSwitch from '../../components/forms/fields/toggleCheckbox';

import AgencySettingsForm from '../../components/forms/agencySettingsForm';
import { API_ENDPOINT } from '../../constants';

class AgencySettings extends Component {
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

        console.log(this.getSearchParams())

        return (
            <div className="account-wrap">
                <div className="into-wrap">
                </div>

                <section className="edit-account-section">
                    <Container>
                        <Row>
                            <Col lg="12" className="page-top-wrapper">
                                <h2>{'Podešavanje agencije'.translate(this.props.lang)}</h2>
                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                    <li><Link>{'Podešavanje agencije'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>

                            <Col lg="12">
                                <AgencySettingsForm initialValues={this.state.initialValues} photographers={this.props.photographers} categories={this.props.categories} onSubmit={(data) => {
                                    fetch(`${API_ENDPOINT}/gallery/user-resolutions/${this.props[0].match.params.uid}`, {
                                        method: 'POST',
                                        headers: {
                                            'content-type': 'application/json',
                                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                                        },
                                        body: JSON.stringify(data)
                                    }).then(res => res.json()).then((result) => {
                                        this.init();
                                        this.props[0].history.push('/account/users')
                                    })

                                }}></AgencySettingsForm>
                                {this.state.error ? <p className="error">{this.state.error}</p> : null}
                            </Col>
                        </Row>

                    </Container>

                </section>




            </div>
        );
    }
}

export default Page(AgencySettings);