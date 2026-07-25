import React, { Component } from 'react';
import {Link} from 'react-router-dom'
import Isvg from 'react-inlinesvg';



class FreeArticle extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }




    render() {

        return (
            <article>
                <img src={this.props.image} />
                <div className="wrap">
                    <h6>{this.props.name}</h6>
                    <div className="bottom-wrap">
                        <p>{this.props.category}</p>
                        <span>FREE</span>
                    </div>
                </div>
            </article>
        );
    }
}

export default FreeArticle;