// routes/trainInfo.js

// Import required modules
const express = require('express');
const router = express.Router();

const axios = require('axios');
const cheerio = require('cheerio');

// Function to split a string into words and remove spaces
function splitWords(inputString) {

  let textWithoutSpaces = inputString.replace(/\s\s+/g, ' ');

  // Use a regular expression to split words by spaces
  textWithoutSpaces = textWithoutSpaces.split(/\s+/);

  // Filter out any empty strings
  const nonEmptyWords = textWithoutSpaces.filter(word => word !== '');

  return nonEmptyWords;
}

// Function to create an object with train information
function makeJsonTrainInfo(string, trainNumber, date) {
  let result = {};

  let type = "";
  let fromIndex = 0;

  for(let index = 0; index < string.length; index++) {
    type += string[index];

    if(string[index].includes('влак') || string[index].includes('Train') || string[index].includes('автобус') || string[index].includes('Bus')) {
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

  var timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  for(let index = fromIndex; index < string.length; index++) {
    type = "";

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

// Function to get train information from the BDZ website
async function getTrainNoInfo(trainNo, language, date) {
  if (trainNo[0] == 'A' || trainNo[0] == 'А') {
    trainNo = trainNo.slice(1);
    trainNo += '1';
  }
  const url = 'https://razpisanie.bdz.bg/' + language + '/train-info/' + trainNo + '/' + date;

  // Selector for the specific <div> containing the train information
  const divSelector = '.bg-white.p-4.mb-4';

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

// Function to format the date in "DD.MM.YYYY" format
function formatDate(inputDate) {
  // Check if the input date is in "DD.MM.YYYY" format
  const ddmmRegex = /^\d{2}.\d{2}.\d{4}$/;
  if (ddmmRegex.test(inputDate)) {
    return inputDate;
  }

  // Check if the input date is in "YYYY-MM-DD" format
  const yyyymmddRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (yyyymmddRegex.test(inputDate)) {
    // Convert "YYYY-MM-DD" to "DD.MM.YYYY"
    const [year, month, day] = inputDate.split('-');
    return `${day}.${month}.${year}`;
  }

  // If the date format is not recognized, throw an error
  throw new Error('Invalid date format!');
}

// Define a route with a parameter
router.get('/:language/:trainNo/:date?', async (req, res) => {
  const trainNo = req.params.trainNo;
  const language = req.params.language;

  if(language !== 'bg' && language !== 'en') {
    res.status(404).json({ error: 'Bad request! Invalid language!' });
    return;
  }

  if(trainNo.length < 3 || trainNo.length > 6) {
    res.status(404).json({ error: 'Bad request! Invalid train number!' });
    return;
  }

  let today = new Date();
  // Format the date in the format DD.MM.YYYY
  today = today.toLocaleDateString('bg-BG');
  today = today.slice(0, -3);

  let date = null;
  try {
    date = formatDate(req.params.date || today);
  } catch (error) {
    res.status(400).json({ error: error.message }); // Invalid date format
    return;
  }

  try {
    let trainInfo = await getTrainNoInfo(trainNo, language, date);

    if (!trainInfo) {
      throw new Error('Train info not found');
    }

    const data = trainInfo;

    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(404).json({ error: 'Train info not found' });
  }
});

module.exports = router;