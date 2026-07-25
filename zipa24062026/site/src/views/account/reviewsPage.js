import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


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

import star from '../../assets/svg/star.svg';
import fullStar from '../../assets/svg/full-star.svg';

import moment from 'moment';
import { API_ENDPOINT } from '../../constants';


class ReviewsPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);
        this.deleteReview = this.deleteReview.bind(this);

        this.state = {
            ...props.initialData
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


    deleteReview(alias) {
        fetch(`${API_ENDPOINT}/user/reviews/delete/${alias}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.init();
        })


    }

    render() {

        return (
            <div className="account-wrap">
                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="4" className="user-info">
                                <Isvg src={user} />
                                <div>
                                    <h1>Moj nalog</h1>
                                    <p className="email">{this.props.uData && this.props.uData.email}</p>
                                    <button onClick={() => this.props.signOut()}>Izloguj se</button>
                                </div>
                            </Col>
                            <Col lg={{ size: 8 }} className="user-nav">
                                <Link to='/account/orders'><button >MOJE NARUDŽBE</button></Link>
                                <Link to='/account/edit'><button>PODEŠAVANJA</button></Link>
                                <Link to='/account/reviews'><button className="active">OCJENE</button></Link>
                                {this.props.uData && this.props.uData.permissions && this.props.uData.permissions.indexOf('*') !== -1 ? <Link to='/account/categories'><button >ADMINISTRACIJA</button></Link> : null}

                            </Col>
                        </Row>

                    </Container>
                </div>


                <section className="reviews-section">
                    <Container>
                        <Row>
                            <Col lg="12" className="area">
                                <div className="top">
                                    <h2>Ocjene</h2>
                                </div>






                            </Col>

                            {
                                this.state.items && this.state.items.length ?
                                    this.state.items.map((item, idx) => {
                                        return (
                                            <Col lg="6">
                                                <div className="review">
                                                    <div className="review-top">
                                                        <h6>{item.productName}</h6>
                                                        <span>{moment.duration(-(Math.floor(new Date().getTime() / 1000) - item.timestamp), 'seconds').humanize()} ago</span>

                                                    </div>
                                                    <div className="rating">
                                                        <Isvg src={item.rating >= 0.5 ? fullStar : star} />
                                                        <Isvg src={item.rating >= 1.5 ? fullStar : star} />
                                                        <Isvg src={item.rating >= 2.5 ? fullStar : star} />
                                                        <Isvg src={item.rating >= 3.5 ? fullStar : star} />
                                                        <Isvg src={item.rating >= 4.5 ? fullStar : star} />
                                                        <span> Edit Your rate </span>

                                                    </div>
                                                    {item.comment ? <p>{item.comment}</p> : null}

                                                    <div className="buttons-wrap">
                                                        <button className="delete-button" onClick={() => this.deleteReview(item.productAlias)}>Delete Review</button>
                                                        <Link to={`/solution/${item.productAlias}/reviews`}>   <button className="update-button">Update Review <Isvg src={rightArrow} /></button></Link>

                                                    </div>
                                                </div>

                                            </Col>

                                        )
                                    })
                                    :
                                    <Col lg="12">
                                        <div className="no-items">
                                            <Isvg src={star} />
                                            <h6>Nemate ostavljenih ocjena</h6>
                                            <p>Pretražite naš sajt i pronađite željene artikle.</p>
                                            <Link to='/'><button>Pretraži artikle <Isvg src={rightArrow} /> </button></Link>
                                        </div>
                                    </Col>
                            }

                        </Row>
                    </Container>

                </section>




            </div>
        );
    }
}

export default Page(ReviewsPage);