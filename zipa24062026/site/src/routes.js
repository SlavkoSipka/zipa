import React, { Component } from 'react';
import {
    BrowserRouter as Router,
    Route,
    Switch,
    Redirect

} from 'react-router-dom';


import { routes } from './routesList';

class Routes extends Component {

    render() {
        return (
            <div>


                <Switch className="react-switch">
                    {
                        routes.map((route) => {
                            if (route.loginNeeded && !this.props.uData) {
                                return (
                                    <Route
                                        path={route.path}
                                        exact={route.exact}
                                        render={(...renderProps) => {
                                            const Component = route.preAuthComponent;
                                            return (
                                                <Component {...renderProps} {...this.props} loadData={route.loadData} generateSeoTags={route.generateSeoTags} />
                                            )
                                        }}
                                    />

                                )
                            } else {
                                if (this.props.uData && route.redirectUser) {
                                    return (
                                        <Route
                                            path={route.path}
                                            exact={route.exact}
                                            render={(...renderProps) => {

                                                return (
                                                    <Redirect to={route.redirectUser} />
                                                )
                                            }}
                                        />
                                    )

                                } else {
                                    return (
                                        <Route
                                            path={route.path}
                                            exact={route.exact}
                                            render={(...renderProps) => {
                                                const Component = route.component;
                                                return (
                                                    <Component {...renderProps} {...this.props} loadData={route.loadData} generateSeoTags={route.generateSeoTags}/>
                                                )
                                            }}
                                        />

                                    )
                                }
                            }
                        })
                    }

                </Switch>
            </div>
        );
    }
}

export default Routes;