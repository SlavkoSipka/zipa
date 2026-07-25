import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';

import { GoogleMapScript } from '../../components/googleMapScript';

import {
    Container,
    Row,
    Col
} from 'reactstrap';

import SettingsForm from '../../components/forms/storeSettingsForm';
import rightArrow from '../../assets/svg/right-arrow.svg';
import { API_ENDPOINT } from '../../constants';

class StoreSettingsPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);
        this.submit = this.submit.bind(this);

        this.state = {
            ...props.initialData,
            categories: []
        };
    }

    init() {
        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname).then((data) => {
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

        if (prevProps[0].location.pathname != this.props[0].location.pathname) {
            this.init();
        }
    }

    submit(data) {
        console.log(data);
        fetch(`${API_ENDPOINT}/stores/update/` + this.props[0].match.params.storeAlias, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(data)
        }).then(res => res.json()).then((result) => {
            if (result.error) {
                this.setState({
                    error: result.error
                })
            } else {
                this.props[0].history.push(`/shop/${this.props[0].match.params.storeAlias}`)
            }
        })

    }



    render() {
        let store = this.state.storeData ? this.state.storeData : {};

        return (
            <div className="store-wrap">
                <GoogleMapScript _googleMapsLoaded={this.props._googleMapsLoaded} API_KEY="AIzaSyDx7uNRz2GYWKLlAlfT6wugFOSBXQ7EZaQ" />

                <div className="top-into-wrap">
                    <Container>
                        <Row>
                            <Col lg="6" sm="6">
                                <h1>{store.name}</h1>
                                <h6>{store.address}, {store.city}</h6>
                            </Col>
                            <Col lg={{ size: 6 }} sm="6">
                                <div className="search-wrap">
                                    <input type="text" placeholder="Unesite pojam za pretragu" value={this.state.search} onChange={(e) => this.setState({ search: e.target.value })} onKeyUp={(e) => {
                                        if (e.keyCode == 13) {
                                            e.preventDefault();
                                            this.props[0].history.push(this.props[0].location.pathname + this.generateSearchLink('search', encodeURIComponent(this.state.search)));
                                        }
                                    }} />
                                    <button className="button" onClick={() => {
                                        this.props[0].history.push(this.props[0].location.pathname + this.generateSearchLink('search', encodeURIComponent(this.state.search)));

                                    }}>TRAŽI <Isvg src={rightArrow} /> </button>
                                </div>
                            </Col>
                        </Row>

                    </Container>
                </div>

                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="12">
                                <div className="profile">
                                    <ul className="tabs">
                                        <li >
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}`}>Shop</Link>
                                        </li>
                                        <li>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/orders`}>Narudžbe</Link>
                                        </li>
                                        <li >
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/products`}>Proizvodi</Link>
                                        </li>
                                        <li>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/contacts`}>Kontakti</Link>
                                        </li>
                                        <li className="active">
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/settings`}>Podešavanja</Link>
                                        </li>
                                        <li>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/admins`}>Administratori</Link>
                                        </li>
                                        <li>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/statistics`}>Statistike</Link>
                                        </li>
                                        <li>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/products/new`}>DODAJ ARTIKAL</Link>
                                        </li>
                                    </ul>

                                    <div className="form-wrapper">
                                        <div className="top">
                                            <h3>Podešavanja</h3>

                                        </div>


                                        <SettingsForm _googleMapsLoaded={this.props._googleMapsLoaded} initialValues={this.state.storeData} onSubmit={this.submit} />


                                    </div>
                                </div>
                            </Col>

                        </Row>

                    </Container>

                </div>


            </div>
        );
    }
}

export default Page(StoreSettingsPage);