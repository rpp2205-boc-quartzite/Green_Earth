import "./RiderList.css";
import axios from 'axios';
import mapStyles from "./mapStyles.js";
import React, { useEffect } from "react";
import { Link } from 'react-router-dom';
import RiderList from "./RiderList.jsx"
import { GoogleMap, useLoadScript, DirectionsRenderer } from '@react-google-maps/api';
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

  // console.log('TEST', location.state)

  const data = location.state.dir.json;

  const route = location.state.route;

  // console.log('ROUTE: ', route)

  const directions = JSON.parse(data)


  const {isLoaded, loadError} = useLoadScript({
    googleMapsApiKey: API_KEY,
    libraries
  });

  const[loaded, setLoaded] = React.useState(false);
  const [directionsResponse, setDirectionsResponse] = React.useState(null);
  const [riders, setRiders] = React.useState([]);
  const [userRouteInfo, setUserRouteInfo] = React.useState({})
  const [distance, setDistance] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [tripStatus, setTripStatus] = React.useState('START');
  const [seats, setSeating] = React.useState(1)
  const [driverData, setDriver] = React.useState({});
  const [time, setSeconds] = React.useState(0);


  useEffect(() => {
    const findRiders = () => {
      const driver = {
        userId: route.id,
        start_address: route.start_address,
        start_lat: route.start_lat,
        start_lng: route.start_lng,
        end_address: route.end_address,
        end_lat: route.end_lat,
        end_lng: route.end_lng,
        time: route.time,
        total_seats: route.total_seats,
        default: route.default,
      }

      setDriver(driver);

      setUserRouteInfo(driver);
      return axios.post('/rider-list', driver)
        .then((res) => {
          // console.log(res.data)
          setSeating(res.data[0].seats)
          return setRiders(res.data);
        })
        .catch((err) => console.log('Find drivers error: ', err))
    }
    findRiders();
  }, [route])

  useEffect(() => {
        const interval = setInterval(() => {
          console.log('Test #', time)
        }, 5000);
        return () => clearInterval(interval);
      }, [time]);


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
  if (!riders.length) return (
    <div className='loading-screen'>
    <img className='loading-gif' src="https://media.tenor.com/k-wL_qZAELgAAAAi/test.gif" alt="Loading" />
    <p>Finding Riders...</p>
 </div>
  )
  if (!isLoaded) return (
    <div className='loading-screen'>
      <img className='loading-gif' src="https://media.tenor.com/k-wL_qZAELgAAAAi/test.gif" alt="Loading" />
      <p>Finding Riders...</p>
   </div>
  )

  const mapCheck = function() {
    if (!Object.keys(directionsResponse).length) {
      return (
          <div className='loading-screen'>
            <img className='loading-gif' src="https://media.tenor.com/k-wL_qZAELgAAAAi/test.gif" alt="Loading" />
            <p>Loading Map...</p>
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

  // const tripCheck = function() {
  //   if (tripStatus === 'START') {
  //     return (
  //       <button className="start-trip"type="submit" onClick={tripChange}>Start Trip</button>
  //     )
  //   } else {
  //     return (
  //       <Link to="/trip-complete" >
  //       <button className="end-trip" type="submit" >End Trip</button>
  //     </Link>
  //     )
  //   }
  // };

  // const tripChange = function() {
  //   setTripStatus('END');
  // };


  return (
    <div>
      {/* {console.log('This is the Rider Info: ', riders)} */}
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
          <h1>Total Distance: {distance}</h1>
          <h1>Expected Duration: {duration}</h1>
        </div>
      </div>
        {/* <br></br>
        <div className="start-trip-place">
          {tripCheck()}
        </div> */}
        <br></br>
        <div className="rider-list" data="DriverInteractions">
          <RiderList driver={driverData} riders={riders} seats={seats} />
        </div>
    </div>
  )
}

export default DriverInteractions;