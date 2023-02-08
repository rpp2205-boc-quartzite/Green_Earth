import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import { FiInfo } from "react-icons/fi";
import { HiHeart, HiOutlineHeart } from "react-icons/hi";
import axios from 'axios';
import './ongoing-trip-style.css';

const UpcomingTripRider = (props) => {

  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    const myFunc = async () => {
      let result = await axios.get('/getdriverview',  { params: {userId: props.userId} }).catch(err => console.log('ERR: ', err))
      result = result.data[0];
      setUser(result);
      let driverId = result.rider_route.driver_id;
      let driverInfo = await axios.get('/getriderview', { params: {userId: driverId}}).catch(err => console.log('ERR: ', err))
      driverInfo = driverInfo.data[0];
      setDriver(driverInfo);
    }
    myFunc();
  }, [])

  const cancelRoute = async () => {
    await axios.get(`/cancel-rider-route/${props.userId}`).catch(err => console.log('ERR: ', err))
    setDriver(null);
  }

  if (user && driver) {
    return (
      <div className="ongoing-trip-container">
        <h5>Upcoming Trip</h5>
        <div className="card">
          <div className="card-header">
            <div className='header-info'>
              <img src={driver.avatar} alt="avatar" className='avatar'/>
              <p>{driver.full_name}</p>
            </div>
            <div className='icons-flex'>
              {user.favorites.includes(driver._id)
                ? <HiHeart className='card-icon full-heart-icon'/>
                : (<HiOutlineHeart className='card-icon outlined-heart-icon'/>)
              }
              <Link to="/ratings-reviews"  state={ {from: 'riderview', userData: user, revieweeData: driver }}>
                <FiInfo className='card-icon info-icon'/>
              </Link>
            </div>
          </div>
          <p className='card-detail'>Pickup: {driver.driver_route.start_address}</p>
          <p className='card-detail'>License plate #: {driver.license_plate}</p>
          <p className='card-detail'>Time: {driver.driver_route.time} </p>
          <div className="btn-horizontal-flex">
            <button className="cancel-btn" onClick={cancelRoute}>Cancel</button>
            <button type='submit' onClick={props.startTrip} className="primary-btn" id="start-trip-button">Start Trip</button>
          </div>
        </div>
      </div>
    )
  } else {
    return (
      <div className="ongoing-trip-container">
        <h5>Upcoming Trip</h5>
        <div className="card">
          <p>No Upcoming Routes</p>
        </div>
      </div>
    )
  }
}

export default UpcomingTripRider;