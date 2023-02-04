/* eslint-disable no-unused-vars */

const path = require('path');
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const auth = require('./auth.js');
const { register, login, validate, sendMail, changePassword } = require('../database/controllers/authentication.js');
const { getDriverView, getRiderView, postDriverRoute, postRiderRoute, postDriverLicense } = require('../database/controllers/defaultviews.js')
//const { getDriver, getRider } = require('../database/controllers/defaultviews.js');
const { postReviewHandler } = require('../database/controllers/reviews.js');
const { postReportHandler } = require('../database/controllers/report.js');
//*****const { getDriverView, getRiderView } = require('../database/controllers/defaultviews.js')
//const { getDriverView, getRiderView } = require('../database/controllers/defaultviews.js')
const { getDriverList, addFavorite, removeFavorite } = require('../database/controllers/driverList.js')
const { calculateDistance } = require('./helpers/driverListHelpers.js')
const { getRiderArray, updateCurrentDriverRoute, updateCurrentRiderRoute, updateAllRiderRoutes } = require ('../database/controllers/riderList.js');
//const goodbye = require('./routes/goodbye.js');
const bodyParser = require('body-parser');

app.use(express.static(path.join(__dirname, '../client/dist')));
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.json())

// connect to db
const db = require('../database/index.js');

// db controllers
const tripCompletion = require('../database/controllers/tripCompletion.js');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  next();
});

// ----  Routes ---- //


//get routes
app.get('/goodbye', (req, res) => {
  res.send('Thanks For Visiting');
});

// ---- Trip Completion  ---- //

// test database user insertion
app.post('/database', async (req, res) => {
  // console.log('server/index.js - app.post - /database - here');
  await tripCompletion.addExampleUser()
  res.send('complete')
})

// start the trip
app.put('/start-trip/:_id', async (req, res) => {
  // console.log('made it here', req.params._id);
  let result = await tripCompletion.startTrip(req.params._id)
  res.send(result);
})

// end the trip
app.put('/end-trip/:_id', async (req, res) => {
  // console.log('made it here2', req.params._id);
  let result = await tripCompletion.endTrip(req.params._id)
  res.send(result);
})

// favorite a user
app.put('/favorite/:user_id/:favorite_user_id', async (req, res) => {
  console.log('favorite time', req.params.user_id, req.params.favorite_user_id);
  let result = await tripCompletion.endTrip(req.params._id)
  res.send(result);
})



// ---- Authentication  ---- //

app.get('/auth-endpoint', auth, (request, response) => {
  response.json({ message: 'You are authorized to access me' });
});

// Register Endpoint
app.post('/register', register);

// Login Endpoint
app.post('/login', login);

app.get('/validate', validate);

app.post('/sendMail', sendMail);

app.put('/change-password', changePassword);

// ---- Default Driver view routes  ---- //
app.get('/getdriverview', function(req, res) {
  let userid = req.query.userId;
  getDriverView(userid)
  .then((result) => {
    console.log(result)
    res.send(result)
  })
  .catch(err => console.log(err))
});

// ---- Default Rider view routes  ---- //
app.get('/getriderview', function(req, res) {
  let userid = req.query.userId;
  getRiderView(userid)
  .then((result) => {
    console.log(result)
    res.send(result)
  })
  .catch(err => console.log(err))
});

app.post('/postDriverRoute', function(req, res) {
  var data = req.body.data;
  postDriverRoute(data)
  .then(result => res.end())
  .catch(err => console.log(err))
})

app.post('/postRiderRoute', function(req, res) {
  postRiderRoute(req.body)
  .then(() => res.status(201).send('Successfully post rider route'))
  .catch((err) => res.status(400).send(err))
});

app.post('/postDriverLicense', function(req, res) {
  console.log('here is license', req.body.licenseInfo)
  var data = req.body.licenseInfo;
  postDriverLicense(data)
  .then(result => res.end())
  .catch(err => console.log(err))
})


// ---- Ratings and Reviews routes  ---- //
app.get('/getreviews', function(req, res) {
  let userid = req.query.id;
  getRiderView(userid)
  .then((result) => {
    console.log(result)
    res.send(result)
  })
  .catch(err => console.log(err))
});

//app.get('/reviews/:product_id/:count/:sort', getReviewsHandler);

app.post('/newreview', (req, res) => {
  let review = req.body;
  console.log('this is a test', req);
  postReviewHandler(review)
  .then((response) => {
    console.log('review', response);
    res.status(201).send(response);
  })
  .catch(err => {
    res.status(500).send(err);
  })
});

app.post('/reviews/:user_id/report', (req, res) => {
  let report = req.body;
  report.user_id = req.params.user_id;
  console.log('this is a test', req);
  console.log('this is a report', report);
  postReportHandler(report)
  .then((response) => {
    console.log('review', response);
    res.status(201).send(response);
  })
  .catch(err => {
    res.status(500).send(err);
  })
});

// app.put('/reviews/:review_id/report', updateReportForReview);
// app.put('/reviews/:review_id/helpful', updateHelpfulCountsForReview);


// ------------------------------------------------------------------------------------------ //
// ----------------------------------- Driver List Routes ----------------------------------- //
// ------------------------------------------------------------------------------------------ //
app.post('/driver-list', async (req, res) => {
  const rider =  {
    id: req.body.userId,
    start_address: req.body.start_address,
    start_lat: req.body.start_lat,
    start_lng: req.body.start_lng,
    end_address: req.body.end_address,
    end_lat: req.body.end_lat,
    end_lng: req.body.end_lng,
    time: req.body.time,
  }
  const driverList = [];

  try {
    const activeDrivers = await getDriverList();
    for (let driver of activeDrivers) {
      const startDistance = await calculateDistance(rider.start_lat, rider.start_lng, driver.driver_route.start_lat, driver.driver_route.start_lng);
      const endDistance = await calculateDistance(rider.end_lat, rider.end_lng, driver.driver_route.end_lat, driver.driver_route.end_lng);
      if (startDistance !== undefined && endDistance !== undefined) {
        driverList.push({driverInfo: driver, startDistance, endDistance})
      }
      console.log(driverList)
      driverList.sort((a, b) => {
        return a.startDistance.value - b.startDistance.value
      })
    }
    res.status(200).send(driverList)
  } catch (err) {
    console.log('Get driver list server err: ', err)
    res.status(404).send(err)
  }
})

// Add/remove driver to/off user's favorites list
app.put('/driver-list', async (req, res) => {
  console.log(req.query.action);
  try {
    if (req.query.action === 'add-favorite') {
      await addFavorite(req.query.userId, req.query.driverId)
      res.status(204).send('Successfully favorite driver')
    } else if (req.query.action === 'remove-favorite') {
      await removeFavorite(req.query.userId, req.query.driverId)
      res.status(204).send('Successfully unfavorite driver')
    }
  } catch (err) {
    console.log('Error add or remove favorite driver: ', err);
    res.status(400).send(err)
  }
})


// ###################################################################################//
// ----------------------------------- Rider List ----------------------------------- //
// ###################################################################################//

app.post('/rider-list', async (req, res) => {
  const driver =  {
    id: req.body.userId,
    start_address: req.body.start_address,
    start_lat: req.body.start_lat,
    start_lng: req.body.start_lng,
    end_address: req.body.end_address,
    end_lat: req.body.end_lat,
    end_lng: req.body.end_lng,
    time: req.body.time,
    total_seats: req.body.total_seats,
    default: req.body.default
  }

  const riderArray = [];
  const seats = {total: driver.total_seats};

  try {
    const unassignedRiders = await getRiderArray();
    // console.log("Unassigned Riders", unassignedRiders)
    for (let rider of unassignedRiders) {
      const startDistance = await calculateDistance(driver.start_lat, driver.start_lng, rider.rider_route.start_lat, rider.rider_route.start_lng);
      const endDistance = await calculateDistance(driver.start_lat, driver.start_lng, rider.rider_route.start_lat, rider.rider_route.start_lng);
      if (startDistance !== undefined && endDistance !== undefined) {
        riderArray.push({rider, startDistance, endDistance, seats})
      }
      riderArray.sort((a, b) => {
        return a.startDistance.value - b.startDistance.value
      })
    }
    res.status(200).send(riderArray)
  }
  catch (err) {
    console.log('The Following Error Occured When Attempting to Capture Riders: ', err)
    res.status(404).send(err)
  }
})


app.post('/add-current-routes', async (req, res) => {
  const driver =  {
    userId: req.body.driver.userId,
    start_address: req.body.driver.start_address,
    start_lat: req.body.driver.start_lat,
    start_lng: req.body.driver.start_lng,
    end_address: req.body.driver.end_address,
    end_lat: req.body.driver.end_lat,
    end_lng: req.body.driver.end_lng,
    time: req.body.driver.time,
    total_seats: req.body.driver.total_seats,
    default: req.body.driver.default,
    riders: req.body.riderIDs
  }

  const riders = req.body.riderIDs;

  try {
    const updatedDriver = await updateCurrentDriverRoute(driver, riders)
    const updateRiders = await updateAllRiderRoutes(riders, driver)
    res.status(200).send({driver: driver, riders: riders})

  }
  catch(err) {
    console.log('Updating Driver/Rider Routes: ', err);
    res.status(400).send(err)
  }
})


// ---- Catch all for routing ---- //

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'), function(err) {
    if (err) {
      res.status(500).send(err)
    }
  })
});
// ---- Set Port and Listen For Requests ---- //

// const server = app.listen(port, () => {
//   console.log(`listening on port ${port}`);
// });

const port = 8080;

app.listen(port, () => {
  console.log(`listening on port ${port}, on this path ${path.join(__dirname, '../client/dist')}`);
});

//module.exports = server;