import "./RiderList.css";
import mapStyles from "./mapStyles.js";
import React, { useEffect } from "react";
import { Link } from 'react-router-dom';
import RiderList from "./RiderList.jsx"
import { GoogleMap, useJsApiLoader, useLoadScript, LoadScript, Marker, InfoWindow, Autocomplete, DirectionsRenderer } from '@react-google-maps/api';
import { useLocation } from "react-router-dom";

const API_KEY = process.env.GOOGLE_MAP_API_KEY_RIDER_LIST;

const containerStyle = {
  width: '370px',
  height: '275px'
};

const center = {
  lat: 34.052235,
  lng: -118.243683
};

const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
}


const libraries = ["places"];

const DriverInteractions = function(props) {

  const location = useLocation();

  const data = location.state.json

  const directions = JSON.parse(data)


  const {isLoaded, loadError} = useLoadScript({
    googleMapsApiKey: API_KEY,
    libraries
  });

  const[loaded, setLoaded] = React.useState(false);
  const [directionsResponse, setDirectionsResponse] = React.useState(null);
  const [distance, setDistance] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [tripStatus, setTripStatus] = React.useState('START');
  const [ridersArray, setRidersArray] = React.useState([
    {
      name: "Suzy Thompson",
      pic: "https://images.unsplash.com/photo-1501088430049-71c79fa3283e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=668&q=80",
      from: .25,
      to: .10,
      time: "9:00am",
    },
    {
      name: "Mark Manchin",
      pic: "https://images.unsplash.com/photo-1501088430049-71c79fa3283e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=668&q=80",
      from: .62,
      to: .05,
      time: "9:00am",
    },
    {
      name: "Trouble Maker",
      pic: "https://images.unsplash.com/photo-1501088430049-71c79fa3283e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=668&q=80",
      from: .02,
      to: .02,
      time: "9:00am",
    }
  ]);

  useEffect(() => {
    if (!loaded)
        setDirectionsResponse(directions);
        setDistance(directions.routes[0].legs[0].distance.text);
        setDuration(directions.routes[0].legs[0].duration.text);
        setLoaded(true)
  }, [loaded, directions]);




  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, [])


  if (loadError) return "Error Loading Maps";
  if (!isLoaded) return (
    <div className='loading-screen'>
      <img className='loading-gif' src="https://media.tenor.com/k-wL_qZAELgAAAAi/test.gif" alt="Loading" />
      <p>Finding drivers...</p>
   </div>
  )

  const mapCheck = function() {
    if (!Object.keys(directionsResponse).length) {
      return (
          <div className='loading-screen'>
            <img className='loading-gif' src="https://media.tenor.com/k-wL_qZAELgAAAAi/test.gif" alt="Loading" />
            <p>Finding drivers...</p>
        </div>
        )

    } else {
      return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        zoom={11}
        center={center}
        options={options}
        onLoad={onMapLoad}
      >
          {directionsResponse && (
          <DirectionsRenderer directions={directionsResponse}/>
          )}
      </GoogleMap>)
    }
  }

  const tripCheck = function() {
    if (tripStatus === 'START') {
      return (
        <button className="start-trip"type="submit" onClick={tripChange}>Start Trip</button>
      )
    } else {
      return (
        <Link to="/trip-complete" >
        <button className="end-trip" type="submit" >End Trip</button>
      </Link>
      )
    }
  };

  const tripChange = function() {
    setTripStatus('END');
  };


  return (
    <div>
      <div>
        <div className="test-top">
          <div className="setting">Driver</div>
          <div className="profile-pic-padd">
            <img className="profile-picture" alt="lady from FEC" src="https://images.unsplash.com/photo-1501088430049-71c79fa3283e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=668&q=80"/>
          </div>
          <Link to="/driverview" >
            <button className="return-main" type="submit">return</button>
          </Link>
        </div>
      </div>
      <br></br>
      <div className="Gmap">
        {mapCheck()}
      </div>
      <br></br>
      <div className="MapData">
        <div className="route">
          <h1>Total Distance: {distance}, Expected Duration: {duration}</h1>
        </div>
      </div>
        <br></br>
        <div className="start-trip-place">
          {tripCheck()}
        </div>
        <br></br>
        <div className="rider-list" data="DriverInteractions">
          <RiderList riders={ridersArray}/>
        </div>
    </div>
  )
}

export default DriverInteractions;