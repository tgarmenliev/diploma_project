// routes/translator.js

// Import required modules
const express = require('express');
const router = express.Router();

const stations = require('../stations.json');

async function translateStationToNumber(station) {
    const found = stations.find((s) => s.romanizedName === station);
    if (found) {
      return found.id;
    } else {
        return null;
    }
}

// Define a route with a parameter
router.get('/:name', async (req, res) => {
    let name = req.params.name;
  
    try {
      let stationCode = await translateStationToNumber(name);
  
      if (!stationCode) {
        throw new Error('Station not found!');
      }
  
      res.json(stationCode);
    } catch (error) {
      console.error('Error:', error);
      res.status(404).json({ error: 'Station not found!' });
    }
  });
  
  module.exports = router;