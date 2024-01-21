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

function makeJsonTrainInfo(string, trainNumber, date) {
  let result = {};

  let type = "";
  let fromIndex = 0;

  for(let index = 0; index < string.length; index++) {
    type += string[index];

    if(string[index] === 'влак' || string[index] === 'Train') {
      fromIndex = index + 1;
      break;
    }

    type += " ";
  }

  result = {
    trainType: type,
    trainNumber: trainNumber,
    date: date,
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

async function getTrainNoInfo(trainNo, language, date) {
  const url = 'https://razpisanie.bdz.bg/' + language + '/train-info/' + trainNo;

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

      divText = makeJsonTrainInfo(divText, trainNo, date);

      return divText;
  }
  catch(error) {
      throw error;
  }
}

// Define a route with a parameter
router.get('/:language/:trainNo/:date?', async (req, res) => {
  const trainNo = req.params.trainNo;
  const language = req.params.language;

  let today = new Date();
  // Format the date in the format DD.MM.YYYY
  today = today.toLocaleDateString('bg-BG');
  // Remove the last 3 characters from the date string
  today = today.slice(0, -3);

  const date = req.params.date || today;

  if(trainNo.length < 3 || trainNo.length > 5) {
    res.status(404).json({ error: 'Train info not found' });
    return;
  }

  if(language !== 'bg' && language !== 'en') {
    res.status(404).json({ error: 'Train info not found' });
    return;
  }

  try {
    let trains_info = await getTrainNoInfo(trainNo, language, date);

    if (!trains_info) {
      // If the train info is not found, throw an error
      throw new Error('Train info not found');
    }

    const data = trains_info;

    res.json(data);
  } catch (error) {
    // Handle the error appropriately, e.g., send an error response
    console.error('Error:', error);
    res.status(404).json({ error: 'Train info not found' });
  }
});

module.exports = router;