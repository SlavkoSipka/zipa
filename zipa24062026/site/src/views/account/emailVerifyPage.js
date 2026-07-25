import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Isvg from 'react-inlinesvg';
import { API_ENDPOINT } from '../../constants';


class EmailVerifyPage extends Component {
    constructor(props) {
        super(props);

        this.state = {

        };
    }


    componentDidMount() {

        fetch(`${API_ENDPOINT}/user/email/verify/${this.props[0].match.params.uid}/${this.props[0].match.params.emailVerificationCode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(res => res.json()).then((result) => {
            if (result.error) {
                this.setState({
                    error: result.error
                })
            } else {
                //localStorage.setItem('authToken', result.token);
                localStorage.removeItem('cart');
                //this.props.verifyUser();
                this.props[0].history.push('/login');
            }
        })


    }





    render() {

        return (
            null
        );
    }
}

export default EmailVerifyPage;