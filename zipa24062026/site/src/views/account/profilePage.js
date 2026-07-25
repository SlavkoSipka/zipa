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
                                {this.props.uData && this.props.uData.userRole == 'photographer' ?
                                    <h2>{'Profil fotografa'.translate(this.props.lang)}</h2>
                                    :
                                    null
                                }
                                {this.props.uData && this.props.uData.userRole == 'agency' ?
                                    <h2>{'Profil firme'.translate(this.props.lang)}</h2>
                                    :
                                    null
                                }
                                {this.props.uData && (this.props.uData.userRole == 'legalPerson' || this.props.uData.userRole == 'admin' || this.props.uData.userRole == 'physicalPerson') ?
                                    <h2>{'Profil'.translate(this.props.lang)}</h2>
                                    :
                                    null
                                }


                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>

                            <Col lg="12">
                                {
                                    this.state.announcements.map((item, idx) => {
                                        return (
                                            <div className="alert">
                                                <Isvg
                                                    src={infoIcon}/> {Object.translate(item, 'content', this.props.lang)}
                                            </div>

                                        )
                                    })
                                }
                            </Col>

                            <Col lg="6" sm="6">
                                <div className="profile-info">
                                    <img
                                        src={this.props.uData.profilePhoto && this.props.uData.profilePhoto.indexOf('http') !== -1 ? this.props.uData.profilePhoto : userPhoto}/>
                                    <div>
                                        <h6>{'Dobrodošli'.translate(this.props.lang)}</h6>
                                        <h3>{this.props.uData.name}</h3>
                                        <button
                                            onClick={() => this.props.signOut()}>{'Izloguj se'.translate(this.props.lang)}</button>
                                    </div>

                                </div>
                                {
                                    this.props.uData && this.props.uData.userRole == 'admin' ?

                                        <div className="backup-buttons">
                                            <button onClick={() => {
                                                this.setState({
                                                    downloadBackup: true
                                                })
                                                /**/

                                            }
                                            }><Isvg src={backup}/> {'Preuzmite backup'.translate(this.props.lang)}
                                            </button>
                                            <button onClick={() => {

                                                this.setState({
                                                    removeOriginals: true
                                                })


                                                /* this.props.handleDelete(() => {
                                                     
 
                                                 })*/
                                            }}><Isvg src={trash}/> {'Ukonite originale'.translate(this.props.lang)}
                                            </button>
                                        </div>
                                        :
                                        null
                                }

                            </Col>

                            {this.props.uData && this.props.uData.userRole == 'photographer' ?
                                <>
                                    <Col lg={{size: 4, offset: 2}} className="sponsor profile-sponsor">
                                        <h6>{'GENERALNI SPONZOR'.translate(this.props.lang)}</h6>
                                        {this.props.sponsorBanner ?
                                            <div className="sponsor-banners-wrap">
                                                {
                                                    this.props.sponsorBanner.images.map((item, idx) => {
                                                        return (
                                                            <a href={item.link} target="_blank"
                                                               onClick={() => this.props.bannerClick(item.link)}>
                                                                <img key={idx} src={item.image}/>
                                                            </a>

                                                        )
                                                    })
                                                }
                                            </div>

                                            :
                                            null

                                        }
                                    </Col>

                                    <Col lg="12" className="profile-informations">
                                        <div>
                                            <h6><Isvg
                                                src={infoIcon}/> {'Informacije o nalogu'.translate(this.props.lang)}
                                            </h6>
                                            <ul>
                                                <li>
                                                    <span>{'Vrijeme poslednjeg logovanja:'.translate(this.props.lang)}</span><span>{moment.unix(this.props.uData.lastLoginTimestamp).format('DD.MM.YYYY HH:mm')} h</span>
                                                </li>
                                                <li>
                                                    <span>{'Na našem servisu imate:'.translate(this.props.lang)}</span><span>{this.props.uData && this.props.uData.photoCount} {'fotografija'.translate(this.props.lang)}</span>
                                                </li>

                                            </ul>
                                        </div>

                                    </Col>
                                    <Col lg="12" className="statistics-1">

                                        <div className="photos">
                                            <h6>{'Najgledanije fotografije'.translate(this.props.lang)}</h6>
                                            <ul>
                                                {
                                                    this.state.photographerStatistics?.map((item, idx) => {
                                                        return (
                                                            <li>
                                                                <label>{item.photo.name}</label>
                                                                <div>
                                                                    <div>
                                                                        <div
                                                                            style={{width: ((item.count * 100) / totalVisits) + '%'}}></div>
                                                                    </div>
                                                                    {((item.count * 100) / totalVisits).toFixed(2)}%
                                                                </div>
                                                            </li>

                                                        )
                                                    })
                                                }

                                            </ul>
                                            <Link
                                                to='/account/photo-visits'>{'Pogledaj detaljnije'.translate(this.props.lang)}</Link>
                                        </div>
                                    </Col>

                                </>
                                :
                                null
                            }
                            {this.props.uData && this.props.uData.userRole != 'admin' && this.props.uData.userRole != 'photographer' ?
                                <>
                                    <Col lg="6" className="buttons">
                                        <Link to='/account/edit'>
                                            <button>{'Ažuriranje profila'.translate(this.props.lang)}</button>
                                        </Link>
                                        <Link to='/account/change-password'>
                                            <button><Isvg src={lock}/> {'Promjena lozinke'.translate(this.props.lang)}
                                            </button>
                                        </Link>
                                    </Col>

                                    <Col lg="6">
                                        <Row>
                                            <Col lg="12" className="profile-informations">
                                                <div>
                                                    <h6><Isvg
                                                        src={infoIcon}/> {'Informacije o nalogu'.translate(this.props.lang)}
                                                    </h6>
                                                    <ul>
                                                        <li>
                                                            <span>{'Vrijeme poslednjeg logovanja:'.translate(this.props.lang)}</span><span>{moment.unix(this.props.uData.lastLoginTimestamp).format('DD.MM.YYYY HH:mm')} h</span>
                                                        </li>
                                                        <li>
                                                            <span>{'Možete besplatno preuzeti:'.translate(this.props.lang)}</span><span>{this.props.uData.freePhotos} {'fotografija'.translate(this.props.lang)}</span>
                                                        </li>

                                                    </ul>
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row className="statistics-1">
                                            <Col lg="6">
                                                <div className="block">
                                                    <div>
                                                        <h6>{'UKUPNO PREUZETO'.translate(this.props.lang)}</h6>
                                                        <h3>{this.props.uData && this.props.uData.totalDownloads} KM</h3>
                                                    </div>
                                                    <Isvg src={statIcon}/>
                                                </div>

                                            </Col>
                                            <Col lg="6">
                                                <div className="block">
                                                    <div>
                                                        <h6>{'PREUZETO OVAJ MJESEC'.translate(this.props.lang)}</h6>
                                                        <h3>{this.props.uData && this.props.uData.currMonthDownloads} KM</h3>
                                                    </div>
                                                    <Isvg src={statIcon}/>
                                                </div>

                                            </Col>


                                        </Row>

                                    </Col>


                                </>
                                :
                                null
                            }

                            {
                                this.props.uData && this.props.uData.userRole == 'admin' ?
                                    <>

                                        <Col lg="6" sm="6" className="profile-informations">
                                            <div>
                                                <h6><Isvg
                                                    src={infoIcon}/> {'Informacije o nalogu'.translate(this.props.lang)}
                                                </h6>
                                                <ul>
                                                    <li>
                                                        <span>{'Vrijeme poslednjeg logovanja:'.translate(this.props.lang)}</span><span>{moment.unix(this.props.uData.lastLoginTimestamp).format('DD.MM.YYYY HH:mm')} h</span>
                                                    </li>
                                                    <li>
                                                        <span>{'Na servisu imate:'.translate(this.props.lang)}</span><span> {this.state.adminStatistics.photosCount} {'fotografija'.translate(this.props.lang)}</span>
                                                    </li>
                                                    <li>
                                                        <span>{'Ukupno fotografa:'.translate(this.props.lang)}</span><span>{this.state.adminStatistics.photographersCount} </span>
                                                    </li>

                                                </ul>
                                            </div>
                                        </Col>

                                        <Col lg="12" className="statistics-1">

                                            <Row>
                                                <Col lg="4" sm="4">
                                                    <div className="block">
                                                        <div>
                                                            <h6>Promet danas</h6>
                                                            <h3>{this.state.adminStatistics.todayEarnings} KM</h3>
                                                        </div>
                                                        <Isvg src={statIcon}/>
                                                    </div>

                                                </Col>
                                                <Col lg="4" sm="4">
                                                    <div className="block">
                                                        <div>
                                                            <h6>Mjesečni promet</h6>
                                                            <h3>{this.state.adminStatistics.currentMonthEarnings} KM</h3>
                                                        </div>
                                                        <Isvg src={statIcon}/>
                                                    </div>

                                                </Col>
                                                <Col lg="4" sm="4">
                                                    <div className="block">
                                                        <div>
                                                            <h6>Ukupno preuzeto fotografija</h6>
                                                            <h3>{this.state.adminStatistics.totalDownloads}</h3>
                                                        </div>
                                                        <Isvg src={statIcon}/>
                                                    </div>

                                                </Col>
                                                <Col lg="4" sm="4">


                                                    <div className="block2">
                                                        <button onClick={() => {
                                                            this.props[0].history.push('/account/gallery-stats')
                                                        }
                                                        }> {'Statistika galerija'.translate(this.props.lang)}<Isvg
                                                            src={statIcon}/></button>
                                                    </div>

                                                </Col>


                                                <Col lg="4" sm="4">
                                                    <div className="block2">
                                                        <button onClick={() => {
                                                            this.props[0].history.push('/account/photographer-stats')

                                                        }
                                                        }> {'Statistika fotografa'.translate(this.props.lang)}<Isvg
                                                            src={statIcon}/></button>
                                                    </div>

                                                </Col>
                                                <Col lg="4" sm="4">
                                                    <Link to="/account/preview/2">

                                                        <div className="block2">
                                                            <button onClick={() => {
                                                                this.props[0].history.push('/account/today-visits')
                                                            }
                                                            }> {'Posjete danas'.translate(this.props.lang)}<Isvg
                                                                src={statIcon}/></button>
                                                        </div>
                                                    </Link>

                                                </Col>

                                            </Row>

                                        </Col>

                                        {/*
                                        <Col lg="8" sm="8" className="statistics-1">



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
                                                */}
                                        <Col lg="4" sm="4" className="statistics-3">


                                            <div className="transactions">
                                                <h6>{'Transakcije'.translate(this.props.lang)}</h6>
                                                <ul>
                                                    {
                                                        this.state.adminStatistics.lastTransactions.map((item, idx) => {

                                                            return (
                                                                <li key={idx}>
                                                                    <img
                                                                        src={item.user.profilePhoto && item.user.profilePhoto.indexOf('http') !== -1 ? item.user.profilePhoto : userPhoto}/>
                                                                    <div>
                                                                        <div>
                                                                            <h6>{item.user.name}</h6>
                                                                            <p>{item.user.userRole}</p>
                                                                        </div>
                                                                        <span>+{item.transaction.transaction.purchase_units[0].amount.total} KM</span>
                                                                    </div>
                                                                </li>

                                                            )
                                                        })
                                                    }
                                                </ul>
                                                <Link to='/account/download-logs'>
                                                    <button>{'Sve transakcije'.translate(this.props.lang)}</button>
                                                </Link>
                                            </div>
                                        </Col>

                                        <Col lg="8">
                                            {
                                                this.state.showForm ?
                                                    (
                                                        <div className="admin-date-picker">
                                                            <FromToForm1
                                                                onSubmit={(data) => this.setState({timeData: data}, this.adminStatistics)}></FromToForm1>
                                                        </div>
                                                    )
                                                    :
                                                    null
                                            }
                                            <div className="statistics-2">
                                                <h6>{'Posjeta po danima'.translate(this.props.lang)}</h6>
                                                <div>
                                                    {this.state.sameTimestamp ?
                                                        (<h1>{'sameTime'.translate(this.props.lang)}</h1>)
                                                        :
                                                        (
                                                            this.state.loadingData ? (
                                                                <div style={{
                                                                    height: 483,
                                                                    width: 670,
                                                                    display: "flex",
                                                                    justifyContent: "center"
                                                                }}>
                                                                    <Loader/>
                                                                </div>
                                                            ) : (
                                                                <Line
                                                                    data={{
                                                                        labels: this.state.adminStatistics.visitsPerDay.map((item) => moment.unix(item.timestamp).format('DD MMM')),
                                                                        datasets: [
                                                                            {
                                                                                label: 'POSJETA',
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
                                                                                data: this.state.adminStatistics.visitsPerDay.map((item) => item.count),
                                                                            }
                                                                        ]
                                                                    }}
                                                                    options={{
                                                                        responsive: true,
                                                                        maintainAspectRatio: false,
                                                                        legend: {
                                                                            display: false,
                                                                        },
                                                                        scales: {
                                                                            xAxes: [{
                                                                                gridLines: {
                                                                                    color: "rgba(0, 0, 0, 0)",
                                                                                    zeroLineWidth: 0,
                                                                                    drawBorder: false,
                                                                                }
                                                                            }],
                                                                            yAxes: [{
                                                                                gridLines: {
                                                                                    color: "rgba(255, 255, 255, 1)",
                                                                                    lineWidth: 2,
                                                                                    drawBorder: false,
                                                                                }
                                                                            }]
                                                                        }
                                                                    }}
                                                                />
                                                            )
                                                        )
                                                    }
                                                </div>
                                                <h6>
                                                    {
                                                        this.state.adminStatistics && this.state.adminStatistics.visitsPerDay ?
                                                            <>
                                                                Ukupan broj posjeta u zadatom periodu
                                                                je <span>{this.state.adminStatistics.sumVisitsPerDay}</span>

                                                            </>
                                                            :
                                                            null
                                                    }

                                                </h6>
                                            </div>
                                        </Col>

                                        {/* <Col lg="12" className="photographers-statistics">
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
                                    </>
                                    :

                                    null
                            }

                        </Row>
                    </Container>

                </section>

                {this.state.uploadedPictures ?
                    <div className="delete-modal">
                        <div>
                            <h6>Broj uploadovanih fotografija</h6>


                            <FromToForm onSubmit={(data) => {
                                this.setState({
                                    uploadedPictures: null
                                })
                                this.props[0].history.push("/account/preview/3");
                                // fetch('https://zipa-api.novamedia.agency/create-backup', {
                                //     method: 'POST',
                                //     headers: {
                                //         'Content-Type': 'application/json',
                                //         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                //     },
                                //     body: JSON.stringify(data)
                                // }).then(res => res.json()).then((result) => {
                                //     var a = this.aTag;
                                //     a.href = 'https://zipa-api.novamedia.agency' + result.photos
                                //     a.download = 'originals_' + moment().format('DD.MM.YYYY HH:mm:ss') + '.zip'
                                //     a.click(); //Downloaded file

                                //     setTimeout(() => {

                                //         var a1 = this.aTag1;
                                //         a1.href = 'https://zipa-api.novamedia.agency' + result.mongo
                                //         a1.download = 'mongo_' + moment().format('DD.MM.YYYY HH:mm:ss') + '.gz'
                                //         a1.click(); //Downloaded file

                                //     }, 1000);

                                // })
                            }} handleClose={() => this.setState({uploadedPictures: null})}></FromToForm>

                        </div>
                    </div>
                    :
                    null
                }
                {this.state.visitPerDay ?
                    <div className="delete-modal">
                        <div>
                            <h6>Posjete po danima</h6>


                            <FromToForm onSubmit={(data) => {
                                this.setState({
                                    visitPerDay: null
                                })
                                this.props[0].history.push("/account/preview/1");
                                // fetch('https://zipa-api.novamedia.agency/create-backup', {
                                //     method: 'POST',
                                //     headers: {
                                //         'Content-Type': 'application/json',
                                //         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                //     },
                                //     body: JSON.stringify(data)
                                // }).then(res => res.json()).then((result) => {
                                //     var a = this.aTag;
                                //     a.href = 'https://zipa-api.novamedia.agency' + result.photos
                                //     a.download = 'originals_' + moment().format('DD.MM.YYYY HH:mm:ss') + '.zip'
                                //     a.click(); //Downloaded file

                                //     setTimeout(() => {

                                //         var a1 = this.aTag1;
                                //         a1.href = 'https://zipa-api.novamedia.agency' + result.mongo
                                //         a1.download = 'mongo_' + moment().format('DD.MM.YYYY HH:mm:ss') + '.gz'
                                //         a1.click(); //Downloaded file

                                //     }, 1000);

                                // })
                            }} handleClose={() => this.setState({visitPerDay: null})}></FromToForm>

                        </div>
                    </div>
                    :
                    null
                }

                {this.state.downloadBackup ?
                    <div className="delete-modal">
                        <div>
                            <Isvg src={backup}/>
                            <h6>Preuzmite backup</h6>
                            <FromToForm onSubmit={(data) => {
                                this.setState({
                                    downloadBackup: null
                                })

                                fetch(`${API_ENDPOINT}/create-backup`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                    },
                                    body: JSON.stringify(data)
                                }).then(res => res.json()).then((result) => {
                                    var a = this.aTag;
                                    a.href = `${API_ENDPOINT}` + result.photos
                                    a.download = 'originals_' + moment().format('DD.MM.YYYY HH:mm:ss') + '.zip'
                                    a.click(); //Downloaded file

                                    setTimeout(() => {

                                        var a1 = this.aTag1;
                                        a1.href = `${API_ENDPOINT}` + result.mongo
                                        a1.download = 'mongo_' + moment().format('DD.MM.YYYY HH:mm:ss') + '.gz'
                                        a1.click(); //Downloaded file

                                    }, 1000);

                                })
                            }} handleClose={() => this.setState({downloadBackup: null})}></FromToForm>

                        </div>
                    </div>
                    :
                    null
                }
                {this.state.removeOriginals ?
                    <div className="delete-modal">
                        <div>
                            <Isvg src={trashIcon}/>
                            <h6>Uklonite originale</h6>
                            <FromToForm onSubmit={(data) => {
                                this.setState({
                                    removeOriginals: null
                                })
                                fetch(`${API_ENDPOINT}/delete-originals`, {
                                    method: 'POST',
                                    headers: {
                                        Accept: 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                                    },
                                    body: JSON.stringify(data)
                                }).then((res) => res.text()).then((result) => {

                                });
                            }} handleClose={() => this.setState({removeOriginals: null})}></FromToForm>

                        </div>

                    </div>
                    :
                    null
                }


            </div>
        );
    }
}

export default Page(ProfilePage);