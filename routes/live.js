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

  // Check if the delay is "допълнителна информация". Very corner case
  if ((info[0].includes("допълнителна") || info[0].includes("more")) && (info[1].includes("информация") || info[1].includes("information")))
  {
    delayString = info[0] + " " + info[1];
    delayInfo = info.slice(3).join(" ");
  } 
  else if (info[0].includes("Bus") || info[0].includes("Трансбордиране"))
  {
    if(info[0].includes("Bus")) {
      delayString = "Transfer by bus."
    } else {
      delayString = info[0] + " " + info[1] + " " + info[2] + ".";
    }
    delayInfo = info.slice(3).join(" ");
  } 
  else
  {
    for(let index = 0; index < 3; index++) {
      delayString += info[index];
      delayString += " ";

      if(index === 1) {
        delayMinutes = parseInt(info[index]);
      }
    }
    delayInfo = info.slice(3).join(" ");
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

  // If the train is delayed, the station name starts from the 2nd index
  // If the train is not delayed, the station name starts from the 1st index
  for(let index = 1 + prefix; index < string.length; index++) {
    station += string[index];
    station += " ";
  }
  
  if(delayInfo.length === 0) {
    delayInfo = {
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
    delayInfo: delayInfo,
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
  if (result["isDelayed"] && (delayString.includes("Трансбордиране") || delayString.includes("Bus") || delayString.includes("more information") || delayString.includes("допълнителна информация"))) {
    result["direction"] = result["time"] + " " + result["direction"];
    result["time"] = result["delayedTime"];
    result["delayedTime"] = 0;
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

  const stationName = translateNumberToStation(number);

  if (stationName == null) {
    throw new Error('Station does not exist!');
  }

  const url = 'https://live.bdz.bg/' + language + '/' + stationName + '/' + type;

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

      let timeNames = content(element).find('.mb-lg-0').text();
      timeNames = splitWords(timeNames);

      let trainNum = content(element).find('.text-nowrap').text();
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
    console.error('Error:', error);
    res.status(400).json({ error: 'Bad Request! Station number is not correct!' });
    return;
  }
  const language = req.params.language;
  const type = req.params.type;

  if(language !== "bg" && language !== "en") {
    res.status(400).json({ error: 'Bad Request! Language does not exist!' });
    return;
  }

  if(type !== "departures" && type !== "arrivals") {
    res.status(400).json({ error: 'Bad Request! Wrong type of live table!' });
    return;
  }

  try {
    let trains_info = await get_trains_info(stationNumber, language, type);

    res.json(trains_info);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error!' });
  }
});

module.exports = router;
