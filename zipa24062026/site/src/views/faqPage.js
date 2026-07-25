import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import Page from '../containers/page';


import {
    Container,
    Row,
    Col,
} from 'reactstrap';
import { API_ENDPOINT } from '../constants';


class FaqPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            ...props.initialData,
            data: {
                items: []
            }
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
        fetch(`${API_ENDPOINT}/faq/${this.props[0].match.params.alias}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                data: result
            })
        })

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
                                <h2>{'Pomoć'.translate(this.props.lang)} | {Object.translate(this.state.data, 'name', this.props.lang)}</h2>


                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/help'>{'Pomoć'.translate(this.props.lang)}</Link></li>

                                </ul>

                            </Col>


                            {
                                this.state.data.items.map((item, idx) => {
                                    return (
                                        <Col lg="12" className="faq-item">
                                            <div>
                                                <h6>{Object.translate(item, 'name', this.props.lang)}</h6>
                                            </div>
                                            <p dangerouslySetInnerHTML={{ __html: Object.translate(item, 'content', this.props.lang).replace(/\n/g, '<br/>') }}></p>
                                        </Col>
                                    )
                                })
                            }
                        </Row>
                    </Container>
                </section>


            </div>
        );
    }
}

export default Page(FaqPage);