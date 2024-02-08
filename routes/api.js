// routes/api.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

async function getPosition(trainNumber) {
  const url = "https://radar.bdz.bg/bg?train=" + trainNumber;

  const elementId = '.text-uppercase';

  try {
    // Make an HTTP request to fetch the HTML content
    const response = await axios.get(url);

    // Load the HTML content into Cheerio
    const $ = cheerio.load(response.data);

    // Get the text content of the element with the specified ID
    const elementText = $(elementId).text().trim();

    console.log("Gotten text");
    // Output the result
    console.log(elementText);

    return elementText;
  } catch (error) {
    console.error('Error fetching the webpage:', error);
  }
}

router.get('/:train', async (req, res) => {
  let train = req.params.train;

  try {
    let result = await getPosition(train);
    scrapeTrains();

    res.json(result);

  } catch (error) {
    // Handle the error appropriately, e.g., send an error response
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
