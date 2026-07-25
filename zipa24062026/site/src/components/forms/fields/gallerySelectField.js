import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';


import {
    Container,
    Row,
    Col,
} from 'reactstrap';

import penIcon from '../../../assets/svg/orders-pen.svg';
import trashIcon from '../../../assets/svg/orders-trash.svg';

import ReactPaginate from 'react-paginate';
import moment from 'moment';
import ToggleSwitch from '../../../components/forms/fields/toggleCheckbox';
import searchIcon from '../../../assets/svg/search-icon-btn.svg';
import { API_ENDPOINT } from '../../../constants';

class GalleriesPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            ...props.initialData,
            products: [],
            page: 0
        };
    }

    componentDidMount() {

        window.scrollTo(0, 0);
        this.init()

    }

    componentDidUpdate(prevProps) {

    }


    init = () => {
        let authToken = null;
        if (typeof localStorage !== 'undefined') {
            authToken = 'Bearer ' + localStorage.getItem('authToken');
        }

        const encodedSearchQuery = this.state.search ? encodeURIComponent(this.state.search) : null;

        fetch(`${API_ENDPOINT}/gallery/search/ba`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken
            },
            body: JSON.stringify({
                query: {
                    search: encodedSearchQuery,
                    page: this.state.page
                },
            })
        }).then(res => res.json()).then((result) => {
            this.setState({
                items: result.items,
                total: result.total
            })
        });
    }


    render() {

        return (
            <>
                <label className="table-label">{this.props.label}</label>
                <Row>
                    <Col lg={{ size: 6, offset: 6 }}>
                        <div className="search-wrap">
                            <input type="text" placeholder={'Unesite pojam za pretragu'.translate(this.props.lang)} value={this.state.search} onChange={(e) => this.setState({ search: e.target.value })} onKeyUp={(e) => {
                                if (e.keyCode == 13) {
                                    e.preventDefault();
                                    this.init();
                                }
                            }} />
                            <button className="button" onClick={() => {
                                this.init();
                            }}><Isvg src={searchIcon} /> {'PRETRAŽI'.translate(this.props.lang)}  </button>
                        </div>
                    </Col>
                </Row>

                <div className="table form-table">

                    <div>
                        <table>
                            <tr>
                                <th></th>
                                <th>{'Naziv'.translate(this.props.lang)}</th>
                                <th>{'Lokacija'.translate(this.props.lang)}</th>
                                <th>{'Akcije'.translate(this.props.lang)}</th>
                            </tr>

                            {
                                this.state.items && this.state.items.length && this.state.items.map((item, idx) => {
                                    return (
                                        <tr>
                                            <td><img src={`${API_ENDPOINT}/photos/350x/` + Object.get(item, `photos[0].image`)} /></td>
                                            <td>{Object.translate(item, 'name', this.props.lang)}</td>
                                            <td>{item.location}</td>

                                            <td>
                                                <ToggleSwitch onChange={() => {
                                                    let values = this.props.value;
                                                    if (typeof values === 'string') {
                                                        values = [];
                                                    }
                                                    if (!values) {
                                                        values = [];
                                                    }

                                                    let index = values.indexOf(item._id);

                                                    if (index !== -1) {
                                                        values.splice(index, 1);
                                                    } else {
                                                        values.push(item._id);
                                                    }


                                                    this.props.onChange(values);
                                                    this.forceUpdate()

                                                }} value={this.props.value ? this.props.value.indexOf(item._id) !== -1 ? true : false : false}></ToggleSwitch>
                                            </td>
                                        </tr>

                                    )
                                })
                            }
                        </table>
                    </div>

                    <ReactPaginate
                        previousLabel={''}
                        nextLabel={''}
                        breakLabel={'...'}
                        breakClassName={'break-me'}
                        pageCount={this.state.total}
                        marginPagesDisplayed={1}
                        pageRangeDisplayed={2}
                        onPageChange={(page) => { this.setState({ page: page.selected }, this.init) }}
                        containerClassName={'pagination'}
                        subContainerClassName={'pages pagination'}
                        activeClassName={'active'}
                    />




                </div>
            </>
        );
    }
}

export default GalleriesPage;