
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
            <div className="form-field-select">
                <label>{this.props.label}</label>

                <Dropdown className={this.props.error ? 'select-field required' : 'select-field'} isOpen={this.state.dropdownOpen} toggle={() => { this.setState({ dropdownOpen: !this.state.dropdownOpen }) }}>
                    <DropdownToggle nav caret>
                        {
                            this.props.value ?  this.props.children.find(o => o.props.value === this.props.value) ? this.props.children.find(o => o.props.value === this.props.value).props.children : this.props.placeholder : this.props.placeholder
                        }
                    </DropdownToggle>
                    <DropdownMenu className="dropdown-animation">
                        {
                            this.props.children && this.props.children.map((children) => {
                                if (children.props)
                                return (
                                    <DropdownItem onClick={() => {this.props.onChange(children.props.value ? children.props.value : children.props.children); if (this.props.additionalAction) {console.log('test'); this.props.additionalAction(this.props.scope, children.props.value)} }}>{children.props.children}</DropdownItem>
                                )
                            })
                        }
                    </DropdownMenu>
                </Dropdown>
            </div>
        );
    }
}

export default Select;