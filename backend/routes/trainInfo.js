// routes/trainInfo.js
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

async function getTrainNoInfo(trainNo) {
    const url = 'https://razpisanie.bdz.bg/bg/train-info/' + trainNo;

    // Selector for the specific <div> you want to scrape
    const divSelector = '.bg-white.p-4.mb-4'; // Replace with your actual selector

    let trainInfo = {};

    // Make a GET request to the webpage
    try {
        const response = await axios.get(url);

        // Load the HTML content of the page into Cheerio
        const $ = cheerio.load(response.data);

        // Select the specific <div> and extract all the text
        const divText = $(divSelector).text().trim();

        trainInfo = splitWords(divText);

        return trainInfo;
    }
    catch(error) {
        console.error('Error fetching the webpage:', error);
    }

    console.log(trainInfo[0]);
}

// Define a route with a parameter
router.get('/:trainNo', async (req, res) => {
    const trainNo = req.params.trainNo;
  
    try {
      let trains_info = await getTrainNoInfo(trainNo);
  
      const data = {
        trains_info: trains_info,
        info: 'Hello from train info'
      };
  
      res.json(data);
    } catch (error) {
      // Handle the error appropriately, e.g., send an error response
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  module.exports = router;