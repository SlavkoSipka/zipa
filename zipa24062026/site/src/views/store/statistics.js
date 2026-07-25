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

import rightArrow from '../../assets/svg/right-arrow.svg';
import cartIcon from '../../assets/svg/cart.svg';
import moment from 'moment';
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

const barData = {
    labels: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23',],
    datasets: [
        {
            label: 'My First dataset',
            backgroundColor: '#2F629C',
            borderColor: '#2F629C',
            borderWidth: 1,
            data: [65, 59, 80, 81, 56, 55, 40, 65, 59, 80, 81, 56, 55, 40, 65, 59, 80, 81, 56, 55, 100, 65, 59]
        }
    ]
};



class StoreStatisticsPage extends Component {
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


        window.Chart.elements.Rectangle.prototype.draw = function () {

            var ctx = this._chart.ctx;
            var vm = this._view;
            var left, right, top, bottom, signX, signY, borderSkipped, radius;
            var borderWidth = vm.borderWidth;
            // Set Radius Here
            // If radius is large enough to cause drawing errors a max radius is imposed
            var cornerRadius = 15;

            if (!vm.horizontal) {
                // bar
                left = vm.x - vm.width / 2;
                right = vm.x + vm.width / 2;
                top = vm.y;
                bottom = vm.base;
                signX = 1;
                signY = bottom > top ? 1 : -1;
                borderSkipped = vm.borderSkipped || 'bottom';
            } else {
                // horizontal bar
                left = vm.base;
                right = vm.x;
                top = vm.y - vm.height / 2;
                bottom = vm.y + vm.height / 2;
                signX = right > left ? 1 : -1;
                signY = 1;
                borderSkipped = vm.borderSkipped || 'left';
            }

            // Canvas doesn't allow us to stroke inside the width so we can
            // adjust the sizes to fit if we're setting a stroke on the line
            if (borderWidth) {
                // borderWidth shold be less than bar width and bar height.
                var barSize = Math.min(Math.abs(left - right), Math.abs(top - bottom));
                borderWidth = borderWidth > barSize ? barSize : borderWidth;
                var halfStroke = borderWidth / 2;
                // Adjust borderWidth when bar top position is near vm.base(zero).
                var borderLeft = left + (borderSkipped !== 'left' ? halfStroke * signX : 0);
                var borderRight = right + (borderSkipped !== 'right' ? -halfStroke * signX : 0);
                var borderTop = top + (borderSkipped !== 'top' ? halfStroke * signY : 0);
                var borderBottom = bottom + (borderSkipped !== 'bottom' ? -halfStroke * signY : 0);
                // not become a vertical line?
                if (borderLeft !== borderRight) {
                    top = borderTop;
                    bottom = borderBottom;
                }
                // not become a horizontal line?
                if (borderTop !== borderBottom) {
                    left = borderLeft;
                    right = borderRight;
                }
            }

            ctx.beginPath();
            ctx.fillStyle = '#1F1F1F';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = borderWidth;

            // Corner points, from bottom-left to bottom-right clockwise
            // | 1 2 |
            // | 0 3 |
            var corners = [
                [left, bottom],
                [left, top],
                [right, top],
                [right, bottom]
            ];

            // Find first (starting) corner with fallback to 'bottom'
            var borders = ['bottom', 'left', 'top', 'right'];
            var startCorner = borders.indexOf(borderSkipped, 0);
            if (startCorner === -1) {
                startCorner = 0;
            }

            function cornerAt(index) {
                return corners[(startCorner + index) % 4];
            }

            // Draw rectangle from 'startCorner'
            var corner = cornerAt(0);
            ctx.moveTo(corner[0], corner[1]);

            let nextCornerId = 0;
            let nextCorner;


            for (var i = 1; i < 4; i++) {
                corner = cornerAt(i);
                nextCornerId = i + 1;
                if (nextCornerId == 4) {
                    nextCornerId = 0
                }

                nextCorner = cornerAt(nextCornerId);

                let width = corners[2][0] - corners[1][0];
                let height = corners[0][1] - corners[1][1];
                let x = corners[1][0];
                let y = corners[1][1];

                var radius = cornerRadius;

                // Fix radius being too large
                if (radius > height / 2) {
                    radius = height / 2;
                } if (radius > width / 2) {
                    radius = width / 2;
                }

                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);




            }

            ctx.fill();



            ctx.beginPath();
            ctx.fillStyle = vm.backgroundColor;
            ctx.lineWidth = borderWidth;

            // Corner points, from bottom-left to bottom-right clockwise
            // | 1 2 |
            // | 0 3 |
            var corners = [
                [left, bottom],
                [left, top],
                [right, top],
                [right, bottom]
            ];

            // Find first (starting) corner with fallback to 'bottom'
            var borders = ['bottom', 'left', 'top', 'right'];
            var startCorner = borders.indexOf(borderSkipped, 0);
            if (startCorner === -1) {
                startCorner = 0;
            }

            // Draw rectangle from 'startCorner'
            var corner = cornerAt(0);
            ctx.moveTo(corner[0], corner[1]);

            nextCornerId = 0;
            nextCorner;


            for (var i = 1; i < 4; i++) {
                corner = cornerAt(i);
                nextCornerId = i + 1;
                if (nextCornerId == 4) {
                    nextCornerId = 0
                }

                nextCorner = cornerAt(nextCornerId);

                let width = corners[2][0] - corners[1][0];
                let height = corners[0][1] - corners[1][1];
                let x = corners[1][0];
                let y = corners[1][1] + 10;

                var radius = cornerRadius;

                // Fix radius being too large
                if (radius > height / 2) {
                    radius = height / 2;
                } if (radius > width / 2) {
                    radius = width / 2;
                }

                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);




            }

            ctx.fill();

        };


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
        console.log(this.state)


        let last7DaysData, hoursData;

        if (this.state.statisticsData) {
            last7DaysData = {
                labels: this.state.statisticsData.days.map((item) => { return moment.unix(item.timestamp).format('DD MMM') }),
                datasets: [
                    {
                        label: 'Pregled artikala po danima',
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
                        data: this.state.statisticsData.days.map((item) => { return item.count }),
                    }
                ]
            };

            hoursData = {
                labels: this.state.statisticsData.hours.map((item) => { return moment.unix(item.timestamp).format('HH') }),
                datasets: [
                    {
                        label: 'Pregled artikala po satima',
                        backgroundColor: '#2F629C',
                        borderColor: '#2F629C',
                        borderWidth: 1,
                        data: this.state.statisticsData.hours.map((item) => { return item.count }),
                    }
                ]
            };


        }
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
                                        <li >
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/settings`}>Podešavanja</Link>
                                        </li>
                                        <li>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/admins`}>Administratori</Link>
                                        </li>
                                        <li className="active">
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/statistics`}>Statistike</Link>
                                        </li>
                                        <li>
                                            <Link to={`/shop/${this.props[0].match.params.storeAlias}/products/new`}>DODAJ ARTIKAL</Link>
                                        </li>
                                    </ul>

                                    <div className="form-wrapper statistics-wrapper">
                                        <div className="top">
                                            <h3>Statistike Shop-a</h3>

                                        </div>
                                        <Container>
                                            <Row>
                                                <Col lg="4">
                                                    <div className="statistics-box">
                                                        <div className="head">
                                                            <h6>Narudžbe</h6>
                                                            <p>Ukupno do sada</p>
                                                        </div>
                                                        <div className="data">
                                                            <h6>{this.state.statisticsData && this.state.statisticsData.ordersCount}</h6>
                                                            <div><Isvg src={cartIcon} /></div>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col lg="4">
                                                    <div className="statistics-box">
                                                        <div className="head">
                                                            <h6>Artikli</h6>
                                                            <p>Ukupno za prodaju</p>
                                                        </div>
                                                        <div className="data">
                                                            <h6>{this.state.statisticsData && this.state.statisticsData.productsCount}</h6>
                                                            <div><Isvg src={cartIcon} /></div>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col lg="4">
                                                    <div className="statistics-box">
                                                        <div className="head">
                                                            <h6>Pregledi artikala</h6>
                                                            <p>Ukupno do sada</p>
                                                        </div>
                                                        <div className="data">
                                                            <h6>{this.state.statisticsData && this.state.statisticsData.productsVisitCount}</h6>
                                                            <div><Isvg src={cartIcon} /></div>
                                                        </div>
                                                    </div>
                                                </Col>

                                                <Col lg="8">
                                                    <div className="chart">
                                                        <h6>PREGLED ARTIKALA PO DANIMA</h6>
                                                        {this.state.statisticsData ?
                                                            <Line data={last7DaysData} options={{
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

                                                            }} />
                                                            :
                                                            null
                                                        }
                                                    </div>
                                                </Col>
                                                <Col lg="4">
                                                    <div className="latest-views">
                                                        <h6>POSLEDNJE POGLEDANO</h6>
                                                        {
                                                            this.state.statisticsData && this.state.statisticsData.lastVisitedProducts.map((item, idx) => {
                                                                return (
                                                                    <div className="item" key={idx}>
                                                                        <img src={item.productImage} />
                                                                        <p>{item.productName}</p>
                                                                    </div>

                                                                )
                                                            })
                                                        }
                                                    </div>
                                                </Col>
                                                <Col lg="8">
                                                    <div className="chart">
                                                        <h6>PREGLED ARTIKALA PO DANIMA</h6>
                                                        {this.state.statisticsData ?
                                                            <Bar data={hoursData} options={{
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
                                                                },
                                                                hover: {
                                                                    duration: 0
                                                                },
                                                                "animation": {
                                                                    "duration": 500,
                                                                    "onComplete": function () {
                                                                        var chartInstance = this.chart,
                                                                            ctx = chartInstance.ctx;

                                                                        ctx.font = window.Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, window.Chart.defaults.global.defaultFontStyle, window.Chart.defaults.global.defaultFontFamily);
                                                                        ctx.textAlign = 'center';
                                                                        ctx.textBaseline = 'bottom';
                                                                        ctx.fillStyle = '#fff';

                                                                        this.data.datasets.forEach(function (dataset, i) {
                                                                            var meta = chartInstance.controller.getDatasetMeta(i);
                                                                            meta.data.forEach(function (bar, index) {
                                                                                var data = dataset.data[index];
                                                                                if (window.innerWidth >= 768)
                                                                                    ctx.fillText(data, bar._model.x, bar._model.y + (320 - bar._model.y) / 2 + 10);
                                                                            });
                                                                        });
                                                                    }
                                                                },


                                                            }} />
                                                            :
                                                            null
                                                        }
                                                    </div>
                                                </Col>
                                                <Col lg="4">
                                                    <div className="svg-map">
                                                        <h6>MAPA POSJETA</h6>

                                                        <svg xmlns="http://www.w3.org/2000/svg" width="343" height="332.71" viewBox="0 0 343 332.71">
                                                            <g id="ba" transform="translate(0 0)">
                                                                <path id="BIH2224" d="M134.8,150.44l.549,1.646,1.509,2.744,1.612,1.784.583,1.3.1,1.612,1.063,1.921.24.48.789.96.48,2.607.926.96,1.509,1.784,1.509,1.441,2.2.137,2.435.171,2.435,3.876.48,1.887h.034l.069.377.48,1.749-2.572-.96-1.612-.96-2.2.171-.823,1.921-.24,3.224v4.013l.926,1.784v2.71h2.229l2.435.652,1.372,2.4L156,196.2l1.166,2.092,1.029.995,1.3,1.269v1.921l-.343,2.572-1.3,1.612-1.166,2.229-1.955.652-3.018.652h-2.435l-1.989.309-2.881,1.612-2.092,1.269-3.156,1.441h-2.3l-1.063-1.1-.583-1.475-2.092-.617-1.372,1.1-3.944,1.132h-4.528l-.892.343-3.944,1.887-2.813-2.5-4.253-4.974L97.515,194.344l-9.775-7.786L86.5,184.534l-.755-2.572-.309-2.058-.686-1.749-3.6-3.4-2.847-3.979-4.322-4.425-3.43-5.111-1.372-1.612-1.543-1.2L63.8,157.025l-.72-1.441L62.7,153.8l-1.132-1.886-.892-.343-2.3.171-.926-.1-.857-.48-.995-.789-1.681-1.681-1.3-2.161L50.7,141.762l-1.269-2.229-3.807-4.116-1.441-2.127-1.646-5.248-.823-3.842-.1-1.852.274-1.338.892-1.989.309-1.029.206-2.058v-.069l.514-.274.96-.446,2.229.343,1.029-.514.583-1.132,1.269-1.784,2.092-.172,3.156.172,1.955-.652,3.018-.309,2.916-1.132,4.287-.995,1.406-1.784,1.955-3.739.686-.446,2.71,2.3,2.5,2.47,3.773,3.156,5.385,3.67,2.367,1.955h2.161l1.372.343.995,1.578,1.132,2.264,1.646,2.984,3.121,1.063,1.646.172,1.989,1.921,3.533,2.641,4.493,2.435,4.15,2.47,2.641,1.063,1.372,2.607,2.024,1.406,1.989.515.515,3.156.1,3.842,1.269,1.578,2.4.514,8.129,1.406.034-.069Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH2225" d="M55.6,33.237l.789,1.3-.034.995L55.84,36.77l-1.989.892L49.7,39.068,48.329,41.4v2.127l.857,1.955,2.5,2.984,2.778.892,5.762.549,6.14.343,2.778.343,5.145.377,4.768.686,3.258.72,4.665,1.235,3.636,2.3,3.876,3.91,3.4,4.768.857,3.19v7.031l.515,1.441,2.264-.172.755,1.406.377,5.111v6.174l-.137,7.032-.892,2.127-1.612,4.562-3.773.172-4.9.343-5.008-1.921-6.14-2.3-5.282-1.578h-3.4l-1.749.172-.377,2.47.755,2.127,1.2,1.029-.686.446L68.7,107.187,67.3,108.971l-4.288.995L60.094,111.1l-3.018.309-1.955.652-3.156-.172-2.092.172L48.6,113.842l-.583,1.132-1.029.515-2.229-.343-.96.446-.514.274-.24-1.132-.96-.96-1.818-1.166L38.69,112.2l-.995-.034-.309.377.034-.96.583-.514.755-.48.514-.892-.034-1.886-.583-2.332L36.5,99.436,36.049,97l-.583-2.161L34.437,93.5l-1.852-.309L29.4,94.634l-1.818-.24-1.784-1.955.686-1.955L27.92,88.6l.377-1.612.72-.377.137-.1-.309-1.681L28.4,83.315l-.686-1.166-1.063-.514-2.127-.309-1.1-.377-.892-.583-1.166-1.749-.686-3.053-.926-1.338-.652-.069-.755.412-.72.206-.686-.686-.309-1.1-.206-1.269-.343-1.166-.583-.686-1.1-.069-.617.755-.48,1.063-.652.789-.755.274-1.578.1-.823.274-1.3.206-.755-.823L6.86,71.207l-.652-1.132L4.116,68.634l-.48-.617-2.2-3.7L.446,62.186l-.1-2.092,1.269-1.681L3.43,57.83l1.543-.72.412-2.161-.823-2.367L3.156,50.352l-1.2-2.5-.309-3.087.686-2.2,2.2-3.807.309-2.2L3.807,32.791l.034-2.3L5.9,25.142l.377-1.955-.309-7.374.069-.96.995-2.71L9.878,9.5l4.733-.789,8.4.24,2.024-.377.96.034,1.029.514.789,1.132-.069,1.1-.309.892-.069.583.789.583,1.921.412,1.1.823,1.338,2.264,1.852,4.836L35.912,23.8l8.026,8.026,2.47,1.544,3.327,1.475,3.258.72,2.127-.583.48-1.749Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH2226" d="M177.228,112.813l.789,1.818.96,2.813,1.681,1.784,1.818,2.229.309,2.229-.412,5.179.206,6.38,1.063,2.95,2.95,2.813,2.229,2.2,2.538-.412,1.509.274v1.784l.72,2.813.549,1.921,1.681,1.029h2.435l1.063,1.166.446,2.675.617,3.67h1.406l2.538-.137.755.72.206,1.784-.206,1.2.926,1.3v1.2h1.818l.755.858,2.092,3.567.755,1.749h1.063l1.029-.24.789.823.72,3.842.1,2.058-.412,1.166-1.166,1.166-1.921.755L208.887,182l-2.778,1.029-3.4.274-1.029,1.338-.446,1.475.034.034-2.47.549-3.087-.72L193.28,183.3l-.412-1.1-.96-2.4-.857-1.2-2.641-.274h-4.253l-2.744.72-2.23,1.921-3.4.412-2.984-.995-3.5-2.092-4.013-.995-2.229.412-1.818.583-2.229.309-2.435-1.475L154.8,176.1l-1.544-.377v.034h-.034l-.48-1.886-2.435-3.876-2.435-.171-2.2-.137-1.509-1.441-1.509-1.784-.926-.96-.48-2.607-.789-.96-.24-.48-1.063-1.921-.1-1.612-.583-1.3-1.612-1.784-1.509-2.744-.549-1.646.857-2.915.755-2.778.515-3.5-.892-4.733-4.63-5.934-2.161-3.327-1.509-4.047-1.372-4.219-.377-5.419-.377-7.374.617-3.533,2.161-.514,4.493.172,1.132,1.063,2.4.857,5.008.274h4.15l3.121.171,2.778,1.921,2.264,3.876,1.749,1.578,1.509,1.921,3.121.206h5.522l7.649-1.406,3.773.172.171-.137Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH2227" d="M165.395,270.936l-.926-1.1-12.725-8.472-1.372-1.578-.995-2.332-.755-2.47-.549-1.269-.926-.857-1.784-1.132L141.8,248.4l-3.4-5.214-1.989-6,1.681-10.153-1.406-3.121-2.71-1.852-8.506-1.3-5.111-2.881-1.921-1.784,3.945-1.887.892-.343H127.8l3.945-1.132,1.372-1.1,2.092.617.583,1.475,1.063,1.1h2.3l3.156-1.441,2.092-1.269,2.881-1.612,1.989-.309h2.435l3.018-.652,1.955-.652,1.166-2.229,1.3-1.612.343-2.572v-1.235l1.509-.377,2.058.172.617.995.686,1.1v3.361l.823,1.132.549.96V212.9l-.549.652H161l-.823.48-.1,1.612v.789l1.269.652,1.852-.172,1.3,2.058,1.578,2.881,1.989,1.3.48,1.578.926,2.092h.24l1.372.96,3.739.617.343,2.092.343,2.229.1,2.744,1.063,2.538,1.029,2.092.137.377.926,2.641v2.4H178.5l-4.973-.309-4.288-.652-1.989-.789-2.092-.172-.926.96-.206,2.092,1.166,3.5,2.2.48,2.675,3.018,1.166,3.5-.926,4.768-2.127,5.111-2.778,3.91Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH2228" d="M201.272,186.146l.72,1.132.858,3.464.137.617.686,3.121.652,1.612,1.475,1.441,3.293.755,2.641-.583,2.024.309,2.847,2.744.034.034,1.269,3.361.1,2.641.96.72,2.435.892,1.921,1.406.309.206,1.166.309,1.269.137.412-1.612.755-1.749,1.681.583,2.024.857h2.435l.857.206-.72.72-.343,3.121.48,4.665.755,3.979.892,3.979-.377,1.715H231.9l-8.678-.823-7.649.343H209.3l-6-.343-.652,2.572,2.161,3.464.377,3.979.24,7.752.24,10.839-.995,1.372-1.372,1.749-2.024,1.029L199.9,260.92l-.24,1.887.24,1.372,1.989.206.48.172,1.784.686,1.406,1.372-.274,4.562-.858,3.43-1.509,1.715-.892,1.886-.137,5.488.069.24.823,5.076,1.372,4.459,1.543,2.744.137.206,2.607,1.818,5.522,4.974,1.989,1.989,2.5,2.47.755,1.612.377.755,4.665,4.973,4.253,4.082,2.5,2.572,2.4.686.1,2.607-.412,5.591-1.784-2.607-.96-.72-2.367.137-4.768-1.612-2.915-1.578-15.3-10.359-4.768-3.053-2.058-1.749-3.773-4.288-2.127-1.646-3.087-.857-.96-.617-2.744-4.322-.171-1.372.1-2.881-.24-1.166-1.029-1.372-.789.034-.72.583-.686.412-1.852-.343-3.67-1.441-1.955-.412-1.921.48-1.2,1.235-1.1,1.715-.034-.034-8.472-5.214,1.544.069,2.367,1.063,1.475.412-1.3-1.269-1.955-1.166,4.733-.995,2.47-1.818-.309-3.327-.034-.034-2.675-6.346-2.675-3.156,2.778-3.91,2.127-5.111.926-4.768-1.166-3.5-2.675-3.018-2.2-.48-1.166-3.5.206-2.092.926-.96,2.092.171,1.989.789,4.288.652,4.973.309h.274v-2.4l-.926-2.641-.137-.377-1.029-2.092-1.063-2.538-.1-2.744-.343-2.229-.343-2.092-3.739-.617-1.372-.96h-.24l-.926-2.092-.48-1.578-1.989-1.3-1.578-2.881-1.3-2.058-1.852.172-1.269-.652v-.789l.1-1.612.823-.48h4.185l.549-.652v-4.322l-.549-.96-.823-1.132v-3.361l-.686-1.1-.617-.995L161,200.861l-1.509.377v-.686l-1.3-1.269-1.029-.995L156,196.2l-2.675-3.361-1.372-2.4-2.435-.652h-2.23v-2.71l-.926-1.784v-4.013l.24-3.224.823-1.921,2.2-.171,1.612.96,2.572.96-.48-1.749-.069-.377v-.034l1.544.377,1.784,1.029,2.435,1.475,2.229-.309,1.818-.583,2.23-.412,4.013.995,3.5,2.092,2.984.995,3.4-.412,2.23-1.921,2.744-.72h4.253l2.641.274.857,1.2.96,2.4.412,1.1,2.435,2.675,3.087.72,2.47-.549Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH2887" d="M266.271,54.949l1.269,5.111.48,4.973.652,2.127,2.5.172.1,2.127-.617,2.813-2.367,1.578-2.538,1.612-.995,1.406-.1,2.813.858,2.47,3.4,3.361,4.768,5.625,1.372,1.235H276.8l2.024-1.063,2.5-4.39,1.646-3.876,1.132-1.955,3.121-.686,3.121.686L291,83.04l.1,6.14v1.063l-.24,8.472-.755,1.749-2.264,1.921-1.509.617-2.5,2.127-2.264,1.406-3.5.172-3.876,1.063-1.132,2.984-1.646,2.264-2.641,1.578-1.989.377-.755,2.092.617,5.076,1.372,3.156,1.269,3.361.892,3.842-.514,4.185-1.887,3.67-.172.206-2.092-2.95h-4.871l-6.037.274-1.818-.72-.823-2.538H249.5l-1.887-.446-.446-.583v-3.533l-1.269-4.322-.72-4.287-1.715-1.475-2.984-1.509-2.092-.446-2.23-2.5-1.063-2.538v-2.229l-.652-2.367-1.269-.892-4.356.137-1.372-1.029-.857-2.538V99.024l-.1-2.984-.72-2.058V92.2l.1-2.4V88.22l4.013.171,4.528-1.029.514-2.847-.514-3.156-2.4-2.813-3.876-1.235-3.636-1.235-4.39-1.612-3.636-1.578-3.91-1.578-3.636-1.955-1.372-1.578V64.21l.617-2.092,3.533-.549,3.773-.343h6.894l3.5-.892,2.127-3.361,1.887-5.488,1.269-3.19,2.264-1.578,2.127-.892,5.522.274,3.018.857V51.21l.995,1.235,2.367.206L249.6,52.1l3.121-1.406,4.9.343,5.248,1.406,3.4,2.5Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH2889" d="M225.865,88.22V89.8l-.1,2.4v1.784l.72,2.058.1,2.984v5.042l.857,2.538,1.372,1.029,4.356-.137,1.269.892.652,2.367v2.229l1.063,2.538,2.23,2.5,2.092.446,2.984,1.509,1.715,1.475.72,4.287,1.269,4.322V133.6l.446.583,1.887.446h2.47l.823,2.538,1.818.72,6.037-.274h4.871l2.092,2.95-1.2,1.2-1.132,2.264-2.881,2.641-3.91,4.013-3.121,1.921-3.224.137-.515-.96-2.127-.446-1.475-1.029-.857-1.612-1.372-2.058-1.372-1.2-1.818-.309h-3.258l-.343.446-.96,1.2-1.166,2.2-1.475,1.2h-3.91l-1.063.892-.1,1.749.1,4.013-1.063,1.3-2.435,1.338-3.5.137-2.984-.137-2.641.892-.652,2.367v3.224l-.755,1.2-1.269.583H214.2l-1.063,1.029.206,1.166.172.206-1.029.24h-1.063l-.755-1.749-2.092-3.567-.755-.857h-1.818v-1.2l-.926-1.3.206-1.2-.206-1.784-.755-.72-2.538.137h-1.406l-.617-3.67-.446-2.675-1.063-1.166h-2.435l-1.681-1.029-.549-1.921-.72-2.813v-1.784l-1.509-.274-2.538.412-2.229-2.2-2.95-2.813-1.063-2.95-.206-6.38.412-5.179-.309-2.229-1.818-2.229-1.681-1.784-.96-2.813-.789-1.818,2.847-2.161,4.39-2.47,3.636-2.092,3.156-2.47,2.127-2.435.377-3.018V95.182l-.514-3.327-2.127-2.127L188.1,86.745l-1.886-3.533V80.4l1.509-3.533,3.156-6.448,2.984-.892,4.528.343,3.636.549,3.018,2.813,2.881,4.939,3.018,6.551,1.749,2.984,2.4.343,4.013.172h6.757Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH2890" d="M252.139,152.738l-.926.034-.617,2.538-2.641,2.264-2.641,2.092-.857,1.749-.137,2.95.514,4.356.24,3.67v3.842l-.755,1.544-1.372,1.235-2.641.343-2.4-.514-3.636-.343-1.132.686.274,2.435.24,2.778,2.367,4.185,1.132,2.058,2.4.206,3.773.171,2.744,1.372,3.636,1.578,4.356,3.258-1.3,1.441-.72,1.749-.274,1.475.034,1.029-2.95-1.338-2.916-1.372-2.127-2.092-2.5-1.715h-4.39l-.995,2.95-.377,5.008-.617,3.739-.686.652-.857-.206h-2.435l-2.024-.857-1.681-.583-.755,1.749-.412,1.612-1.269-.137-1.166-.309-.309-.206-1.921-1.406-2.435-.892-.96-.72-.1-2.641-1.269-3.361-.034-.034-2.847-2.744-2.024-.309-2.641.583-3.293-.755-1.475-1.441-.652-1.612-.686-3.121-.137-.617-.858-3.464-.72-1.132-.034-.034.446-1.475,1.029-1.338,3.4-.274L208.887,182l2.744-2.058,1.921-.755,1.166-1.166.412-1.166-.1-2.058-.72-3.842-.789-.823-.172-.206-.206-1.166,1.063-1.029h.926l1.269-.583.755-1.2v-3.224l.652-2.367,2.641-.892,2.984.137,3.5-.137,2.435-1.338,1.063-1.3-.1-4.013.1-1.749,1.063-.892h3.91l1.475-1.2,1.166-2.2.96-1.2.343-.446H242.6l1.818.309,1.372,1.2,1.372,2.058.858,1.612,1.475,1.029,2.127.446.515.96Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH2891" d="M283.97,190.125l1.989,2.092h2.024l2.881.857L292.373,195l.995,3.464-.48,1.749-2.778.514-2.127,2.264-2.881,2.264-3.91,1.715-2.881,1.372-3.5.549-4.63.686-2.778.686-5.9-.857-3.876-1.921-5.66-4.493-.172-.069-.034-1.029.274-1.475.72-1.749,1.3-1.441.309.206,2.127.343,3.258.172,1.612-1.544,1.509-2.95.892-4.013,1.749-2.264,3.91-.515,8.266.172,4.15.686,2.127,2.607Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH3153" d="M274.537,51.073l-.171.412L273.92,53.1l-2.573,2.264h-2.161V54.022l.274-2.47-.377-1.715-.96-.755-2.3-.172-1.749-.377-.274-2.675-2.264-2.3-3.773-2.092h-3.773l-3.533-1.338-3.5-2.641-2.675-3.259-1.235-1.338-.24-4.013.1-1.441.789.514,2.3.858,2.127.069-.171-1.749-.412-1.509.034-1.132,1.3-.514.686.034,1.441.343.686.034.583-.24,1.235-.755.583-.1.652.309.412.583.583,1.612.515.995.583.823.72.343.823-.446.274-.617.171-.755.274-.72.446-.48.583-.069.549.343.412.549,3.293,6.723,1.029,1.269,1.029.446,2.47.24.583.24.377.343.24.514.24.755.069.274v.652l.034.377.206.343.446.617.137.412L270.97,40.2l-1.886,1.441-.652,1.235.96,3.533,3.018,3.258,2.127,1.406Zm-34.231-25.9-.755,1.612-.514,2.881L236.876,30.8l-2.984,1.132-2.4.96-.686,1.715-.686,1.543-.377,1.132h-4.733l-1.886-.377L220.961,33.1l-1.887-2.092-1.612-1.338-1.612-.206-1.1-1.715-1.338-3.43-.137-.72.857.034,1.887-.412,1.544-.96.583-1.3.069-1.578.206-1.543.96-1.2,2.161-.48,2.092.858,3.979,2.881,1.338.583,6.174.514,1.681.789,1.509,1.269,1.989,2.127Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH4801" d="M213.277,23.6l.137.72,1.338,3.43,1.1,1.715,1.612.206,1.612,1.338,1.887,2.092,2.161,3.807,1.886.377h4.733l.377-1.132.686-1.543.686-1.715,2.4-.96,2.984-1.132,2.161-1.132.514-2.881.755-1.612,1.235,1.372,1.372.892-.1,1.441.24,4.013,1.235,1.338,2.675,3.259,3.5,2.641,3.533,1.338h3.773l3.773,2.092,2.264,2.3.274,2.675,1.749.377,2.3.171-1.852,5.865-3.4-2.5-5.248-1.406-4.9-.343L249.6,52.1l-2.161.549-2.367-.206-.995-1.235V46.957L241.06,46.1l-5.522-.274-2.127.892-2.264,1.578-1.269,3.19-1.886,5.488-2.127,3.361-3.5.892h-6.894l-3.773.343-3.533.549-.617,2.092v3.567l1.372,1.578,3.636,1.955,3.91,1.578,3.636,1.578,4.39,1.612,3.636,1.235,3.876,1.235,2.4,2.813.514,3.156-.514,2.847-4.528,1.029-4.013-.172h-6.757l-4.013-.172-2.4-.343-1.749-2.984-3.018-6.551-2.881-4.939-3.018-2.813-3.636-.549-4.528-.343-2.984.892L184.6,72.133l-3.258-1.681-2.092-4.185L176.4,58.516l-.1-7.306.96-4.219,2.607-2.5.034-6.174-1.818-5.557-.24-6,2.264-4.8,2.778,3.6,1.612,1.475,1.749.72.892-.1,2.572-1.1,2.4-.48.755-.412,1.441-1.338,5.351-6.448,1.3-.686,1.372-.034,1.406.789,4.836,4.39,1.955.892,1.681.343,1.063.034Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH4802" d="M180.109,21.952l-2.264,4.8.24,6,1.818,5.557-.034,6.174-2.607,2.5-.96,4.219.1,7.306,2.847,7.752,2.092,4.185,3.258,1.681,6.277-1.715-3.156,6.448L186.215,80.4v2.813l1.886,3.533,3.018,2.984,2.127,2.127.514,3.327v2.984l-.377,3.018-2.127,2.435-3.156,2.47-3.636,2.092-4.39,2.47-2.847,2.161-.172.137-3.773-.172-7.649,1.406h-5.522l-3.121-.206-1.509-1.921-1.749-1.578-2.264-3.876-2.778-1.921-3.121-.172h-4.15l-5.008-.274-2.4-.857-1.132-1.063-4.493-.172-2.161.514-.617,3.533.377,7.374.377,5.419,1.372,4.219,1.509,4.047,2.161,3.327,4.63,5.934.892,4.733-.514,3.5-.755,2.778-.857,2.915-.034.069-8.129-1.406-2.4-.515-1.269-1.578-.1-3.842-.514-3.156-1.989-.514-2.024-1.406-1.372-2.607-2.641-1.063-4.15-2.47-4.493-2.435-3.533-2.641-1.989-1.921-1.646-.172-3.121-1.063-1.646-2.984-1.132-2.264-.995-1.578-1.372-.343H88.082L85.716,114.6l-5.385-3.67-3.773-3.156-2.5-2.47-2.71-2.3-1.2-1.029-.755-2.127.377-2.47,1.749-.172h3.4l5.282,1.578,6.14,2.3L91.341,103l4.9-.343,3.773-.172,1.612-4.562.892-2.127.137-7.032V82.594l-.377-5.111-.755-1.406-2.264.171-.515-1.441V67.777l-.857-3.19-3.4-4.768-3.876-3.91-3.636-2.3L82.32,52.376l-3.258-.72-4.768-.686-5.145-.377-2.778-.343-6.14-.343-5.762-.549-2.778-.892-2.5-2.984-.857-1.955V41.4L49.7,39.068l4.15-1.406,1.989-.892.514-1.235.034-.995-.789-1.3.96-3.533,1.784-3.361.412-.995.172-1.475-.172-.789-.034-.72.652-1.132.823-.583,2.3-.72.96-.686,1.2-1.921,2.847-6.38,4.15-2.847,5.076.171,17.493,5.248,2.229-.309,1.1-.96.137-.926-.069-1.063.48-1.509.892-.858.995-.446.857-.583.48-1.406.72-.412.892-1.063.72-1.029.274-.549,2.4-2.058.72.72.72,2.607.1.995-.034,1.063.48.686,1.818-.171-.24-.892-.343-.823,1.3.48,1.063,1.3.926.652.823-1.578.343.96.137.72-.1.755-.377,1.029.549-.446,1.372-.892.549-.446,1.715,3.739,3.739,2.847,7.786,3.636.926-.549,4.185-.309.377-.549,1.681-3.7,3.4,2.264,1.646.686,2.881,1.886.823.686,1.2.686,1.612-.171,2.915-.926.206-.446.206-.755.412-.48.686.446.514.823.1.686-.274.72-.652.755,1.1.377,1.063-.172,2.092-1.1-.789,2.573-.48.789.652-.206,4.425-.583,1.921.206.96-.137,1.818-1.166,3.224-3.43,1.887-.995,2.915.172,2.607,1.475,2.367,2.332,2.127,2.778Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH4803" d="M274.537,51.073l1.441.96,2.71.892,7.477-.172.069,2.367-1.338.96-1.989.926-1.338,2.127-1.132,3.361L278.413,64l-4.39.377-1.338.96-1.509,1.989-2.5-.172-.652-2.127-.48-4.974-1.269-5.111,1.852-5.865.96.755.377,1.715-.274,2.47V55.36h2.161L273.92,53.1l.446-1.612.172-.412Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH4804" d="M304.138,92.781l-.995-2.024-1.852-2.5L298.479,86.3l-1.406-.412-2.127.789-2.435,1.715-1.406.789-.1-6.14-.652-1.955-3.121-.686-3.121.686-1.132,1.955-1.646,3.876-2.5,4.39L276.8,92.37h-1.749l-1.372-1.235-4.768-5.625-3.4-3.361-.858-2.47.1-2.813.995-1.406,2.538-1.612,2.367-1.578.617-2.813-.1-2.127,1.509-1.989,1.338-.96,4.39-.377,2.024-1.509,1.132-3.361,1.338-2.127,1.989-.926,1.338-.96-.069-2.367,2.641-.069.96-.309,2.813-.857,1.784-.274,1.441-.514,7.855-5.762,1.1-.24.549.72.343,1.063.446.583h.858l1.543-.686.892-.171,3.876.857.823-.137.72-.343h.789l1.749,1.681.857.309.892-.1.24-.137.034-.1.823.96.514.514.377.686.24,1.029.1,1.269-.309.343-.48.1-.377.583-3.087,14.92-.892,2.264-.858,1.3-1.749,1.475-.96.995-.652,1.166-1.269,3.7-4.116,7.031-.412.412-.926.549-.446.583-.172.823.069,1.955-.171.892-.48.96Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH4805" d="M304.138,92.781l-.583.857-.686.583-3.087,1.029-.24,1.921,1.406,5.454-.172,3.361-1.029,1.818-1.235,1.543-.72,2.573.137,2.332.686,2.435,1.955,4.219,1.578,1.921,1.749.823,3.773.823,1.818.926.755.24,1.269.069,2.813-.686.995.206,1.509,1.235,1.509,2.229,1.1,2.641.171,2.47.549,1.578L321.8,137.1l3.842,2.847.926.96.617.343.515-.137.995-1.029h.514l.755.96.206,2.2.549.755,1.338,1.3,2.092,3.053,2.881,1.681,1.406,1.749.823.686.309-.343.549-.755.789-.274,1.1.995.652,2.3-.755,1.989-1.475,1.681-3.6,2.71-2.092.755-2.161.172-4.973-.48-4.665.309-1.3.412-1.269.069-1.132-.72-2.264-2.127-2.229-1.578-1.166-.446-1.269.1-1.818.583-.755.686-.48,1.132v.892l.446,1.509-.206.892-.995.96,1.029.652-1.406,3.773-4.287-4.973-4.288-4.459-10.667-5.934-8.541-5.454-7.477-1.955-7.58-1.509,1.132-2.264,1.2-1.2.172-.206,1.886-3.67.515-4.185-.892-3.842L268.02,125.3l-1.372-3.156-.617-5.076.755-2.092,1.989-.377,2.641-1.578,1.646-2.264,1.132-2.984,3.876-1.063,3.5-.172,2.264-1.406,2.5-2.127,1.509-.617,2.264-1.921.755-1.749.24-8.472V89.18l1.406-.789,2.435-1.715,2.127-.789,1.406.412,2.813,1.955,1.852,2.5.995,2.024Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH4806" d="M234.921,208.1l.617-3.739.377-5.008.995-2.95h4.39l2.5,1.715,2.127,2.092,2.916,1.372,2.95,1.338-2.641,2.367-3.43.377h-3.979l-3.43,3.156-3.4-.72Zm49.049-17.973-2.127-2.607-4.15-.686-8.266-.172-3.91.514-1.749,2.264-.892,4.013-1.509,2.95-1.612,1.543-3.258-.171-2.127-.343-.309-.206-4.356-3.258-3.636-1.578-2.744-1.372-3.773-.172-2.4-.206-1.132-2.058-2.367-4.185-.24-2.778-.274-2.435,1.132-.686,3.636.343,2.4.514,2.641-.343,1.372-1.235.755-1.544v-3.842l-.24-3.67-.514-4.356.137-2.95.857-1.749,2.641-2.092,2.641-2.264.617-2.538.926-.034,3.224-.137,3.121-1.921,3.91-4.013,2.881-2.641,7.58,1.509,7.477,1.955,8.541,5.454,10.667,5.934,4.287,4.459,4.288,4.973-.755,1.955.72,6.414-.343,4.425,1.784,4.939-1.784,2.95-3.91-.48-2.847-1.989-6.414-1.475-6.037,1.989-4.562,3.087Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH4807" d="M258.931,251.659l-2.778-1.852-3.91-2.435-7.134-6.346-4.973.96-3.533-2.435-2.847,1.475-2.5-2.95,1.406-5.385-.755-5.762h3.018l.377-1.715-.892-3.979-.755-3.979-.48-4.665.343-3.121.72-.72.686-.652,3.4.72,3.43-3.156h3.979l3.43-.377,2.641-2.367.172.069,5.659,4.493L261.5,209.4l5.9.857,2.778-.686,4.63-.686,3.5-.549,2.881-1.372,3.91-1.715,2.881-2.264,2.127-2.264,2.778-.515.48-1.749L292.373,195l-1.509-1.921-2.881-.857h-2.024l-1.989-2.092,4.562-3.087,6.037-1.989,6.414,1.475,2.847,1.989,3.91.48,1.784-2.95L307.74,181.1l.343-4.425-.72-6.414.755-1.955,1.406-3.773,3.018,2.332,2.675,3.464,4.7,7.615,8.952,9.741,1.749,3.979,2.127,6.757.137,3.224-2.264,2.2-.377,1.441-.137,1.749.1,1.681.412,1.3.652.583.24.549-.206.515-.686.446-3.293-1.338-1.063.069-1.1,2.641-.755,1.029-.686-1.063-.755-2.024-1.235-2.332-1.475-1.921-1.475-.892-.96.274-2.024,1.612-1.029.617-1.029.034-2.229-.377-.96.274-1.235,2.024-.823,2.71-1.029,2.058H305.51l-4.185-.652-2.2.24-2.332,2.813-1.715.686-1.887.069-1.475-.549-1.166-1.441-.926-1.784-1.235-1.235-1.989.206-1.3.96-2.092,2.332-1.612.823-.823.617-.515.995.034.995.858.652,1.338.377.652.377,1.166,1.852-.069.789-.377.995v.617l1.921-.514.617.48,3.053,4.013,2.607,7.272,2.641,5.042-.652.549-2.3.137-.995.549-.686.892-.549,1.063-.686,1.029-.926.823-.309-.72-1.784-2.3-.789-1.372-.206-.995.069-.857-.069-.858L284,239.62l-2.332-1.646-2.127-.617-5.248.48-1.612.789.309.48.48,1.1.309.48-2.332.755L260.268,249.7l-1.338,1.955Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                                <path id="BIH4808" d="M231.9,226.929l.755,5.762-1.406,5.385,2.5,2.95,2.847-1.475,3.533,2.435,4.974-.96,7.134,6.345,3.91,2.435,2.778,1.852,2.127,1.063-3.807,5.316-1.406,3.053-.755,3.876.069,3.121,1.543,9.158-3.567-.514-5.214.069-4.9,1.132-2.641,2.538-1.681,4.7.034,2.092.892,2.4,2.058,4.185.514,2.3-.652,1.166-1.1.857-.857,1.338.069,2.092.823,2.847,1.2,2.881L244.7,312.3l1.784,1.852,1.509,1.955.926,3.293-.034,3.464-.995,2.47-1.852,1.818-2.675,1.578.617,1.166.172,1.1-.309.72-.926.1-.96-.617-1.029-.1-.995.446-.892.823-1.441-.514-3.156-.343-1.269-.857-.069-.1.412-5.591-.1-2.607-2.4-.686-2.5-2.572-4.253-4.082-4.665-4.973-.377-.755-.755-1.612-2.5-2.47-1.989-1.989-5.522-4.974-2.607-1.818-.137-.206-1.544-2.744-1.372-4.459-.823-5.076-.069-.24.137-5.488.892-1.887,1.509-1.715.857-3.43.274-4.562-1.406-1.372-1.784-.686-.48-.171-1.989-.206-.24-1.372.24-1.887,1.372-2.058,2.024-1.029,1.372-1.749.995-1.372-.24-10.839-.24-7.752-.377-3.979-2.161-3.464.652-2.573,6,.343h6.277l7.649-.343,8.678.823Z" fill="#7c7c7c" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.686" />
                                                            </g>
                                                        </svg>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Container>


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

export default Page(StoreStatisticsPage);