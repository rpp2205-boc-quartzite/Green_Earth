import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MdLogout } from 'react-icons/md';
import { HiOutlineRefresh } from 'react-icons/hi';
import { TbRefresh } from "react-icons/tb";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import axios from 'axios';
import "react-datepicker/dist/react-datepicker.css";
import Autocomplete from "react-google-autocomplete";

import DefaultRoute from './DefaultRoute.jsx';
import DriverPrompt from './DriverPromptModal.jsx';
import OngoingTrip from './OngoingTrip.jsx';
import UpcomingTrip from './UpcomingTrip.jsx';
// import ApiKey from './apikey.js';

function DriverView ({ userId }) {
  const [start, setStart] = useState({
    start_address: '',
    start_lat: '',
    start_lng: ''
  })
  const [end, setEnd] = useState({
    end_address: '',
    end_lat: '',
    end_lng: ''
  })
  const [seats, setSeats] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [displayTime, setDisplayTime] = useState(new Date());
  const [time, setTime] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [upcoming, setUpcoming] = useState({});
  const [showPrompt, setPrompt] = useState(false)
  const API_KEY = process.env.GOOGLE_MAP_API_KEY_VIEWS;


  //*****************************************************//
  //BELOW IS CODE THAT RENDERS DATA NEEDED FOR RIDER-LIST MAP/////////////////////////////////////////////////////////////
  //*****************************************************//
  const [directionsResponse, setDirectionsResponse] = useState('not updated');
  const [pickUp, setPickUp] = useState(null);
  const [dropOff, setDropOff] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickUpRef = React.useRef();
  const dropOffRef = React.useRef();


  useEffect(() => {
    if (pickUp && dropOff) {
      setLoading(true);
      console.log('Loaded!')
    }
  }, [pickUp, dropOff])


  useEffect(() => {
    if (loading) {
      async function CalculateRoute() {

        if (pickUpRef.current.value === '' || dropOffRef.current.value === '') {
          return
        };

        const directionsService = new google.maps.DirectionsService();

        const results = await directionsService.route({
          origin: pickUpRef.current.value,
          destination: dropOffRef.current.value,
          travelMode: google.maps.TravelMode.DRIVING
        });

        setDirectionsResponse({json: JSON.stringify(results)});
        // console.log('FINISHED');
        setLoading(false);
      }

      CalculateRoute()
    }
  }, [loading])

  useEffect(() => {
    if (typeof directionsResponse !== 'string') {
      console.log(directionsResponse)
    }
  }, [directionsResponse])



    //*****************************************************//
    //ABOVE IS CODE THAT RENDERS DATA NEEDED FOR RIDER-LIST MAP/////////////////////////////////////////////////////////////
    //*****************************************************//

  const route = {
    id: userId,
    full_name: name,
    start_address: start.start_address,
    start_lat: start.start_lat,
    start_lng: start.start_lng,
    end_address: end.end_address,
    end_lat: end.end_lat,
    end_lng: end.end_lng,
    time: time,
    default: isDefault,
    total_seats: seats
  }

  useEffect(() => {
    axios.get('/getdriverview', { params: {userId} })
    .then((result) => {
      setAvatar(result.data[0].avatar)
      setName(result.data[0].full_name)
      setUpcoming(result.data[0].driver_route)
      if (!result.data[0].drivers_license) {
        setPrompt(true)
      }
    })
    .catch(err => console.log(err))
  }, [])

  const closeModal = () => {
    setPrompt(!showPrompt)
  }

  return (
    <div className="allDefaultView">
      <div className="defaultViewHeader">
        <div className="headerToggleView">
          <Link to="/riderview">
            <div className="viewToggle">Rider</div>
            <TbRefresh className="viewToggleButton" size={25} />
          </Link>
        </div>
        <div className="headerAvatarLogout">
          <div className="headerAvatar">
            <Link to="/driverprofile" state={{id: userId}}>
            <button>Avatar</button>
            </Link></div>

          <div className="headerLogout">
            <Link to="/">
            <MdLogout className="logout" size={20}/>
            </Link></div>
        </div>
      </div>

      <div className="welcomeCont">
        <div className="welcomeMsg">Welcome {name},</div>
      </div>

      {showPrompt ? <DriverPrompt show={showPrompt} close={closeModal} userId={userId}/> : ''}

      <div className="findNearestDrivers">Find your nearest riders</div>
        <form>
          <div className="inputFieldsCont">
            <div className="inputFields">
              <Autocomplete
                className="inputField1"
                apiKey={API_KEY}
                style={{ width: "90%" }}
                placeholder="Starting point"
                ref={pickUpRef}
                onPlaceSelected={(place) => {
                  let lat = place.geometry.location.lat();
                  let lng = place.geometry.location.lng();
                  setStart({...start, start_address: place.formatted_address, start_lat: lat, start_lng: lng});
                  setPickUp(place.formatted_address);
                  // console.log(place);
                }}
                options={{
                  types: ["address"],
                  componentRestrictions: { country: "us" },
                }}
              />
              <Autocomplete
                className="inputField2"
                apiKey={API_KEY}
                style={{ width: "90%" }}
                placeholder="Destination"
                ref={dropOffRef}
                onPlaceSelected={(place) => {
                  let lat = place.geometry.location.lat();
                  let lng = place.geometry.location.lng();
                  setEnd({...end, end_address: place.formatted_address, end_lat: lat, end_lng: lng});
                  setDropOff(place.formatted_address);
                  // console.log(place);
                }}
                options={{
                  types: ["address"],
                  componentRestrictions: { country: "us" },
                }}
              />
              <DatePicker
                    className="inputField3"
                    selected={displayTime}
                    onChange={(date) => {
                      setTime(format(displayTime, 'hh:mm aa'));
                      setDisplayTime(new Date(date));
                    }}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                  />
              <input type="text" className="inputField4" style={{ width: "90%" }} placeholder="Available seats" onChange={(e) => setSeats(Number(e.target.value))}/>
              <div className="defaultRadioCont">
                <input type="radio" className="radioInput" onChange={(e) => setIsDefault(true)}/> <div className="saveDefaultText">Set as default route</div>
              </div>
            </div>

            <Link to="/rider-list" state={{dir: directionsResponse, route: route}}>
              <button className="primary-btn-find">Find Riders</button>
            </Link>
          </div>
        </form>

      <div>
        <DefaultRoute userId={userId} upcoming={upcoming} />
        <OngoingTrip user = {userId} />
        <UpcomingTrip user = {userId} />
      </div>

    </div>
  )
}

export default DriverView;