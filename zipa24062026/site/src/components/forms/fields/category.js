
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Select from './selectList';
import {
    Col,
    Row,
    Container
} from 'reactstrap';

class Category extends Component {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    render() {
        console.log(this.props.categories);

        let maxDepth = 0;
        for (let i = 0; i < this.props.categories.length; i++) {
            if (this.props.categories[i].value) {
                if (this.props.categories[i].value.split('/').length - 1 > maxDepth)
                    maxDepth = this.props.categories[i].value.split('/').length - 1;
            }
        }

        let splitted = [];

        for (let i = 1; i <= maxDepth; i++) {
            splitted[i - 1] = [];
            for (let j = 0; j < this.props.categories.length; j++) {
                if (this.props.categories[j].value) {
                    if (this.props.categories[j].value.split('/').length - 1 == i) {
                        splitted[i - 1].push(this.props.categories[j]);
                    }
                }
            }

        }

        return (
            <div className="input-wrap">
                {this.props.label ? <label>{this.props.label}</label> : null}

                <Row>
                    {
                        splitted.map((item, idx) => {
                            let items = (idx == 0 ? item :[]);
                            if (this.props.value && idx !== 0) {
                                for (let i = 0; i < item.length; i++) {
                                    if (item[i].value && (item[i].value.indexOf(this.props.value.split('/').splice(0, idx + 1).join('/')) === 0 /*|| this.props.value.indexOf(item[i].value) !== -1*/ ) ) {
                                        items.push(item[i]);
                                    }
                                }
                            }
//
                            
                            if ( items.length && ( idx == 0 || (idx != 0 && this.props.value && this.props.value.split('/').length  >=  idx + 1)  ) ) {
                                return (
                                    <Col lg="4">
                                        <Select label={idx == 0 ? 'Kategorija' : 'Podkategorija'} onChange={this.props.onChange} value={this.props.value ? this.props.value.split('/').splice(0, idx + 2).join('/') : null}>
                                            {
                                                items.map((cat, cidx) => {
                                                    return (
                                                        <option value={cat.value}>{cat.name}</option>
                                                    )
                                                }
                                                )
                                            }
                                        </Select>
                                    </Col>

                                )
                            }else {
                                return null;
                            }
                        })
                    }

                </Row>

            </div>
        );
    }
}

export default Category;