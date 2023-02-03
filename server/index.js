/* eslint-disable no-unused-vars */

const path = require('path');
const express = require('express');
const app = express();
const auth = require('./auth.js');
const { register, login } = require('../database/controllers/authentication.js');
const { updateDriverProfile, updateRiderProfile, getUserInfo } = require('../database/controllers/userProfile.js')
const { getDriverView, getRiderView, postDriverRoute, postRiderRoute, postDriverLicense } = require('../database/controllers/defaultviews.js')
//const { getDriver, getRider } = require('../database/controllers/defaultviews.js');
const { postReviewHandler } = require('../database/controllers/reviews.js');
const { postReportHandler } = require('../database/controllers/report.js');
//*****const { getDriverView, getRiderView } = require('../database/controllers/defaultviews.js')
//const { getDriverView, getRiderView } = require('../database/controllers/defaultviews.js')
const { getDriverList, addFavorite, removeFavorite } = require('../database/controllers/driverList.js')
const { calculateDistance } = require('./helpers/driverListHelpers.js')
//const goodbye = require('./routes/goodbye.js');
const bodyParser = require('body-parser');

app.use(express.static(path.join(__dirname, '../client/dist')));
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.json())

// connect to db
const db = require('../database/index.js');

// db controllers
const User = require('../database/controllers/user.js');
const { createResponseComposition } = require('msw');

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

app.post('/database', async (req, res) => {
  console.log('server/index.js - app.post - /database - here');
  await User.addExampleUser()
  res.send('complete')
})

// ---- Authentication  ---- //

app.get('/auth-endpoint', auth, (request, response) => {
  response.json({ message: 'You are authorized to access me' });
});

// Register Endpoint
app.post('/register', register);

// Login Endpoint
app.post('/login', login);


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

// ---- User Profile Routes ---- //

app.get('/getuserinfo', function(req, res) {
  let userid = req.query.id;
  console.log('USERID in INDEXJS server', req.query.id)
  getUserInfo(userid)
  .then((result) => {
    console.log(result)
    res.send(result)
  })
  .catch(err => console.log(err))
});

app.post('/updateDriverProfile', function(req, res) {
  console.log('DATA IN INDEX.JS SERVER', req.body)
  var data = req.body;
  updateDriverProfile(data)
  .then(result => {
    console.log('result in index.js server', result)
    res.end()
  })
  .catch(err => console.log(err))
});

app.post('/updateRiderProfile', function(req, res) {
  console.log('DATA IN INDEX.JS RIDER SERVER', req.body)
  var data = req.body;
  updateRiderProfile(data)
  .then(result => {
    console.log('result in index.js server', result)
    res.end()
  })
  .catch(err => console.log(err))
});


// ---- User Profile Routes End ---- //

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
