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

function makeMoreInfoTrainJSON(string) {
    let trains = [];
    let curr_train = {};

    var timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    for(let i = 0; i < string.length;) {

        curr_train = {
            station: string[i],
            arriveAt: string[i+1],
            departAt: string[i+2],
            trainType: string[i+3],
            trainNumber: string[i+4]
        }

        i += 5;

        if(i + 2 < string.length) {
            if((!timePattern.test(string[i + 1])) && (string[i + 1] !== '↦') && (string[i + 1] !== '↤')) {
                i += 1;
            }
        }

        trains.push(curr_train);

        if(string.length - i < 5)
            break;
    }

    return trains;
}

function makeTrains(fromStation, toStation, moreInfoJson, transfer_stations, date, tomorrow, duration) {
    let curr_train = {};
    let trains = [];

    if(transfer_stations.length === 0) {
        curr_train = {
            "from": fromStation,
            "to": toStation,
            "depart": moreInfoJson[0]["departAt"],
            "arrive": moreInfoJson[1]["arriveAt"],
            "departDate": date,
            "arriveDate": "",
            "trainType": moreInfoJson[0]["trainType"],
            "trainNumber": moreInfoJson[0]["trainNumber"],
            "duration": duration,
            "timeToWaitNext": 0,
        };

        let arrayDep = moreInfoJson[0]["departAt"].split(":");
        let arrayArr = moreInfoJson[1]["arriveAt"].split(":");
        if((parseInt(arrayDep[0])) > (parseInt(arrayArr[0]))) {
            curr_train["arriveDate"] = tomorrow;
        } else {
            curr_train["arriveDate"] = date;
        }

        trains.push(curr_train);
        return trains;
    }
    
    let isTomorrow = false;

    for(let i = 0; i < moreInfoJson.length - 1; i++) {
        // combine the info from the two jsons
        curr_train = {
            "from": i === 0 ? fromStation : transfer_stations[i - 1],
            "to": i === moreInfoJson.length - 2 ? toStation : transfer_stations[i],
            "depart": moreInfoJson[i]["departAt"],
            "arrive": moreInfoJson[i + 1]["arriveAt"],
            "departDate": isTomorrow ? tomorrow : date,
            "arriveDate": "",
            "trainType": moreInfoJson[i]["trainType"],
            "trainNumber": moreInfoJson[i]["trainNumber"],
            "duration": "",
            "timeToWaitNext": "",
        }

        let arrayDep = moreInfoJson[i]["departAt"].split(":");
        let arrayArr = moreInfoJson[i + 1]["arriveAt"].split(":");
        if((parseInt(arrayDep[0])) > (parseInt(arrayArr[0]))) {
            curr_train["arriveDate"] = tomorrow;
            isTomorrow = true;
        } else {
            curr_train["arriveDate"] = date;
        }

        let dep = moreInfoJson[i]["departAt"].split(":");
        let arr = moreInfoJson[i + 1]["arriveAt"].split(":");
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
        curr_train["duration"] = hours.toString().padStart(2, '0') + ":" + mins.toString().padStart(2, '0');

        if(i !== moreInfoJson.length - 2) {

            dep = moreInfoJson[i + 1]["departAt"].split(":");

            depDate.setHours(dep[0]);
            depDate.setMinutes(dep[1]);

            diff = depDate.getTime() - arrDate.getTime();
            minutes = Math.floor(diff / 60000);

            //convert minutes to hours and minutes
            hours = Math.floor(minutes / 60);
            mins = minutes % 60;
            curr_train["timeToWaitNext"] = hours.toString().padStart(2, '0') + ":" + mins.toString().padStart(2, '0');
            
        } else {
            curr_train["timeToWaitNext"] = 0;
        }

        trains.push(curr_train);
    }

    return trains;
}

function checkHowManyTrainLseft(trains) 
{
    let currDate = new Date();
    let currTime = currDate.getHours() + ":" + currDate.getMinutes();

    let arrayCurrTime = currTime.split(":");

    let left = trains.length;

    for(let i = 0; i < trains.length; i++) {
        let dep = trains[i]["departureTime"].split(":");

        if((parseInt(arrayCurrTime[0])) > (parseInt(dep[0]))) {
            left--;
        } else if((parseInt(arrayCurrTime[0])) === (parseInt(dep[0]))) {
            if((parseInt(arrayCurrTime[1])) > (parseInt(dep[1]))) {
                left--
            }
        }
    }

    return left;

}

function makeJsonSchedule(string, numOfTransfers, moreInfoJson, date, tomorrow) 
{
    let trains = [];
    let curr_train = {};

    for(let index = 0, curr_cycle = 1; index < string.length; index++, curr_cycle++) {

        let transfer_stations = [];

        index++;

        fromStation = string[index];

        curr_train = {
            "duration": "",
            "departureTime": "",
            "arrivalTime": "",
            "departureDate": date,
            "arrivalDate": "",
            "numOfTransfers": 0,
            "trains": [],
        }
        
        index += 2;

        for(let j = 0; j < numOfTransfers[curr_cycle]; j++) {
            transfer_stations.push(string[index]);
            index += 2;
        }

        curr_train["numOfTransfers"] = transfer_stations.length;
        toStation = string[index++];
        curr_train["departureTime"] = string[index];

        let arrayDep = string[index].split(":");

        // Skip dashes
        index += 2;

        curr_train["arrivalTime"] = string[index];

        let arrayArr = string[index].split(":");

        if((parseInt(arrayDep[0])) > (parseInt(arrayArr[0]))) {
            curr_train["arrivalDate"] = tomorrow;
        } else {
            curr_train["arrivalDate"] = date;
        }

        // Skip useless info
        index += 5;

        curr_train["duration"] = string[index];

        curr_train["trains"] = makeTrains(fromStation, toStation, moreInfoJson[curr_cycle - 1], transfer_stations, date, tomorrow, curr_train["duration"]);

        // Continue to the next train
        index++;

        trains.push(curr_train);
        curr_train = {};
    }

    const left = checkHowManyTrainLseft(trains);
    if(left === 0) {
        trains = [];
    } else {
        trains = trains.slice(trains.length - left, trains.length);
    }
    
    return trains;
}

function getRoute(string)
{
    let route = "";
    
    var timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    for(let index = 1; index < string.length; index++) {
        if(index === 1) {
            route += string[index];
        }

        if (timePattern.test(string[index + 1])) {
            route += " - ";
            route += string[index];
            break;
        }
    }

    return capitalizeFirstLetterOfRoute(route);
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

async function get_trains_info(fromStationNumber, toStationNumber, date, tomorrow, language) {
    const fromStation = translateNumberToStation(fromStationNumber);
    const toStation = translateNumberToStation(toStationNumber);

    if (fromStation == null || toStation == null) {
        throw new Error('Station does not exist!');
    }

    const url = "https://razpisanie.bdz.bg/" + language + "/" + fromStation + "/" + toStation + "/" + date;

    const divSelector = '.schedule-table';

    let fullResponseInfo = [];

    let numOfTransfers = [];

    let trainsInfo = {};

    // Make a GET request to the webpage
    try {
        const response = await axios.get(url);

        // Load the HTML content of the page into Cheerio
        const $ = cheerio.load(response.data);

        $('[id^="via"]').each((index, element) => {
            let viaText = $(element).text();
            viaText = splitWords(viaText);

            numOfTransfers[index] = ((viaText.length / 5) - 2).toFixed();

            if(index !== 0) {
                fullResponseInfo.push(makeMoreInfoTrainJSON(viaText));
            }
        });

        // Select the specific <div> and extract all the text
        let divText = $(divSelector).text().trim();

        divText = splitWords(divText);

        trainsInfo = makeJsonSchedule(divText, numOfTransfers, fullResponseInfo, date, tomorrow);

        let result = {
            "date": date,
            "route": getRoute(divText),
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
        let trains_info = await get_trains_info(fromStation, toStation, formattedDate, formattedTomorrow, language);

        res.json(trains_info);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error!' });
    }
});

module.exports = router;