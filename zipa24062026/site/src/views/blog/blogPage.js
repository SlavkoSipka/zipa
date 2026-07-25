import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';
import ReactPaginate from 'react-paginate';


import BlogArticle from '../../components/articles/blogArticle';


import rightArrow from '../../assets/svg/right-arrow.svg';



class BlogPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);
        this.getSearchParams = this.getSearchParams.bind(this);
        this.generateSearchLink = this.generateSearchLink.bind(this);

        this.state = {
            ...props.initialData
        };
    }


    init() {
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

    componentDidMount() {

        window.scrollTo(0, 0);
        this.init()
    }

    componentDidUpdate(prevProps) {


        if (prevProps[0].location.pathname != this.props[0].location.pathname || prevProps[0].location.search != this.props[0].location.search) {
            this.init();
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

        return (
            <div className="blog-wrap">
                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="5">
                                <h1>Čitajte naš blog</h1>
                                <p>Pregledajte najnovije članke i savjete s našeg bloga</p>
                            </Col>
                            <Col lg={{ size: 7 }} className="categories">
                                {/*
                                    this.state.categories && this.state.categories.length ?
                                        this.state.categories.map((item, idx) => {
                                            return (
                                                <Link className={this.props[0].match.params.category == item.alias ? 'active': null} to={`/blog/${item.alias}`}>{item.name}</Link>

                                            )
                                        })

                                        :

                                        null*/
                                }
                            </Col>
                        </Row>

                    </Container>
                </div>





                <section className="section-blog-articles">
                    <Container>
                        <Row className="blog-articles">
                            {
                                this.state.items && this.state.items.map((item, idx) => {
                                    return (
                                        <Col lg={idx < 2 ? 6 : 4}>
                                            <BlogArticle
                                                blogPage
                                                {...item}
                                            />
                                        </Col>

                                    )
                                })
                            }
                        </Row>
                        {this.state.total > 14 ?
                            < Row >
                                <Col lg="12">
                                    <ReactPaginate
                                        previousLabel={''}
                                        nextLabel={''}
                                        breakLabel={'...'}
                                        breakClassName={'break-me'}
                                        pageCount={this.state.total / 14}
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



                    </Container>
                </section>
            </div>
        );
    }
}

export default Page(BlogPage);