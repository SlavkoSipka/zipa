import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,

} from 'reactstrap';


import Form from '../../components/forms/editAccountForm';
import BlogArticle from '../../components/articles/blogArticle';


import rightArrow from '../../assets/svg/right-arrow.svg';
import user from '../../assets/svg/user.svg';
import sponsor from '../../assets/images/sponsor.png';
import { API_ENDPOINT } from '../../constants';


class EditAccountPage extends Component {
    constructor(props) {
        super(props);
        this.submit = this.submit.bind(this);

        this.state = {
            ...props.initialData
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
    }

    submit(data) {
        console.log(data);
        fetch(`${API_ENDPOINT}/user/edit`, {
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
                this.props.verifyUser();
                this.props[0].history.push('/account/profile')
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
                                <h2>{'Uređivanje profila'.translate(this.props.lang)}</h2>
                                <ul>
                                    <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li><Link to='/account/profile'>{'Profil'.translate(this.props.lang)}</Link></li>
                                    <li><Link>{'Uređivanje profila'.translate(this.props.lang)}</Link></li>
                                </ul>

                            </Col>

                            <Col lg="8">
                                <Form userRole={this.props.uData.userRole} initialValues={this.props.uData} onSubmit={this.submit} />
                                {this.state.error ? <p className="error">{this.state.error}</p> : null}
                            </Col>
                            <Col lg="4" className="sponsor">
                                <h6>{'GENERALNI SPONZOR'.translate(this.props.lang)}</h6>
                                {this.props.sponsorBanner ?
                                    <div className="sponsor-banners-wrap">
                                        {
                                            this.props.sponsorBanner.images.map((item, idx) => {
                                                return (
                                                    <a href={item.link} target="_blank" onClick={() => this.props.bannerClick(item.link)}>
                                                        <img key={idx} src={item.image} />
                                                    </a>

                                                )
                                            })
                                        }
                                    </div>

                                    :
                                    null

                                }
                            </Col>
                        </Row>

                    </Container>

                </section>



            </div>
        );
    }
}

export default Page(EditAccountPage);