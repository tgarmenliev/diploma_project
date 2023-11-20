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

function makeJsonTrainInfo(string, trainNumber) {
  let result = {};

  let type = "";
  let fromIndex = 0;

  for(let index = 0; index < string.length; index++) {
    type += string[index];

    if(string[index] === 'влак') {
      fromIndex = index + 1;
      break;
    }

    type += " ";
  }

  result = {
    type: type,
    trainNumber: trainNumber,
    stations: [],
  };

  for(let index = fromIndex; index < string.length; index++) {
    type = "";
    var timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    for(; index < string.length; index++) {

      if ((timePattern.test(string[index])) || (string[index] === '↦') || (string[index] === '↤')) {
        break;
      }

      if(type !== "") {
        type += " ";
      }

      type += string[index];
    }


    result.stations.push({
      station: type,
      arrive: string[index],
      depart: string[index + 1],
    });

    index++;
  }

  return result;
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
        let divText = $(divSelector).text().trim();

        divText = splitWords(divText);

        divText = makeJsonTrainInfo(divText, trainNo);

        return divText;
    }
    catch(error) {
        console.error('Error fetching the webpage:', error);
    }
}

// Define a route with a parameter
router.get('/:trainNo', async (req, res) => {
    const trainNo = req.params.trainNo;
  
    try {
      let trains_info = await getTrainNoInfo(trainNo);
  
      const data = {
        trains_info: trains_info,
      };
  
      res.json(data);
    } catch (error) {
      // Handle the error appropriately, e.g., send an error response
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  module.exports = router;