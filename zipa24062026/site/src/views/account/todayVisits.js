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


import infoIcon from '../../assets/svg/account-info.svg';
import statIcon from '../../assets/svg/stat-icon.svg';
import { Line, Bar } from 'react-chartjs-2';

import lock from '../../assets/svg/lock.svg';
import userPhoto from '../../assets/images/user.png';

import backup from '../../assets/svg/backup.svg';
import trash from '../../assets/svg/orders-trash.svg';
import moment from 'moment';

import FromToForm from '../../components/forms/fromToForm';
import trashIcon from '../../assets/svg/orders-trash.svg';
import FromToForm1 from '../../components/forms/fromToForm1';
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


class ProfilePage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialData,
            announcements: [],
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

            },
            photographerStatistics: []

        };
    }

    adminStatistics = () => {
        if (this.state.timeData) {
            fetch(`${API_ENDPOINT}/admin/statistics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(this.state.timeData)
            }).then(res => res.json()).then((result) => {
                this.setState({
                    adminStatistics: result
                })
            })

        } else {
            fetch(`${API_ENDPOINT}/admin/statistics`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
            }).then(res => res.json()).then((result) => {
                this.setState({
                    adminStatistics: result
                })
            })
        }

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

        if (this.props.uData.userRole == 'admin') {
            this.adminStatistics();
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


        let totalVisits = 0;
        for (let i = 0; i < this.state.photographerStatistics.length; i++) {
            totalVisits += this.state.photographerStatistics[i].count;
        }

        return (
            <div className="account-wrap">
                <div className="into-wrap">
                </div>
                <a ref={(node) => this.aTag = node}></a>
                <a ref={(node) => this.aTag1 = node}></a>

                <section className="section-profile">
                    <Container>
                        <Row>
                            <Col lg="12" className="page-top-wrapper">

                                <h2>{'Logovi'.translate(this.props.lang)}</h2>



                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/logs'>{'Logovi'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>




                            {
                                this.props.uData && this.props.uData.userRole == 'admin' ?
                                    <>



                                        <Col lg="12" sm="12" className="statistics-1">



                                            <div className="photos">
                                                <h6>{'Najpregledanije stranice danas'.translate(this.props.lang)}</h6>
                                                <ul>
                                                    {
                                                        this.state.adminStatistics.todayVisits.map((item, idx) => {
                                                            if (idx < 10)
                                                                return (
                                                                    <li key={idx}>
                                                                        <label>{item.url}</label>
                                                                        <div>
                                                                            <div> <div style={{ width: `${(item.count * 100) / this.state.adminStatistics.todayVisitsCount}%` }}></div> </div>
                                                                            {((item.count * 100) / this.state.adminStatistics.todayVisitsCount).toFixed(2)}%
                                                                        </div>
                                                                    </li>

                                                                )
                                                        })
                                                    }
                                                </ul>
                                                <Link to='/account/logs'>{'Pogledaj detaljnije'.translate(this.props.lang)}</Link>
                                            </div>
                                        </Col>



                                    </>
                                    :

                                    null
                            }

                        </Row>
                    </Container>

                </section>




            </div>
        );
    }
}

export default Page(ProfilePage);