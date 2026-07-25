import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';

import Image from '../image';

import star from '../../assets/svg/star.svg';
import fullStar from '../../assets/svg/full-star.svg';
import imagesCount from '../../assets/svg/images-count.svg';
import moment from 'moment';
import { API_ENDPOINT, PHOTOS_ENDPOINT} from '../../constants';

class Article extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }




    render() {
        let className = `${this.props.bigView ? 'big-view-article' : ''} ${this.props.listView ? 'list-view-article' : ''} ${this.props.homeArticle ? 'home-article' : ''} ${this.props.imageArticle ? 'image-article' : ''}`

        return (
            <article className={className}>
                <Link to={`/galerija/${this.props.alias}/${this.props._id}`}>
                    <div className="image-wrap">
                        <img src={(this.props.bigView ? `${PHOTOS_ENDPOINT}/photos/700x/` : `${PHOTOS_ENDPOINT}/photos/350x/`) + this.props.image} />
                        <div className="full-image">
                            <img src={(this.props.bigView ? `${PHOTOS_ENDPOINT}/photos/700x/` : `${PHOTOS_ENDPOINT}/photos/350x/`) + this.props.image} />
                        </div>

                    </div>

                </Link>

                {this.props.categoryName ? <div className="category">{this.props.categoryName}</div> : null}
                <div className="wrap">
                    <div className="info"><span>{this.props.location} | {moment.unix(this.props.published).format('DD.MM.YYYY.')}</span> <span><Isvg src={imagesCount} /> {this.props.imagesCount}</span> </div>
                    <Link to={`/galerija/${this.props.alias}/${this.props._id}`}><h6>{this.props.name.length > (this.props.maxNameLength ? this.props.maxNameLength : 120) ? this.props.name.substring(0, this.props.maxNameLength ? this.props.maxNameLength : 120) + '...' : this.props.name}</h6></Link>
                    {this.props.listView || this.props.bigView || this.props.imageArticle ?
                        <p>{this.props.shortDescription.length > (this.props.maxShortDescriptionLength ? this.props.maxShortDescriptionLength : 500) ? this.props.shortDescription.substring(0, this.props.maxShortDescriptionLength ? this.props.maxShortDescriptionLength : 500) + '...' : this.props.shortDescription}

                        </p>
                        : null
                    }


                </div>
            </article>
        );
    }
}

export default Article;