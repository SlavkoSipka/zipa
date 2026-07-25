import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import Page from '../containers/page';


import {
    Container,
    Row,
    Col,
} from 'reactstrap';


class ErrorPage extends Component {
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
                            <Col lg="12" className="error-404">
                                <h1>{'Greška'.translate(this.props.lang)} <span>404</span> <br/>{'Stranica nije pronadjena'.translate(this.props.lang)}</h1>
                                <Link to='/'>{'Vrati se na početnu'.translate(this.props.lang)}</Link>
                            </Col>
                        </Row>
                    </Container>
                </section>


            </div>
        );
    }
}

export default Page(ErrorPage);