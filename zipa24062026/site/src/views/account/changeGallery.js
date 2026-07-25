import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';


import Form from '../../components/forms/galleryForm';
import BlogArticle from '../../components/articles/blogArticle';


import rightArrow from '../../assets/svg/right-arrow.svg';
import user from '../../assets/svg/user.svg';
import sponsor from '../../assets/images/sponsor.png';
import { API_ENDPOINT } from '../../constants';


class ChangeGallery extends Component {
    constructor(props) {
        super(props);
        this.submit = this.submit.bind(this);

        let initialValues = null;
        if (props[0].match.params.id == 'new') {
            initialValues = {
                description: { ba: `\n\n(ZIPAPHOTO/${this.props.uData.name})`, en: `\n\n(ZIPAPHOTO ${this.props.uData.name})` },
                isActive: true,
                price: 20,
                date: Math.floor(new Date().getTime() / 1000)
            }

        }


        this.state = {
            ...props.initialData,
            initialValues
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


        fetch(this.props[0].match.params.uid ? `${API_ENDPOINT}/gallery/photographer/fetch/${this.props[0].match.params.uid}/${this.props[0].match.params.id}` : `${API_ENDPOINT}/gallery/fetch/${this.props[0].match.params.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {

            this.setState({
                initialValues: result
            })
        })


    }

    submit(data) {
        let dataForm = data
        if (!dataForm.name.en) {
            dataForm.name.en = dataForm.name.ba;
        }
        if (dataForm.description.en === "\n\n(ZIPAPHOTO Test Fotograf)") {
            dataForm.description.en = dataForm.description.ba;
        }
        this.setState({
            _loading: true
        })
        fetch(this.props[0].match.params.uid ? `${API_ENDPOINT}/gallery/photographer/update/${this.props[0].match.params.uid}/${this.props[0].match.params.id}` : `${API_ENDPOINT}/gallery/update/${this.props[0].match.params.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(dataForm)
        }).then(res => res.json()).then((result) => {
            this.setState({
                _loading: null
            })
            if (this.props.uData && this.props.uData.userRole == 'admin') {
                this.props[0].history.push('/');
            } else {
                //this.props[0].history.push('/account/galleries');
                this.props[0].history.push(result.link);
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
                                <h2>{'Dodavanje novih fotografija'.translate(this.props.lang)}</h2>
                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                    <li><Link>{'Dodavanje novih fotografija'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>

                            <Col lg="12">
                                <Form loading={this.state._loading} initialValues={this.state.initialValues} onSubmit={this.submit} categories={this.props.categories} lang={this.props.lang} uploadHandler={(formData, callback) => {

                                    fetch(this.props[0].match.params.uid ? `${API_ENDPOINT}/gallery/photographer/photos/upload/${this.props[0].match.params.uid}` : `${API_ENDPOINT}/gallery/photos/upload`, {
                                        method: 'POST',
                                        headers: {
                                            Accept: 'application/json',
                                            //'Content-Type': 'multipart/form-data',
                                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                                        },
                                        body: formData
                                    }).then((res) => res.json()).then((img) => {
                                        callback(img);
                                    });

                                }} />
                                {this.state.error ? <p className="error">{this.state.error}</p> : null}
                            </Col>
                        </Row>

                    </Container>

                </section>



            </div>
        );
    }
}

export default Page(ChangeGallery);