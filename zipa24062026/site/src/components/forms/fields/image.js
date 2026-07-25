
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import {
    Container,
    Row,
    Col,
} from 'reactstrap';

import Isvg from 'react-inlinesvg';
import image from '../../../assets/svg/picture.svg';
import { API_ENDPOINT } from '../../../constants';

class Image extends Component {
    constructor(props) {
        super(props);
        this.selectFile = this.selectFile.bind(this);

        this.state = {

        };
    }

    selectFile(e) {
        let input = e.target;
        if (input.files && input.files[0]) {
            this.setState({
                _loading: true
            })

            let formData = new FormData();
            formData.append('file', input.files[0]);

            fetch(`${API_ENDPOINT}/upload`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    //'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                },
                body: formData
            }).then((res) => res.text()).then((img) => {
                this.props.onChange(img);
                this.setState({
                    _loading: null
                })
            });

            //var reader = new FileReader();



            /*reader.onload = async (e) => {
                
        
            }

            reader.readAsDataURL(input.files[0]);*/
        }
    }

    render() {
        return (
            <div className="input-wrap image-input-wrap">
                <label>{this.props.label}</label>

                <div className="image-picker single-image-picker">
                    <input type="file" onChange={this.selectFile} />
                    {this.props.value ?
                        <img src={this.props.value} />
                        :
                        null
                    }
                    {
                        this.state._loading ?
                            <div className="lds-ring"><div></div><div></div><div></div><div></div></div>
                            :
                            null
                    }
                    <div className="bottom-content">
                        <Isvg src={image} />
                        <p> <span>Upload a file</span> or drag and drop</p>
                    </div>


                </div>

            </div>


        );
    }
}

export default Image;