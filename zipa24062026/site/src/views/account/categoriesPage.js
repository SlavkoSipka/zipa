import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';
import { API_ENDPOINT } from '../../constants';

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
import ToggleSwitch from '../../components/forms/fields/toggleCheckbox';


import save from '../../assets/svg/save.svg';
import user from '../../assets/svg/user.svg';
import penIcon from '../../assets/svg/orders-pen.svg';
import trashIcon from '../../assets/svg/orders-trash.svg';


class CategoriesPage extends Component {
    constructor(props) {
        super(props);
        this.submit = this.submit.bind(this);

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

        fetch(`${API_ENDPOINT}/all-cateogires`, {
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

    submit(data) {
        console.log(data);

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
                                <h2>{'Kategorije'.translate(this.props.lang)}</h2>
                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                    <li><Link>{'Kategorije'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>

                            <Col lg="12">
                                <div className="table">
                                    <div>
                                        <table>
                                            <tr>
                                                <th>{'Naziv'.translate(this.props.lang)}</th>
                                                <th>{'Broj fotografija'.translate(this.props.lang)}</th>
                                                <th>{'Vidljiva'.translate(this.props.lang)}</th>
                                                <th>{'Vidljiva na pocetnoj'.translate(this.props.lang)}</th>
                                                <th>{'Pozicija'.translate(this.props.lang)}</th>
                                                <th>{'Akcije'.translate(this.props.lang)}</th>
                                            </tr>

                                            {
                                                this.state.items && this.state.items.length && this.state.items.map((item, idx) => {
                                                    return (
                                                        <tr>
                                                            <td>{Object.translate(item, 'name', this.props.lang)}</td>
                                                            <td>{item.photosCount}</td>

                                                            <td><ToggleSwitch value={item.isVisible} onChange={() => {

                                                                let items = this.state.items;
                                                                items[idx].isVisible = !items[idx].isVisible
                                                                this.setState({ items }, () => {
                                                                    fetch(`${API_ENDPOINT}/categories/update/` + item._id, {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                                                        },
                                                                        body: JSON.stringify(item)
                                                                    }).then(res => res.json()).then((result) => {
                                                                        fetch(`${API_ENDPOINT}/all-cateogires`, {
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
                                                                    })
                                                                })


                                                            }} /></td>


                                                            <td><ToggleSwitch value={item.isVisibleOnHome} onChange={() => {

                                                                let items = this.state.items;
                                                                items[idx].isVisibleOnHome = !items[idx].isVisibleOnHome
                                                                this.setState({ items }, () => {
                                                                    fetch(`${API_ENDPOINT}/categories/update/` + item._id, {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                                                        },
                                                                        body: JSON.stringify(item)
                                                                    }).then(res => res.json()).then((result) => {
                                                                        fetch(`${API_ENDPOINT}/all-cateogires`, {
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
                                                                    })
                                                                })


                                                            }} /></td>

                                                            <td><div className="sort-field">
                                                                <input type="text" value={item.position} onChange={(e) => {
                                                                    let items = this.state.items;
                                                                    items[idx].position = parseInt(e.target.value);
                                                                    this.setState({ items })

                                                                }} />
                                                                <button onClick={() => {
                                                                    fetch(`${API_ENDPOINT}/categories/update/` + item._id, {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                                                        },
                                                                        body: JSON.stringify(item)
                                                                    }).then(res => res.json()).then((result) => {
                                                                        fetch(`${API_ENDPOINT}/all-cateogires`, {
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
                                                                    })

                                                                }}><Isvg src={save} /></button>
                                                            </div></td>

                                                            <td>
                                                                <Link to={`/account/categories/${item._id}`}><button><Isvg src={penIcon} /></button></Link>
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