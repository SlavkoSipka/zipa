
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Isvg from 'react-inlinesvg';

import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,

} from 'reactstrap';


function objectIndexOf(arr, _id) {
    console.log('AAAAAAAAAAAAAA');
    var found = false;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i]._id == _id) {
            found = true;
            return i;
        }
    }

    return -1;

}

class MultiSelect extends Component {
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
                                        <button type="button"
                                            className={(this.props.value.indexOf(children.props.value) !== -1 ? 'selected' : null) } onClick={() => {
                                                let values = this.props.value;
                                                if (typeof values === 'string') {
                                                    values = [];
                                                }
                                                if (!values) {
                                                    values = [];
                                                }

                                                let index =  values.indexOf(children.props.value);

                                                if (index !== -1) {
                                                    values.splice(index, 1);
                                                } else {
                                                    values.push(children.props.value);
                                                }
                                                this.props.onChange(values);
                                            }}

                                        >{children.props.children}</button>
                                    )
                            })
                        }
                    </div>
                </div>
            </div>
        );
    }
}

export default MultiSelect;