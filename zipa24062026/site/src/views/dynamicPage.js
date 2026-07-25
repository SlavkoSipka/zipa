import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import Page from '../containers/page';


import {
    Container,
    Row,
    Col,
} from 'reactstrap';


import BlogArticle from '../components/articles/blogArticle';

import rightArrow from '../assets/svg/right-arrow.svg';

import bg from '../assets/images/category-bg.jpg';




class DynamicPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            ...props.initialData
        };
    }

    init() {
        window.scrollTo(0, 0);

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, null, this.props.lang).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }

    }

    componentDidMount() {
        this.init()

    }

    componentDidUpdate(prevProps) {

        if (prevProps[0].location.pathname != this.props[0].location.pathname) {
            this.init();
        }
    }



    render() {

        return (
            <div className="contact-wrap">
                <div className="into-wrap">
                </div>




                <section className="section-dynamic">
                    <Container>
                        <Row>
                            <Col lg="12" className="page-top-wrapper">
                            <h2>{Object.translate(this.state.data, 'name', this.props.lang)}</h2>


                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    
        <li><Link to='/'>{Object.translate(this.state.data, 'name', this.props.lang)}</Link></li>

                                </ul>

                            </Col>

                            <Col lg="12" dangerouslySetInnerHTML={{ __html: Object.translate(this.state.data, 'content', this.props.lang) }}>
                            </Col>
                        </Row>
                    </Container>
                </section>


            </div>
        );
    }
}

export default Page(DynamicPage);