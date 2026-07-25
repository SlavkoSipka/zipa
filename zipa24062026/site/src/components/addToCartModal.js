import React, { Component } from 'react';
import {Link} from 'react-router-dom'
import Isvg from 'react-inlinesvg';

import rightArrow from '../assets/svg/right-arrow.svg';
import star from '../assets/svg/star.svg';
import fullStar from '../assets/svg/full-star.svg';



import {
    Container,
    Row,
    Col,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    UncontrolledDropdown
} from 'reactstrap';

class AddToCartModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }




    render() {

        return (
            <div className="modal-wrap">
                <div>
                    <div className="article-info">
                        <img src={this.props.image} />
                        <h3>Item added to your cart</h3>
                        <h6>{this.props.name}</h6>
                        <p className="category">{this.props.category}</p>
                        <div className="stars">

                            <Isvg src={this.props.rating >= 0.5 ? fullStar : star} />
                            <Isvg src={this.props.rating >= 1.5 ? fullStar : star} />
                            <Isvg src={this.props.rating >= 2.5 ? fullStar : star} />
                            <Isvg src={this.props.rating >= 3.5 ? fullStar : star} />
                            <Isvg src={this.props.rating >= 4.5 ? fullStar : star} />

                        </div>
                        <p className="price">${this.props.price}</p>
                    </div>
                    <div className="buttons-wrap">
                        <button className="close-button" onClick={this.props.hideAddToCartModal}>Keep Browsing</button>
                        <Link to={'/cart'}><button onClick={this.props.hideAddToCartModal} className="checkout-button">Go to Checkout <Isvg src={rightArrow} /></button></Link>
                    </div>
                </div>
            </div>
        );
    }
}

export default AddToCartModal;