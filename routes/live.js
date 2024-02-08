// routes/live.js
const express = require('express');
const router = express.Router();

const axios = require('axios');
const cheerio = require('cheerio');

const stations = require('../stations.json');

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
  
  newDelayInfo = delayInfo;
  if(delayInfo.length === 0) {
    newDelayInfo = {
      delayMinutes: 0,
      delayString: "",
      delayInfo: "",
    };
  }

  result = {
    direction: station,
    time: 0,
    isDelayed: prefix,
    delayedTime: 0,
    delayInfo: newDelayInfo,
    type: trainNum[0],
    trainNum: trainNum[1]
  };

  if(prefix) {
    result["time"] = string[1];
    result["delayedTime"] = string[0];
  }
  else {
    result["time"] = string[0];
  }

  let delayString = result["delayInfo"]["delayString"];
  if (result["isDelayed"] && (delayString.includes("Трансбордиране с автобус") || delayString === "Bus undefined undefined ")) {
    result["direction"] = result["time"]
    result["time"] = result["delayedTime"]
    result["delayedTime"] = 0
    if(delayString.includes("Bus undefined undefined ")) {
      delayString = "Bus"
    }

    result["delayInfo"] = {
      delayMinutes: 0,
      delayString: delayString,
      delayInfo: "",
    };
  }

  return result;
}

function translateNumberToStation(number) {
  const foundStation = stations.find((s) => s.id === number);
  if (foundStation) {
    return foundStation.romanizedName;
  } else {
    return null; // Station not found
  }
}

getEverythingPastLoadingStation = (station) => {
  let loadingStation = false;
  let result = "";
  for(let index = 0; index < station.length; index++) {
    if(station[index] === "loading...") {
      loadingStation = true;
    }
    else if(loadingStation) {
      result += station[index];
      result += " ";
    }
  }

  return result;
}

async function get_trains_info(number, language, type) {

  const station = translateNumberToStation(number);

  const url = 'https://live.bdz.bg/' + language + '/' + station + '/' + type;

  try {
    // Make a GET request to the webpage
    const response = await axios.get(url);

    // Load the HTML content of the page into Cheerio
    const content = cheerio.load(response.data);

    //const divSelector = '.mb-0';
    //let divText = content(divSelector).text().trim();
    //console.log(divText);

    let result = {};

    let station = "";

    content('#content').each((index, element) => {
      station = content(element).find('.mb-0').text();
      station = splitWords(station);
      station = getEverythingPastLoadingStation(station);
    });

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
    });

    result = {
      station: station,
      trains: trainsInfo,
    };
    
    return result;

  } catch (error) {
    throw error;
  }
}

// Define a route with a parameter
router.get('/:language/:stationNumber/:type', async (req, res) => {
  let stationNumber = null;
  try {
    stationNumber = parseInt(req.params.stationNumber);
  } catch (error) {
    // Handle the error appropriately, e.g., send an error response
    console.error('Error:', error);
    res.status(400).json({ error: 'Bad Request' });
    return;
  }
  const language = req.params.language;
  const type = req.params.type;

  if(language !== "bg" && language !== "en") {
    res.status(400).json({ error: 'Bad Request' });
    return;
  }

  if(type !== "departures" && type !== "arrivals") {
    res.status(400).json({ error: 'Bad Request' });
    return;
  }

  try {
    let trains_info = await get_trains_info(stationNumber, language, type);

    res.json(trains_info);
  } catch (error) {
    // Handle the error appropriately, e.g., send an error response
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
