// routes/api.js
const express = require('express');
const router = express.Router();
//const axios = require('axios');

router.get('/:station', async (req, res) => {
  let station = req.params.station;

  try {
    station = station.toUpperCase();
    
    const data = {
      station: station,
    };

    res.json(data);
  } catch (error) {
    // Handle the error appropriately, e.g., send an error response
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
