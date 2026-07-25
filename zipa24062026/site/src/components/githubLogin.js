import React, { Component } from 'react';
import { Link } from 'react-router-dom';

function getSearch(url) {
    let search = '';
    if (url.indexOf('?') !== -1) {
        search = url.split('?').pop();
    }
    let brokenParams = search.split('&');
    let params = {};
    for (let i = 0; i < brokenParams.length; i++) {
        params[brokenParams[i].split('=')[0]] = decodeURIComponent(brokenParams[i].split('=')[1]);
    }

    return params;
}


export default class GithubLogin extends Component {
    constructor(props) {
        super(props);
        this.request = this.request.bind(this);
        this.state = {
        }
    }



    request() {
        let url = `https://github.com/login/oauth/authorize?client_id=${this.props.clientId}&redirect_uri=${this.props.redirectUri}&scope=${this.props.scope}`;
        this.window = window.open(url, 'github-oauth-authorize', "height=1000,width=600")
        if (window.focus) { this.window.focus() }

        this.timer = setInterval(() => {
            try {
                if (!this.window || this.window.closed !== false) {
                    if (this.props.onFailure)
                        this.props.onFailure();
                    clearInterval(this.timer);
                    return;
                }

                if (this.window.location.href == url || this.window.location.pathname == 'blank') {
                    return;
                }


                if (this.props.onSuccess) {
                    this.props.onSuccess(getSearch(this.window.location.href).code);
                    this.window.close();
                    clearInterval(this.timer);
                    return;
                }
            } catch (e) {

            }

            //console.log(this.window.location.href);

        }, 500);
    }


    render() {
        if (this.props.render) {
            let Component = this.props.render;
            return (
                <Component onClick={this.request}></Component>
            )
        } else {
            return (
                <button onClick={this.request}>Login with GitHub</button>
            )
        }
    }
}
