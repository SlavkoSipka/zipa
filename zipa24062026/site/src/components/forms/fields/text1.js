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
            <div className={this.props.error ? "form-field required" : "form-field"}>
                <label>{this.props.label}</label>
                <input  type={this.props.type ? this.props.type : 'text'} onChange={(e) => {
                    if (this.props.multilang) {
                        let value = this.props.value;
                        if (!value) {
                            value = {};
                        }

                        if (typeof (value) == 'string') {
                            value = {};
                        }

                        value[this.props.lang] = e.target.value;

                        this.props.onChange(value);
                    } else {


                        this.props.onChange(e.target.value);
                    }
                    this.forceUpdate();

                }} value={this.props.multilang ? (this.props.value && this.props.value[this.props.lang]) ? this.props.value[this.props.lang] : '' : this.props.value} placeholder={this.props.placeholder} />
            </div>
        );
    }
}

export default TextIcon;