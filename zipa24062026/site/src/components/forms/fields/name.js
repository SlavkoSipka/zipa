
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Isvg from 'react-inlinesvg';

import pen from '../../../assets/svg/account-pen-name.svg';

class Text extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    render() {
        return (
            <>
                <input className={this.props.error ? "required" : ""} type={this.props.type ? this.props.type : 'text'} onChange={this.props.onChange} value={this.props.value} placeholder={this.props.placeholder} />
                <Isvg src={pen} />
            </>
        );
    }
}

export default Text;