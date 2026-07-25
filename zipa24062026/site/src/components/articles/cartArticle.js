import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';

import Image from '../image';

import star from '../../assets/svg/star.svg';
import fullStar from '../../assets/svg/full-star.svg';
import imagesCount from '../../assets/svg/images-count.svg';
import moment from 'moment';
import x from '../../assets/svg/x.svg';
import { API_ENDPOINT, PHOTOS_ENDPOINT} from '../../constants';

class CartArticle extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }




    render() {

        return (
            <article className={'list-view-article cart-article'}>
                <img src={`${PHOTOS_ENDPOINT}/photos/350x/` + this.props.image} />
                {this.props.categoryName ? <div className="category">{this.props.categoryName}</div> : null}
                <div className="wrap">
                    <div className="info"><span>{this.props.location} | {moment.unix(this.props.published).format('DD.MM.YYYY.')}  <Isvg src={imagesCount} /> {this.props.resolution}px</span> <span className="price">${(this.props.price).formatPrice(2)}</span> </div>
                    <h6>{this.props.name.length > (this.props.maxNameLength ? this.props.maxNameLength : 30) ? this.props.name.substring(0, this.props.maxNameLength ? this.props.maxNameLength : 30) + '...' : this.props.name}</h6>
                    {this.props.listView || this.props.bigView ?
                        <p>{this.props.shortDescription.length > (this.props.maxShortDescriptionLength ? this.props.maxShortDescriptionLength : 60) ? this.props.shortDescription.substring(0, this.props.maxShortDescriptionLength ? this.props.maxShortDescriptionLength : 60) + '...' : this.props.shortDescription}</p>
                        : null
                    }
                </div>
                <button className="remove-button" onClick={this.props.handleRemove}><Isvg src={x} /></button>

            </article>
        );

        /*return (
            <article className={this.props.listView ? 'list-view-article' : null}>
                <Image src={this.props.images && this.props.images[0]} />
                <div className="wrap">
                    <div>
                        <h6>{this.props.name}</h6>
                        <p>{this.props.shortDescription}</p>
                        <div className="quantity">
                            <button onClick={() => {
                                if (this.props.quantity - 1 > 0) {
                                    this.props.updateQuantity(this.props.quantity - 1);
                                }
                            }}>-</button>
                            <input type="text" value={this.props.quantity}></input>
                            <button onClick={() => {
                                if (this.props.quantity + 1 <= 10) {
                                    this.props.updateQuantity(this.props.quantity + 1);
                                }
                            }}>+</button>
                        </div>
                    </div>
                    <div className="bottom-wrap">
                        <button onClick={this.props.handleRemove}><Isvg src={x} /></button>
                        <span className="price">{ (this.props.price * this.props.quantity).formatPrice(2)} KM</span>
                    </div>
                </div>
            </article>
        );*/
    }
}

export default CartArticle;