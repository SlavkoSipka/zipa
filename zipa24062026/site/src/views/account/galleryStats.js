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

import Image from '../../components/image';


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
                loadingData: true,
                sameTimestamp: false,
                showForm: false,
            },
            photographerStatistics: []

        };
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
            sameTimestamp: false
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
                }).then(res => res.json()).then((result) => {
                    this.setState({
                        adminStatistics: result,
                        loadingData: false,
                        sameTimestamp: false
                    })
                }).catch(error => {
                    console.error('Error fetching statistics:', error);
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
                        adminStatistics: result,
                        loadingData: false,
                        sameTimestamp: false
                    })
                }).catch(error => {
                    console.error('Error fetching statistics:', error);
                })
            }
        });
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        setTimeout(() => {
            this.setState({showForm: true});
        }, 500);

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
                                <h2>{'Statistika galerija'.translate(this.props.lang)}</h2>


                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                    <li><Link
                                        to='/account/gallery-stats'>{'Statistika galerija'.translate(this.props.lang)}</Link>
                                    </li>

                                </ul>

                            </Col>
                            {
                                this.props.uData && this.props.uData.userRole == 'admin' ?
                                    <>
                                        { /*
                                        <Col lg="12" className="photographers-statistics">
                                            <h6>{'Statistika fotografa'.translate(this.props.lang)}</h6>

                                            <ul>
                                                {this.state.adminStatistics.photographers && this.state.adminStatistics.photographers.map((item, idx) => {
                                                    if (item.uploadedGalleryCount)
                                                        return (
                                                            <li>
                                                                <h3>{item.name}</h3>
                                                                <p>{'Broj uploadovanih galerija: '.translate(this.props.lang)} {item.uploadedGalleryCount}</p>
                                                                <p>{'Broj uploadovanih slika: '.translate(this.props.lang)} {item.uploadedPhotosCount}</p>

                                                            </li>

                                                        )
                                                })
                                                }
                                            </ul>
                                        </Col>
                                            */}
                                        <Col lg="8">
                                            {this.state.showForm ?
                                                (
                                                    <div className="admin-date-picker">
                                                        <FromToForm1
                                                            onSubmit={(data) => this.setState({timeData: data}, this.adminStatistics)}>
                                                        </FromToForm1>
                                                    </div>
                                                )
                                                :
                                                null
                                            }
                                        </Col>
                                        <Col lg="12" className="gallery-statistics">
                                            <h6>{'Statistika galerija'.translate(this.props.lang)}</h6>
                                            {
                                                this.state.sameTimestamp
                                                    ?
                                                    (
                                                        <div style={{
                                                            backgroundColor: '#F4F5FB',
                                                            padding: '20px',
                                                            borderRadius: '11px'
                                                        }}>
                                                            <h1>{'sameTime'.translate(this.props.lang)}</h1>
                                                        </div>
                                                    )
                                                    :
                                                    (
                                                        this.state.loadingData ? (
                                                            <div style={{backgroundColor: '#F4F5FB'}}><Loader/>
                                                            </div>
                                                        ) : (
                                                            <ul>
                                                                {this.state.adminStatistics.galleryVisits && this.state.adminStatistics.galleryVisits.map((item, idx) => {
                                                                    return (
                                                                        <li>
                                                                            {/*<h3>{Object.translate(item, 'name', this.props.lang)}</h3>*/}
                                                                            <p>{'Ukupan pregled slika: '.translate(this.props.lang)} {item.visits}</p>
                                                                            <ul>
                                                                                {
                                                                                    item.photos.map((photo) => {
                                                                                        return (
                                                                                            <li>
                                                                                                <img
                                                                                                    src={`${API_ENDPOINT}/photos/350x/` + photo.image}/>
                                                                                                <span
                                                                                                    className="name">{photo.name}</span>
                                                                                                <span
                                                                                                    className="count">{photo.visits}</span>
                                                                                            </li>
                                                                                        )
                                                                                    })
                                                                                }
                                                                            </ul>
                                                                        </li>

                                                                    )
                                                                })
                                                                }
                                                            </ul>
                                                        )
                                                    )
                                            }
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