import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';


import CategoryForm from '../../components/forms/announcementForm';
import BlogArticle from '../../components/articles/blogArticle';


import rightArrow from '../../assets/svg/right-arrow.svg';
import user from '../../assets/svg/user.svg';
import { API_ENDPOINT } from '../../constants';
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


class CategoryPage extends Component {
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

        fetch(`${API_ENDPOINT}/announcements/get/` + this.props[0].match.params.id, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            if (result.to) {
                let date = new Date(result.to * 1000);
                result.time = `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}:00`;
                //result.time = new Date();
            }

            this.setState({
                initialValues: result
            }, this.forceUpdate)
        })

        fetch(`${API_ENDPOINT}/announcements/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                categories: result
            })
        })
    }

    submit(data) {
        if (data.time) {
            let hour = 0;
            let minute = 0;
            hour = parseInt(data.time.split(':')[0])
            minute = parseInt(data.time.split(':')[1])

            let date = new Date(data.to * 1000);
            date.setHours(hour);
            date.setMinutes(minute);
            delete data.time;

            data.to = Math.floor(date.getTime() / 1000);
        }

        console.log(data);

        fetch(`${API_ENDPOINT}/announcements/update/` + this.props[0].match.params.id, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(data)
        }).then(res => res.json()).then((result) => {
            if (result.error) {
                this.setState({
                    error: result.error
                })
            } else {
                this.props[0].history.push('/account/announcements')
            }
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
                                <h2>{'Najave'.translate(this.props.lang)}</h2>
                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                    <li><Link>{'Najave'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>

                            <Col lg="12">
                                <CategoryForm initialValues={this.state.initialValues} onSubmit={this.submit} lang={this.props.lang} />
                                {this.state.error ? <p className="error">{this.state.error}</p> : null}
                            </Col>
                        </Row>

                    </Container>

                </section>



            </div>
        );
    }
}

export default Page(CategoryPage);