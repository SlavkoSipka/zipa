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
import penIcon from '../../assets/svg/orders-pen.svg';
import trashIcon from '../../assets/svg/orders-trash.svg';
import { API_ENDPOINT } from '../../constants';


class CategoriesPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialData,
            categories: []
        };
    }

    componentDidMount() {

        window.scrollTo(0, 0);


        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }

        fetch(`${API_ENDPOINT}/faqCategories/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                items: result
            })
        })

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
                                <h2>{'FAQ Kategorija'.translate(this.props.lang)}</h2>
                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                    <li><Link>{'FAQ Kategorija'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>

                            <Col lg="12">
                                <div className="table">
                                    <div>
                                        <table>
                                            <tr>
                                                <th>{'Naziv'.translate(this.props.lang)}</th>
                                                <th>{'Pozicija'.translate(this.props.lang)}</th>

                                                <th>{'Akcije'.translate(this.props.lang)}</th>
                                            </tr>

                                            {
                                                this.state.items && this.state.items.length && this.state.items.map((item, idx) => {
                                                    return (
                                                        <tr>
                                                            <td>{Object.translate(item, 'name', this.props.lang)}</td>
                                                            <td>{item.position}</td>

                                                            <td>
                                                                <Link to={`/account/faqCategories/${item._id}`}><button><Isvg src={penIcon} /></button></Link>
                                                                <button onClick={() => {
                                                                    this.props.handleDelete(() => {
                                                                        fetch(`${API_ENDPOINT}/faqCategories/delete/` + item._id, {
                                                                            method: 'DELETE',
                                                                            headers: {
                                                                                Accept: 'application/json',
                                                                                //'Content-Type': 'multipart/form-data',
                                                                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                                                                            },
                                                                        }).then((res) => res.text()).then((img) => {
                                                                            fetch(`${API_ENDPOINT}/faqCategories/all`, {
                                                                                method: 'GET',
                                                                                headers: {
                                                                                    'Content-Type': 'application/json',
                                                                                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                                                                },
                                                                            }).then(res => res.json()).then((result) => {
                                                                                this.setState({
                                                                                    items: result
                                                                                })
                                                                            })

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

                                </div>                            </Col>

                        </Row>

                    </Container>

                </section>





            </div>
        );
    }
}

export default Page(CategoriesPage);