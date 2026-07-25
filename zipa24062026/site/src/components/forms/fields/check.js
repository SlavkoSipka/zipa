
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Isvg from 'react-inlinesvg';

class Check extends Component {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    render() {
        return (
            <div className="checkbox-wrap" onClick={() => this.props.onChange(!this.props.value)} >
                <div className={this.props.value ? "checkbox checked" : "checkbox"}></div>
                {this.props.label ? <span className={this.props.error ? "checkbox-label required" : "checkbox-label"} >{this.props.label}</span> : null}
            </div>

        );
    }
}

export default Check;