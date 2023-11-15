// routes/api.js
const express = require('express');
const router = express.Router();

// Define a route with a parameter
router.get('/:stationName', (req, res) => {
  const stationName = req.params.stationName;
  const data = {
    station: stationName,
    info: 'This is information about the train station.API'
  };
  res.json(data);
});

module.exports = router;
