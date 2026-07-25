import React, { Component } from 'react';

export class GoogleMapScript extends Component{
  componentDidMount()
  {
    if (typeof window == 'undefined'){
      return;
    }

    if (this.props._googleMapsLoaded){
      return;
    }

    var ref = window.document.getElementsByTagName("script")[0];
    var script = window.document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?sensor=false&key="+this.props.API_KEY+"&callback=googleMapsCallback&language=hr&region=BA";
    script.async = true;
    script.defer = true;

    ref.parentNode.insertBefore(script, ref);
  }


  render(){
    return null;
  }
}
