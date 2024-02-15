// routes/schedule-sec.js
const express = require('express');
const router = express.Router();

const axios = require('axios');
const cheerio = require('cheerio');

const stations = require('../stations.json');
function capitalizeFirstLetterOfRoute(route) {
    return route.toLowerCase().replace(/(?:^|\s)\S/g, (match) => match.toUpperCase());
}

function splitWords(inputString) {

    let textWithoutSpaces = inputString.replace(/\s\s+/g, ' ');
  
    // Use a regular expression to split words by spaces
    textWithoutSpaces = textWithoutSpaces.split(/\s+/);
  
    // Filter out any empty strings
    // The words "Най-бързо" and "пътуване" are just confusing the algorithm so we remove them
    textWithoutSpaces = textWithoutSpaces.filter(word => word !== '' && word !== 'Най-бързо' && word !== 'пътуване' && word !== 'Fastest' && word !== 'trip');

    return textWithoutSpaces;
}

function checkDepart(time) {
    let currDate = new Date();
    let currTime = [currDate.getHours(), currDate.getMinutes()];

    if((parseInt(currTime[0])) > (parseInt(time[0]))) {
        return false;
    } else if((parseInt(currTime[0])) === (parseInt(time[0]))) {
        if((parseInt(currTime[1])) > (parseInt(time[1]))) {
            return false;
        }
    }

    return true;
}

function makeMoreInfoTrainJSON(string) {
    if (string.length === 0) {
        return [];
    }

    let trains = [];
    let currentTrain = {};
    let canBeShown = true;

    var timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    let station = "";
    for(let index = 0; index < string.length; index++) {
        if(string[index] === '↦' || string[index] === '↤' || timePattern.test(string[index])) {
            currentTrain = {
                station: station,
                arriveAt: string[index],
                departAt: string[index + 1],
                trainType: string[index + 2],
                trainNumber: string[index + 3],
            }

            if (string[index + 1] !== '↤' && canBeShown === true) {
                canBeShown = checkDepart(string[index + 1].split(":"));
            }

            trains.push(currentTrain);
            index += 4;
            station = "";
        }
        station += string[index] + " ";
    }

    let result = {
        canBeShown: canBeShown,
        trains: trains,
    }

    return result;
}

function makeTrains(moreInfoJson, date, tomorrow, duration, numOfTransfers) {
    let currentTrain = {};
    let trains = [];

    if(numOfTransfers === 0) {
        currentTrain = {
            "from": moreInfoJson["trains"][0]["station"],
            "to": moreInfoJson["trains"][1]["station"],
            "depart": moreInfoJson["trains"][0]["departAt"],
            "arrive": moreInfoJson["trains"][1]["arriveAt"],
            "departDate": date,
            "arriveDate": "",
            "trainType": moreInfoJson["trains"][0]["trainType"],
            "trainNumber": moreInfoJson["trains"][0]["trainNumber"],
            "duration": duration,
            "timeToWaitNext": 0,
        };

        let arrayDep = moreInfoJson["trains"][0]["departAt"].split(":");
        let arrayArr = moreInfoJson["trains"][1]["arriveAt"].split(":");
        if((parseInt(arrayDep[0])) > (parseInt(arrayArr[0]))) {
            currentTrain["arriveDate"] = tomorrow;
        } else {
            currentTrain["arriveDate"] = date;
        }

        trains.push(currentTrain);
        return trains;
    }
    
    let isTomorrow = false;

    for(let index = 0; index < numOfTransfers + 1; index++) {
        // combine the info from the two jsons
        currentTrain = {
            "from": moreInfoJson["trains"][index]["station"],
            "to": moreInfoJson["trains"][index + 1]["station"],
            "depart": moreInfoJson["trains"][index]["departAt"],
            "arrive": moreInfoJson["trains"][index + 1]["arriveAt"],
            "departDate": isTomorrow ? tomorrow : date,
            "arriveDate": "",
            "trainType": moreInfoJson["trains"][index]["trainType"],
            "trainNumber": moreInfoJson["trains"][index]["trainNumber"],
            "duration": "",
            "timeToWaitNext": "",
        }

        let arrayDep = moreInfoJson["trains"][index]["departAt"].split(":");
        let arrayArr = moreInfoJson["trains"][index + 1]["arriveAt"].split(":");
        if((parseInt(arrayDep[0])) > (parseInt(arrayArr[0]))) {
            currentTrain["arriveDate"] = tomorrow;
            isTomorrow = true;
        } else {
            currentTrain["arriveDate"] = date;
        }

        let dep = moreInfoJson["trains"][index]["departAt"].split(":");
        let arr = moreInfoJson["trains"][index + 1]["arriveAt"].split(":");
        let depDate = new Date();
        let arrDate = new Date();

        depDate.setHours(dep[0]);
        depDate.setMinutes(dep[1]);
        arrDate.setHours(arr[0]);
        arrDate.setMinutes(arr[1]);

        let diff = arrDate.getTime() - depDate.getTime();
        let minutes = Math.floor(diff / 60000);

        // convert minutes to hours and minutes
        let hours = Math.floor(minutes / 60);
        let mins = minutes % 60;
        currentTrain["duration"] = hours.toString().padStart(2, '0') + ":" + mins.toString().padStart(2, '0');

        if(index !== moreInfoJson["trains"].length - 2) {

            dep = moreInfoJson["trains"][index + 1]["departAt"].split(":");

            depDate.setHours(dep[0]);
            depDate.setMinutes(dep[1]);

            diff = depDate.getTime() - arrDate.getTime();
            minutes = Math.floor(diff / 60000);

            //convert minutes to hours and minutes
            hours = Math.floor(minutes / 60);
            mins = minutes % 60;
            currentTrain["timeToWaitNext"] = hours.toString().padStart(2, '0') + ":" + mins.toString().padStart(2, '0');
            
        } else {
            currentTrain["timeToWaitNext"] = 0;
        }

        trains.push(currentTrain);
    }

    return trains;
}

function getDuration(string, fromIndex) {
    let duration = "";
    let index = fromIndex;
    for(; index < string.length - 1; index++) {
        if(string[index + 1] === "ч." || string[index + 1] === "h.") {
            duration = string[index];
            break;
        }
    }
    return [duration, index];
}

function makeJsonSchedule(string, moreInfoJson, date, tomorrow) 
{
    let trains = [];
    let currentTrain = {};
    let currentOption = {};
    let currentNumOfTransfers = 0;

    for(let index = 0, cycle = 0; index < string.length; index++, cycle++) {
        currentOption = moreInfoJson[cycle];

        if(currentOption === undefined || currentOption["canBeShown"] === false) {
            continue;
        }

        currentNumOfTransfers = currentOption["trains"].length - 2;

        currentTrain = {
            "duration": "",
            "departureTime": "",
            "arrivalTime": "",
            "departureDate": date,
            "arrivalDate": "",
            "numOfTransfers": 0,
            "trains": [],
        }

        currentTrain["numOfTransfers"] = currentNumOfTransfers;

        currentTrain["departureTime"] = currentOption["trains"][0]["departAt"];
        let arrayDep = currentTrain["departureTime"].split(":");
        currentTrain["arrivalTime"] = currentOption["trains"][currentNumOfTransfers + 1]["arriveAt"];
        let arrayArr = currentTrain["arrivalTime"].split(":");

        if((parseInt(arrayDep[0])) > (parseInt(arrayArr[0]))) {
            currentTrain["arrivalDate"] = tomorrow;
        } else {
            currentTrain["arrivalDate"] = date;
        }

        [currentTrain["duration"], index] = getDuration(string, index + 2);

        currentTrain["trains"] = makeTrains(currentOption, date, tomorrow, currentTrain["duration"], currentNumOfTransfers);

        trains.push(currentTrain);
        currentTrain = {};
    }
    
    return trains;
}

function getRoute(string) {
    let substrings = string.split(',');
    return substrings[0].trim();
}

function translateNumberToStation(number)
{
    const foundStation = stations.find((s) => parseInt(s.id) === parseInt(number));
    if (foundStation) {
      return foundStation.romanizedName;
    } else {
      return null; // Station not found
    }
}

async function getTrainsInfo(fromStationNumber, toStationNumber, date, tomorrow, language) {
    const fromStation = translateNumberToStation(fromStationNumber);
    const toStation = translateNumberToStation(toStationNumber);

    if (fromStation == null || toStation == null) {
        throw new Error('Station does not exist!');
    }

    const url = "https://razpisanie.bdz.bg/" + language + "/" + fromStation + "/" + toStation + "/" + date;

    const divSelector = '.schedule-table';

    let fullResponseInfo = [];

    let trainsInfo = {};

    let resultFromFullResponse = [];

    // Make a GET request to the webpage
    try {
        const response = await axios.get(url);

        // Load the HTML content of the page into Cheerio
        const $ = cheerio.load(response.data);

        $('[id^="via"]').each((index, element) => {
            let viaText = $(element).text();
            viaText = splitWords(viaText);

            if(index !== 0) {
                resultFromFullResponse = makeMoreInfoTrainJSON(viaText);

                if (resultFromFullResponse != []) {
                    fullResponseInfo.push(resultFromFullResponse);
                }
            }
        });

        // Select the specific <div> and extract all the text
        let divText = $(divSelector).text().trim();

        divText = splitWords(divText);

        let routeText = $('.show-schedule-search-form').text().trim();

        trainsInfo = makeJsonSchedule(divText, fullResponseInfo, date, tomorrow);

        let result = {
            "date": date,
            "route": getRoute(routeText),
            "totalTrains": trainsInfo.length,
            "options": trainsInfo,
        };

        return result;
    }
    catch(error) {
        console.error('Error fetching the webpage:', error);
    }
};

function formatDate(date) {
    let string = "";

    let day = date.getDate();

    string += day.toString().padStart(2, '0');

    string += ".";

    let month = date.getMonth() + 1;
    string += month.toString().padStart(2, '0');

    string += ".";

    string += date.getFullYear();
  
    return string;
}

router.get('/:language/:from/:to', async (req, res) => {
    let fromStation = null;
    let toStation = null;

    const language = req.params.language;

    if(language !== "bg" && language !== "en") {
        res.status(400).json({ error: 'Bad Request! Language does not exist!' });
        return;
    }

    try {
        fromStation = parseInt(req.params.from);
        toStation = parseInt(req.params.to);
    } catch (error) {
        console.error('Error:', error);
        res.status(400).json({ error: 'Bad Request! Stations numbers not correct!' });
        return;
    }

    const currentDate = new Date(); // Get the current date
    const formattedDate = formatDate(currentDate); // Format the date as a string

    let tomorrow = new Date();
    tomorrow.setDate(currentDate.getDate() + 1);
    const formattedTomorrow = formatDate(tomorrow);

    try {
        let trainsInfo = await getTrainsInfo(fromStation, toStation, formattedDate, formattedTomorrow, language);

        res.json(trainsInfo);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error!' });
    }
});

module.exports = router;