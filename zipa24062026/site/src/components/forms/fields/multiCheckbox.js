
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Checkbox from './check';

import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Row,
    Col

} from 'reactstrap';


class MultiSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectAll: false,
            deselectAll: false
        };
    }

    render() {
        return (
            <div className="multicheckbox">
                <label>{this.props.label}</label>

                <Row>
                    {this.props.enableSelectAll ?
                        <Col lg={this.props.width ? this.props.width : '6'}>
                            <a onClick={() => {
                                let items = this.props.value;
                                if (!items)
                                    items = [];
                                for (let i = 0; i < this.props.children.length; i++) {
                                    if (this.props.children[i] && this.props.children[i].props) {
                                        if (items.indexOf(this.props.children[i].props.value) === -1)
                                            items.push(this.props.children[i].props.value);
                                    }
                                }
                                this.props.onChange(
                                    items
                                )


                                this.forceUpdate()




                            }}

                            >Select all</a> /
                        <a onClick={() => {
                                let items = this.props.value;
                                if (!items)
                                    items = [];


                                for (let i = 0; i < this.props.children.length; i++) {
                                    if (this.props.children[i] && this.props.children[i].props) {
                                        if (items.indexOf(this.props.children[i].props.value) !== -1) {
                                            items.splice(items.indexOf(this.props.children[i].props.value), 1);
                                        }
                                    }
                                }
                                this.props.onChange(
                                    items
                                )


                                this.forceUpdate()

                            }}
                            >Deselect all</a>
                            <hr />
                        </Col>
                        :
                        null
                    }
                    {

                        this.props.children && this.props.children.map((children, idx) => {
                            if (children && children.props)
                                return (
                                    <Col lg={this.props.width ? this.props.width : '6'} key={idx}>

                                        <Checkbox onChange={() => {
                                            let values = this.props.value;
                                            if (typeof values === 'string') {
                                                values = [];
                                            }
                                            if (!values) {
                                                values = [];
                                            }

                                            let index = values.indexOf(children.props.value);

                                            if (index !== -1) {
                                                values.splice(index, 1);
                                            } else {
                                                values.push(children.props.value);
                                            }


                                            this.props.onChange(values);
                                            this.forceUpdate()

                                        }}
                                            value={this.props.value.indexOf(children.props.value) !== -1 ? true : false}
                                            // value={this.props.value.indexOf(children.props.value) !== -1 ? true : false}
                                            label={children.props.children}
                                        ></Checkbox>
                                    </Col>
                                )
                        })
                    }

                </Row>
            </div>
        );
    }
}

export default MultiSelect;