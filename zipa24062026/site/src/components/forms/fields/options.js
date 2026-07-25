
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Isvg from 'react-inlinesvg';

class Options extends Component {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    render() {
        return (
            <div className={this.props.error ? "form-field-options required" : "form-field-options"}>
                <label>{this.props.label}</label>
                <div className="options">
                    {
                        this.props.values && this.props.values.map((item, idx) => {
                            return (
                            <div className={this.props.value == item.value ? "option checked" : 'option'} onClick={() => this.props.onChange(item.value)}>
                                <div> <label>{item.name}</label></div>
                                
                                <span>
                                    {item.description}
                                    </span>
                            </div>
                        )
                        })
                    }
                </div>
            </div>

        );
    }
}

export default Options;