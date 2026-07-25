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
import ReactPaginate from 'react-paginate';


import Article from '../../components/articles/downloadArticle';
import BlogArticle from '../../components/articles/blogArticle';


import bg from '../../assets/images/category-bg.jpg';
import rightArrow from '../../assets/svg/right-arrow.svg';
import user from '../../assets/svg/user.svg';
import emptyCart from '../../assets/svg/empty-cart.svg';


import solution1 from '../../assets/images/solution1.png';
import { API_ENDPOINT } from '../../constants';


class DownloadsPage extends Component {
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
            params[brokenParams[i].split('=')[0]] = brokenParams[i].split('=')[1];
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
                paramsGroup.push(`${key}=${params[key]}`)
            }
        }


        return `?${paramsGroup.join('&')}`;
    }


    render() {
        let params = this.getSearchParams();

        return (
            <div className="account-wrap">
                <div className="into-wrap">
                </div>


                <a ref={(node) => this.aTag = node}></a>
                <section className="downloads-section">
                    <Container>
                        <Row>
                            <Col lg={this.state.items && this.state.items.length ? '9' : '12'} className="area">
                                <div className="top">
                                    <h2>{'Kupljene fotografije'.translate(this.props.lang)}</h2>

                                </div>

                                {this.state.items && this.state.items.length ?
                                    <>

                                        <Row className="articles">
                                            {
                                                this.state.items && this.state.items.map((article, idx) => {
                                                    return (
                                                        <Col lg={12}>
                                                            <Article
                                                                image={article.photo && article.photo.image}
                                                                name={Object.translate(article, 'name', this.props.lang)}
                                                                shortDescription={Object.translate(article, 'description', this.props.lang)}
                                                                alias={Object.translate(article, 'alias', this.props.lang)}
                                                                userAlias={article.userAlias}
                                                                imagesCount={article.photos && article.photos.length}
                                                                location={article.location}
                                                                resolution={article.resolution}
                                                                price={article.price}
                                                                published={article.published}
                                                                handleDownload={() => {
                                                                    fetch(`${API_ENDPOINT}/user/downloads/download-image/${article._id}`, {
                                                                        method: 'GET',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                                                        },
                                                                    }).then(res => res.json()).then((result) => {
                                                                        if (result.image) {
                                                                            var a = this.aTag;
                                                                            a.href = result.image; //Image Base64 Goes here
                                                                            a.download = article.photo.image.split('/').pop(); //File name Here
                                                                            a.click(); //Downloaded file


                                                                        }
                                                                    })

                                                                }}
                                                                listView={true}
                                                            ></Article>
                                                        </Col>

                                                    )
                                                })
                                            }
                                        </Row>
                                        {this.state.total > 20 ?
                                            <Row>
                                                <Col lg="12">
                                                    <ReactPaginate
                                                        previousLabel={''}
                                                        nextLabel={''}
                                                        breakLabel={'...'}
                                                        breakClassName={'break-me'}
                                                        pageCount={this.state.total / 20}
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

                                            :
                                            null
                                        }
                                    </>
                                    :
                                    <div className="no-items">
                                        <Isvg src={emptyCart} />
                                        <h6>{'Niste kupili nijednu fotografiju.'.translate(this.props.lang)}</h6>
                                        <p>{'Pretražite naš sajt i pronađite željene fotografije.'.translate(this.props.lang)}</p>
                                        <Link to='/'><button>{'Pretraži fotografije'.translate(this.props.lang)} <Isvg src={rightArrow} /> </button></Link>
                                    </div>

                                }


                            </Col>
                        </Row>
                    </Container>

                </section>




            </div>
        );
    }
}

export default Page(DownloadsPage);