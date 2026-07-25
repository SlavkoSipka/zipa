import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';


import BlogArticle from '../../components/articles/blogArticle';


import rightArrow from '../../assets/svg/right-arrow.svg';

import moment from 'moment';
import Image from '../../components/image';



class BlogDetailPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

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

    componentDidUpdate(prevProps) {

        if (prevProps[0].location.pathname != this.props[0].location.pathname) {
            this.init();
        }
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
                                                <Link to={`/blog/${item.alias}`}>{item.name}</Link>

                                            )
                                        })

                                        :

                                        null*/
                                }
                            </Col>
                        </Row>

                    </Container>
                </div>

                <section className="blog-detail">
                    <Container>
                        <Row>
                            <Col lg="12" className="into">
                                <p className="category">{this.state.data && this.state.data.category}</p>
                                <h2>{this.state.data && this.state.data.title}</h2>
                                <p className="date">{this.state.data && moment.unix(this.state.data.published).format('DD.MM.YYYY | HH:mm')}</p>
                            </Col>
                            <Col lg="8">
                                {this.state.data && this.state.data.image ? <Image src={this.state.data && this.state.data.image} className="image" /> : null }
                                <div className="content" dangerouslySetInnerHTML={{ __html: this.state.data && this.state.data.content }}>
                                </div>
                            </Col>
                            <Col lg="4" className="blog-articles latest-articles">
                                <h3>Latest Tips & Articles</h3>
                                {
                                    this.props.latestBlog && this.props.latestBlog.map((item, idx) => {
                                        return (
                                            <BlogArticle
                                                {...item}
                                            />

                                        )
                                    })
                                }

                            </Col>
                        </Row>
                    </Container>
                </section>



            </div>
        );
    }
}

export default Page(BlogDetailPage);