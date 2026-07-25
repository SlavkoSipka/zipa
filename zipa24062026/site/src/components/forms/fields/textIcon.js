import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Isvg from 'react-inlinesvg';



class TextIcon extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }

    render() {
        return (
            <div className={this.props.error ? "form-field-icon required" : "form-field-icon"}>
                <label>{this.props.label}</label>
                <div >
                    {this.props.icon ? <Isvg src={this.props.icon} /> : null }
                    <input  type={this.props.type ? this.props.type : 'text'} onChange={this.props.onChange} value={this.props.value} placeholder={this.props.placeholder} />
                </div>
            </div>
        );
    }
}

export default TextIcon;