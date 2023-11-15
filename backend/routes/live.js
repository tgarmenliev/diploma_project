// routes/live.js
const express = require('express');
const router = express.Router();

const axios = require('axios');
const cheerio = require('cheerio');

function splitWords(inputString) {

  let textWithoutSpaces = inputString.replace(/\s\s+/g, ' ');

  // Use a regular expression to split words by spaces
  textWithoutSpaces = textWithoutSpaces.split(/\s+/);

  // Filter out any empty strings
  const nonEmptyWords = textWithoutSpaces.filter(word => word !== '');

  return nonEmptyWords;
}

async function get_trains_info(station) {

  const url = 'https://live.bdz.bg/bg/' + station + '/departures';

  try {
    // Make a GET request to the webpage
    const response = await axios.get(url);

    // Load the HTML content of the page into Cheerio
    const content = cheerio.load(response.data);

    // Selector for the specific <div> you want to scrape
    const divSelector = '.timetableItem';

    // Select the specific <div> and extract all the text
    const divText = content(divSelector).text().trim();

    // Split the text into an array of words
    const wordsArray = splitWords(divText);
    
    return wordsArray;

  } catch (error) {
    throw error;
  }
}

// Define a route with a parameter
router.get('/:stationName', async (req, res) => {
  const stationName = req.params.stationName;

  try {
    let trains_info = await get_trains_info(stationName);

    const data = {
      trains_info: trains_info,
      info: 'Hello from live'
    };

    res.json(data);
  } catch (error) {
    // Handle the error appropriately, e.g., send an error response
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
