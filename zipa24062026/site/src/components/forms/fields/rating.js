
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Isvg from 'react-inlinesvg';

import star from '../../../assets/svg/star.svg';
import fullStar from '../../../assets/svg/full-star.svg';


class Rating extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }






    render() {
        return (
               <div className="stars-field">
                    <button type="button" onClick={() => this.props.onChange(1)}> <Isvg src={this.props.value > 0.5 ? fullStar : star} /> </button>
                    <button type="button" onClick={() => this.props.onChange(2)}> <Isvg src={this.props.value > 1.5 ? fullStar : star} /> </button>
                    <button type="button" onClick={() => this.props.onChange(3)}> <Isvg src={this.props.value > 2.5 ? fullStar : star} /> </button>
                    <button type="button" onClick={() => this.props.onChange(4)}> <Isvg src={this.props.value > 3.5 ? fullStar : star} /> </button>
                    <button type="button" onClick={() => this.props.onChange(5)}> <Isvg src={this.props.value > 4.5 ? fullStar : star} /> </button>

               </div>

        );
    }
}

export default Rating;