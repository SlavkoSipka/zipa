import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import Page from '../containers/page';


import {
    Container,
    Row,
    Col,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    UncontrolledDropdown
} from 'reactstrap';


import Article from '../components/articles/article';
import BlogArticle from '../components/articles/blogArticle';

import rightArrow from '../assets/svg/right-arrow.svg';
import downArrow from '../assets/svg/down-arrow.svg';

import grid from '../assets/svg/grid.svg';
import list from '../assets/svg/list.svg';
import filterIcon from '../assets/svg/filters.svg';

import ReactPaginate from 'react-paginate';


class StoresPage extends Component {
    constructor(props) {
        super(props);
        this.getSearchParams = this.getSearchParams.bind(this);
        this.generateSearchLink = this.generateSearchLink.bind(this);

        this.state = {
            ...props.initialData
        };
    }

    componentDidMount() {

        window.scrollTo(0, 0);

        let searchParams = this.getSearchParams();
        if (searchParams.search) {
            this.setState({
                search: searchParams.search
            })
        }

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, this.getSearchParams()).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }
    }

    componentDidUpdate(prevProps) {

        console.log(this.props[0].location.search)

        if (prevProps[0].location.pathname != this.props[0].location.pathname || prevProps[0].location.search != this.props[0].location.search) {
            for (let i = 0; i < this.props.loadData.length; i++) {
                this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, this.getSearchParams()).then((data) => {
                    this.setState({
                        ...data
                    }, () => {
                        this.props.updateMeta(this.props.generateSeoTags(this.state));
                    })
                })
            }

        }
    }

    getSearchParams() {
        let brokenParams = this.props[0].location.search.replace('?', '').split('&');
        let params = {};
        for (let i = 0; i < brokenParams.length; i++) {
            params[brokenParams[i].split('=')[0]] = decodeURIComponent(brokenParams[i].split('=')[1]);
        }

        if (params.tags) {
            params.tags = params.tags.split(',');
        }

        if (params['compatible-with']) {
            params['compatible-with'] = params['compatible-with'].split(',');
        }

        return params;
    }

    generateSearchLink(name, value, isValueArray) {
        let params = this.getSearchParams();

        if (!value) {
            delete params[name];
        } else {
            if (isValueArray) {
                if (!params[name]) {
                    params[name] = [];
                }


                if (params[name].indexOf(value) !== -1) {
                    params[name].splice(params[name].indexOf(value), 1);
                } else {
                    params[name].push(value);
                }
                params[name] = params[name].join(',');
            } else {
                params[name] = value;
            }
        }


        let paramsGroup = [];
        for (var key in params) {
            if (params.hasOwnProperty(key) && params[key]) {
                if (key && params[key])
                    paramsGroup.push(`${key}=${params[key]}`)
            }
        }


        return `?${paramsGroup.join('&')}`;
    }


    render() {
        let params = this.getSearchParams();
        console.log(params);
        return (
            <div className="stores-wrap">
                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="6">
                                <h1>Lista Shopova</h1>
                                <h2>Dostavljamo brzo!</h2>
                                <button className="scroll-down">
                                    <Isvg src={downArrow} />
                                </button>
                            </Col>
                            <Col lg={{ size: 6 }}>
                                <h5>Pretražite Shop-ove</h5>
                                <div className="search-wrap">
                                    <input type="text" placeholder="Unesite ime Web Shop-a" value={this.state.search} onChange={(e) => this.setState({ search: e.target.value })} onKeyUp={(e) => {
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


                <section className="stores-section">
                    <Container>
                        <Row>
                            <Col lg="12">
                                <h3><span>25</span> aktivnih Web Shop-ova</h3>
                                <div className="letters">
                                    <Link to='/shopovi'><button className={!params.letter ? 'active' : ''}>Svi</button></Link>
                                    <Link to='/shopovi?letter=A'><button className={params.letter == 'A' ? 'active' : ''}>A</button></Link>
                                    <Link to='/shopovi?letter=B'><button className={params.letter == 'B' ? 'active' : ''}>B</button></Link>
                                    <Link to='/shopovi?letter=C'><button className={params.letter == 'C' ? 'active' : ''}>C</button></Link>
                                    <Link to='/shopovi?letter=D'><button className={params.letter == 'D' ? 'active' : ''}>D</button></Link>
                                    <Link to='/shopovi?letter=E'><button className={params.letter == 'E' ? 'active' : ''}>E</button></Link>
                                    <Link to='/shopovi?letter=F'><button className={params.letter == 'F' ? 'active' : ''}>F</button></Link>
                                    <Link to='/shopovi?letter=G'><button className={params.letter == 'G' ? 'active' : ''}>G</button></Link>
                                    <Link to='/shopovi?letter=H'><button className={params.letter == 'H' ? 'active' : ''}>H</button></Link>
                                    <Link to='/shopovi?letter=I'><button className={params.letter == 'I' ? 'active' : ''}>I</button></Link>
                                    <Link to='/shopovi?letter=J'><button className={params.letter == 'J' ? 'active' : ''}>J</button></Link>
                                    <Link to='/shopovi?letter=K'><button className={params.letter == 'K' ? 'active' : ''}>K</button></Link>
                                    <Link to='/shopovi?letter=L'><button className={params.letter == 'L' ? 'active' : ''}>L</button></Link>
                                    <Link to='/shopovi?letter=M'><button className={params.letter == 'M' ? 'active' : ''}>M</button></Link>
                                    <Link to='/shopovi?letter=N'><button className={params.letter == 'N' ? 'active' : ''}>N</button></Link>
                                    <Link to='/shopovi?letter=O'><button className={params.letter == 'O' ? 'active' : ''}>O</button></Link>
                                    <Link to='/shopovi?letter=P'><button className={params.letter == 'P' ? 'active' : ''}>P</button></Link>
                                    <Link to='/shopovi?letter=R'><button className={params.letter == 'R' ? 'active' : ''}>R</button></Link>
                                    <Link to='/shopovi?letter=S'><button className={params.letter == 'S' ? 'active' : ''}>S</button></Link>
                                    <Link to='/shopovi?letter=T'><button className={params.letter == 'T' ? 'active' : ''}>T</button></Link>
                                    <Link to='/shopovi?letter=U'><button className={params.letter == 'U' ? 'active' : ''}>U</button></Link>
                                    <Link to='/shopovi?letter=V'><button className={params.letter == 'V' ? 'active' : ''}>V</button></Link>
                                    <Link to='/shopovi?letter=W'><button className={params.letter == 'W' ? 'active' : ''}>W</button></Link>
                                    <Link to='/shopovi?letter=X'><button className={params.letter == 'X' ? 'active' : ''}>X</button></Link>
                                    <Link to='/shopovi?letter=Y'><button className={params.letter == 'Y' ? 'active' : ''}>Y</button></Link>
                                    <Link to='/shopovi?letter=Z'><button className={params.letter == 'Z' ? 'active' : ''}>Z</button></Link>
                                </div>
                            </Col>

                            {
                                this.state.items && this.state.items.map((item, idx) => {
                                    return (
                                        <Col lg="3" xs="12">
                                            <Link to={`/shop/${item.alias}`}>
                                                <div className="store-item">
                                                    <img src={item.profilePhoto} />
                                                    <div>
                                                        <h6>{item.name}</h6>
                                                        <p>{item.articleCount} artikala</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        </Col>
                                    )
                                })
                            }
                        </Row>
                        < Row >
                            <Col lg="12">
                                <ReactPaginate
                                    previousLabel={''}
                                    nextLabel={''}
                                    breakLabel={'...'}
                                    breakClassName={'break-me'}
                                    pageCount={this.state.total}
                                    marginPagesDisplayed={1}
                                    pageRangeDisplayed={2}
                                    onPageChange={(page) => { this.props[0].history.push(this.generateSearchLink('page', page.selected)) }}
                                    containerClassName={'pagination'}
                                    subContainerClassName={'pages pagination'}
                                    activeClassName={'active'}
                                    hrefBuilder={(page) => { return this.generateSearchLink('page', page) }}

                                />

                            </Col>

                        </Row>
                    </Container>

                </section>

            </div>
        );
    }
}

export default Page(StoresPage);