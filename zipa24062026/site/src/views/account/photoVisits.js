import React, { Component } from 'react';
import { Link } from 'react-router-dom'
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

import Image from '../../components/image';

import image1 from '../../assets/images/image1.png';
import image2 from '../../assets/images/image2.png';

import banner1 from '../../assets/images/banner1.png';
import banner2 from '../../assets/images/banner2.png';
import banner3 from '../../assets/images/banner3.png';
import infoIcon from '../../assets/svg/account-info.svg';
import statIcon from '../../assets/svg/stat-icon.svg';
import { Line, Bar } from 'react-chartjs-2';
import { API_ENDPOINT } from '../../constants';
const data = {
    labels: ['02 Jan', '03 Jan', '04 Jan', '05 Jan', '06 Jan', '07 Jan'],
    datasets: [
        {
            label: 'PREGLED ARTIKALA PO DANIMA',
            fill: false,
            lineTension: 0.4,
            backgroundColor: '#F4F5FB',
            borderColor: '#2F629C',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: '#2F629C',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#2F629C',
            pointHoverBorderColor: 'rgba(220,220,220,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: [65, 59, 80, 81, 56, 55]
        }
    ]
};


class PhotoVisitsPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialData,
            photographerStatistics: []
        };
    }

    componentDidMount() {
        window.scrollTo(0, 0);

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }

        if (this.props.uData.userRole == 'photographer') {
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
        return (
            <div className="account-wrap">
                <div className="into-wrap">
                </div>

                <section className="section-profile">
                    <Container>
                        <Row>
                            <Col lg="12" className="page-top-wrapper">
                                <h2>{'Najgledanije fotografije'.translate(this.props.lang)}</h2>
                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>

                            <Col lg="12" className="photo-visits">
                                <Row className="head">
                                    <Col lg="10">
                                        {'FOTOGRAFIJA'.translate(this.props.lang)}
                                    </Col>
                                    <Col lg="2">
                                        {'PREGLEDI'.translate(this.props.lang)}
                                    </Col>
                                </Row>

                                <div className="items">
                                    {
                                        this.state.photographerStatistics.map((item, idx) => {
                                            return (
                                                <Row>
                                                    <Col lg="10" className="photo-visits-name">
                                                        <img src={`${API_ENDPOINT}/photos/350x/` + item.photo.image} />{item.photo.name}
                                                    </Col>
                                                    <Col lg="2">
                                                        {item.count}
                                                    </Col>

                                                </Row>

                                            )
                                        })
                                    }

                                </div>

                            </Col>
                        </Row>
                    </Container>
                </section>

            </div>
        );
    }
}

export default Page(PhotoVisitsPage);