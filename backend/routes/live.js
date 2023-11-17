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

function get_delay_info(info) {
  let delayMinutes = 0;
  let delayString = "";
  let delayInfo = "";

  for(let index = 0; index < 3; index++) {
    delayString += info[index];
    delayString += " ";

    if(index === 1) {
      delayMinutes = parseInt(info[index]);
    }

  }

  for(let index = 3; index < info.length; index++) {
    delayInfo += info[index];
    delayInfo += " ";
  }

  return {
    delayMinutes: delayMinutes,
    delayString: delayString,
    delayInfo: delayInfo,
  };
}

function makeTrainJson(string, trainNum, delayInfo) {
  let result = {};

  let prefix = (delayInfo.length !== 0);

  let station = "";

  for(let index = 1 + prefix; index < string.length; index++) {
    station += string[index];
    station += " ";
  }

  result = {
    direction: station,
    time: 0,
    isDelayed: prefix,
    delayedTime: 0,
    delayInfo: delayInfo,
    type: trainNum[0],
    trainNum: trainNum[1]
  };
  console.log("prefix: " + prefix);
  if(prefix) {
    console.log("prefix is 1");
    result["time"] = string[1];
    result["delayedTime"] = string[0];
  }
  else {
    console.log("prefix is 0");
    result["time"] = string[0];
  }

  return result;
}

async function get_trains_info(station) {

  const url = 'https://live.bdz.bg/bg/' + station + '/departures';

  try {
    // Make a GET request to the webpage
    const response = await axios.get(url);

    // Load the HTML content of the page into Cheerio
    const content = cheerio.load(response.data);

    let trainsInfo = [];

    content('.timetableItem').each((index, element) => {
      let currInfo = {};

      let timeNames = content(element).find('.mb-lg-0').text(); // Replace 'time-class' with the actual class or selector for the time
      timeNames = splitWords(timeNames);

      let trainNum = content(element).find('.text-nowrap').text(); // Replace 'train-name-class' with the actual class or selector for the train name
      trainNum = splitWords(trainNum);

      let delayInfo = content(element).find('.col-lg-3').text();
      delayInfo = splitWords(delayInfo);
      if(delayInfo.length !== 0) {
        delayInfo = get_delay_info(delayInfo);
      }

      currInfo = makeTrainJson(timeNames, trainNum, delayInfo);

      trainsInfo.push(currInfo);
      
      //console.log(currInfo);
    });
    
    return trainsInfo;

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
    };

    res.json(data);
  } catch (error) {
    // Handle the error appropriately, e.g., send an error response
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
