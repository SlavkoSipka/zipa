
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Isvg from 'react-inlinesvg';

import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,

} from 'reactstrap';

class Select extends Component {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    render() {
        return (
            <div className="form-field-list-select">
                <label>{this.props.label}</label>

                    <div className="list-wrap">
                    <div className="list">
                        {
                            this.props.children && this.props.children.map((children) => {
                                if (children.props)
                                return (
                                    <button type="button" className={children.props.value == this.props.value ? 'selected' : ''} onClick={() => {this.props.onChange(children.props.value); }}>{children.props.children}</button>
                                )
                            })
                        }
                    </div>
                    </div>
            </div>
        );
    }
}

export default Select;