
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import {
    Container,
    Row,
    Col,
} from 'reactstrap';

import Isvg from 'react-inlinesvg';
import image from '../../../assets/svg/camera-icon.svg';
import { API_ENDPOINT } from '../../../constants';
import { proveriSliku, ACCEPT } from './proveraSlike';

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
            // Provera pre slanja — pogrešan fajl dobija poruku odmah.
            const greska = proveriSliku(input.files[0], this.props.lang);
            if (greska) {
                this.setState({ _greska: greska, _loading: null });
                input.value = '';
                return;
            }

            this.setState({
                _loading: true,
                _greska: null
            })

            let formData = new FormData();
            formData.append('file', input.files[0]);

            /*
             * `ruta` postoji zbog slike profila: `/upload` je od 2026-08-28
             * zaključan na administratora, pa `editAccountPage` prosleđuje
             * `/upload/avatar`, koji sme svaki prijavljen korisnik uz istu
             * proveru sadržaja. Bez propa se ponaša kao i pre.
             */
            fetch(`${API_ENDPOINT}${this.props.ruta || '/upload'}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    //'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                },
                body: formData
            }).then((res) => {
                // Server na odbijen fajl vraća 400 i poruku u tekstu.
                if (!res.ok) {
                    return res.text().then((poruka) => {
                        this.setState({ _greska: poruka || 'Slanje nije uspjelo.', _loading: null });
                        return null;
                    });
                }
                return res.text();
            }).then((img) => {
                if (img === null || img === undefined) return;
                this.props.onChange(img);
                this.setState({
                    _loading: null,
                    _greska: null
                })
            }).catch(() => {
                this.setState({ _greska: 'Slanje nije uspjelo.', _loading: null });
            });

            //var reader = new FileReader();



            /*reader.onload = async (e) => {
                
        
            }

            reader.readAsDataURL(input.files[0]);*/
        }
    }

    render() {
        return (
            <div className="image-picker">
                <input type="file" accept={ACCEPT} onChange={this.selectFile} />
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
                </div>

                {this.state._greska ?
                    <p className="greska-slike" role="alert">{this.state._greska}</p>
                    : null}

            </div>



        );
    }
}

export default Image;