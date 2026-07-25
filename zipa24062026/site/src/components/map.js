import React from 'react';

export default class Map extends React.Component {
    constructor(props) {
        super(props);
        this.initMap = this.initMap.bind(this);
        this.state = {};
    }

    initMap() {
        if (typeof window == 'undefined'){
            return;
        }

        this.setState({
            _mapInit: true
        });
        var latLng = new window.google.maps.LatLng(this.props.value.split(',')[0], this.props.value.split(',')[1]
            );

        var map = new window.google.maps.Map(this.GoogleMap, {
            zoom: 16,
            center: latLng,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            gestureHandling: "gestureHandling",
            
        });


        var marker = new window.google.maps.Marker({
            position: latLng,
            map: map,
        });

    }

    componentDidMount() {
        if (this.props._googleMapsLoaded && !this.state._mapInit) {
            this.initMap();
        }

    }

    componentDidUpdate() {
        if (this.props._googleMapsLoaded && !this.state._mapInit) {
            this.initMap();
        }
    }

    render() {
        return (
            <>

                {
                    this.props._googleMapsLoaded ?
                        <div className="map" ref={(input) => { this.GoogleMap = input; }}>

                        </div>
                        : null
                }
            </>
        );
    }
}
