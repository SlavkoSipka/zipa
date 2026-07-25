import React, { Component } from 'react';
import no_image from '../assets/images/no-image.jpg';

class Image extends Component {
    constructor(props) {
        super(props);
        this.handleScroll = this.handleScroll.bind(this);

        this.state = {
        };
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll, true);


        if (!this.state.image || this.state.isVisible){
            return;
        }

        let rect =this.state.image.getBoundingClientRect();

        let isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        this.setState({
            isVisible: isVisible
        })

    }


    componentDidUpdate(prevProps, prevState){
        if (!prevState.image && this.state.image){
            if (!this.state.image || this.state.isVisible){
                return;
            }
    
            let rect =this.state.image.getBoundingClientRect();
    
            let isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
            this.setState({
                isVisible: isVisible
            })
    
        }
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll);
        
    }


    handleScroll() {
        if (!this.state.image || this.state.isVisible){
            return;
        }

        let rect =this.state.image.getBoundingClientRect();

        let isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        this.setState({
            isVisible: isVisible
        })
    }



    render() {

        let src;
        let extension = this.props.src ? '.' + this.props.src.split('.').pop() : null;
        let defaultImage = false;
        if (!this.state.image) {
            src = null;
        }


        if (this.state.image && typeof window !== 'undefined' && window.innerWidth < 500) {
            let width = this.state.image.offsetWidth;
            if (width < 100) {

                src = this.props.src.replace(extension, '-100x' + extension);
            } else {
                for (let i = width; i <= 500; i++) {
                    if (i % 100 === 0) {
                        src = this.props.src.replace(extension, `-${i}x` + extension);
                        break;
                    }
                }
            }


        } else if (typeof window !== 'undefined' && window.innerWidth >= 500) {
            src = this.props.src;
        }


        if (typeof localStorage !== 'undefined' && localStorage._webpSupport && src) {
            src = src.replace(extension, '.webp');
        }

        if (!src && typeof window !== 'undefined') {
            src = no_image;
        } else if (typeof window === 'undefined') {
            src = this.props.src.replace(extension, '-50x.webp');
        }


        if (!this.state.isVisible){
            src = no_image;
        }

        if (this.props.disableReisze && this.state.isVisible){
            src= this.props.src;
        }
        return (
            <img style={!this.props.src ? { minWidth: '100%' } : null}  {...this.props} src={src} ref={(node) => { if (!this.state.image) this.setState({ image: node }) }} />
        );
    }
}

export default Image;