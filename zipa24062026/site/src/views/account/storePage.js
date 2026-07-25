import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import Page from '../../containers/page';


import {
    Container,
    Row,
    Col,
} from 'reactstrap';


import StoreForm from '../../components/forms/storeForm';
import BlogArticle from '../../components/articles/blogArticle';


import rightArrow from '../../assets/svg/right-arrow.svg';
import user from '../../assets/svg/user.svg';
import { API_ENDPOINT } from '../../constants';


class StorePage extends Component {
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
        fetch(`${API_ENDPOINT}/stores/create`, {
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
                this.setState({
                    done: true

                })

                this.props[0].history.push(`/shop/${data.alias}`);
            }
        })

    }

    render() {
        return (
            <div className="account-wrap">
                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="6" className="user-info">
                                <Isvg src={user} />
                                <div>
                                    <h1>Moj nalog</h1>
                                    <p className="email">{this.props.uData && this.props.uData.email}</p>
                                    <button onClick={() => this.props.signOut()}>Izloguj se</button>
                                </div>
                            </Col>
                            <Col lg={{ size: 6 }} className="user-nav">
                                <Link to='/account/orders'><button >MOJE NARUDŽBE</button></Link>
                                <Link to='/account/edit'><button>PODEŠAVANJA</button></Link>
                                <Link to='/account/reviews'><button >OCJENE</button></Link>
                                {this.props.uData && this.props.uData.permissions && this.props.uData.permissions.indexOf('*') !== -1 ? <Link to='/account/categories'><button className="active">ADMINISTRACIJA</button></Link> : null}

                            </Col>
                        </Row>

                    </Container>
                </div>


                <section >
                    <Container>
                        <Row>
                            <Col lg="12" >
                                <div className="admin-form">
                                    <ul className="tabs">
                                        <li >
                                            <Link to='/account/categories'>Kategorije</Link>
                                        </li>
                                        <li>
                                            <Link to='/account/users'>Korisnici</Link>
                                        </li>
                                        <li>
                                            <Link to='/account/news'>Novosti</Link>
                                        </li>
                                        <li>
                                            <Link to='/account/pages'>Stranice</Link>
                                        </li>

                                        <li>
                                            <Link to='/'>Statistike</Link>
                                        </li>
                                        <li>
                                            <Link to='/'>OTVORI SHOP</Link>
                                        </li>
                                    </ul>

                                    <div className="form-wrapper">
                                        <div className="top">
                                            <h3>Otvaranje radnje</h3>
                                        </div>


                                        <StoreForm onSubmit={this.submit} />


                                    </div>
                                </div>

                            </Col>
                        </Row>

                    </Container>

                </section>




            </div>
        );
    }
}

export default Page(StorePage);