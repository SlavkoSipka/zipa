import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';

import moment from 'moment';
import Image from '../image';

class BlogArticle extends Component {
    constructor(props) {
        super(props);

        this.state = {
        };
    }




    render() {

        return (
            <article>
                <Link to={`/blog/${this.props.alias}`}> <Image src={this.props.image} /></Link>
                <div className="wrap">
                    {this.props.blogPage ?
                        <div>
                            {/*<Link to={`/blog/${this.props.categoryAlias}`}><p className="category">{this.props.category}</p></Link>*/}
                            <p>{moment.unix(this.props.published).format('MMMM DD, YYYY')}</p>

                        </div>
                        :
                        null
                    }

                    {/*<Link to={`/blog/${this.props.categoryAlias}`}> <p className="category">{this.props.category}</p></Link> : null*/}

                    <Link to={`/blog/${this.props.alias}`}><h6>{this.props.title}</h6></Link>
                    {this.props.blogPage ? <p className="description">{this.props.shortDescription}</p> : null}
                    {!this.props.blogPage ? <p>{moment.unix(this.props.published).format('MMMM DD, YYYY')}</p> : null}
                </div>
            </article>
        );
    }
}

export default BlogArticle;