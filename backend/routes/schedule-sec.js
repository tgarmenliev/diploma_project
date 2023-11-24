// routes/schedule-sec.js
const express = require('express');
const router = express.Router();

const axios = require('axios');
const cheerio = require('cheerio');


function makeMoreInfoTrainJSON(string) {
    let trains = [];
    let curr_train = {};

    var timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    for(let i = 0; i < string.length;) {

        curr_train = {
            station: string[i],
            arrive_at: string[i+1],
            depart_at: string[i+2],
            train_type: string[i+3],
            train_number: string[i+4]
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

function makeTrains(fromStation, toStation, moreInfoJson, transfer_stations, date, tommorow, duration) {
    let curr_train = {};
    let trains = [];

    if(transfer_stations.length === 0) {
        curr_train = {
            "from": fromStation,
            "to": toStation,
            "depart": moreInfoJson[0]["depart_at"],
            "arrive": moreInfoJson[1]["arrive_at"],
            "depart_date": date,
            "arrive_date": "",
            "train_type": moreInfoJson[0]["train_type"],
            "train_number": moreInfoJson[0]["train_number"],
            "duration": duration,
            "time_to_wait_next": 0,
        };

        let arrayDep = moreInfoJson[0]["depart_at"].split(":");
        let arrayArr = moreInfoJson[1]["arrive_at"].split(":");
        if((parseInt(arrayDep[0])) > (parseInt(arrayArr[0]))) {
            curr_train["arrive_date"] = tommorow;
        } else {
            curr_train["arrive_date"] = date;
        }

        trains.append(curr_train);
        return trains;
    }
    
    let isTommorow = false;

    for(let i = 0; i < moreInfoJson.length - 1; i++) {
        // combine the info from the two jsons
        curr_train = {
            "from": i === 0 ? fromStation : transfer_stations[i - 1],
            "to": i === moreInfoJson.length - 2 ? toStation : transfer_stations[i],
            "depart": moreInfoJson[i]["depart_at"],
            "arrive": moreInfoJson[i + 1]["arrive_at"],
            "depart_date": isTommorow ? tommorow : date,
            "arrive_date": "",
            "train_type": moreInfoJson[i]["train_type"],
            "train_number": moreInfoJson[i]["train_number"],
            "duration": "",
            "time_to_wait_next": "",
        }

        let arrayDep = moreInfoJson[i]["depart_at"].split(":");
        let arrayArr = moreInfoJson[i + 1]["arrive_at"].split(":");
        if((parseInt(arrayDep[0])) > (parseInt(arrayArr[0]))) {
            curr_train["arrive_date"] = tommorow;
            isTommorow = true;
        } else {
            curr_train["arrive_date"] = date;
        }

        let dep = moreInfoJson[i]["depart_at"].split(":");
        let arr = moreInfoJson[i + 1]["arrive_at"].split(":");
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

            dep = moreInfoJson[i + 1]["depart_at"].split(":");

            depDate.setHours(dep[0]);
            depDate.setMinutes(dep[1]);

            diff = depDate.getTime() - arrDate.getTime();
            minutes = Math.floor(diff / 60000);

            //convert minutes to hours and minutes
            hours = Math.floor(minutes / 60);
            mins = minutes % 60;
            curr_train["time_to_wait_next"] = hours.toString().padStart(2, '0') + ":" + mins.toString().padStart(2, '0');
            
        } else {
            curr_train["time_to_wait_next"] = 0;
        }

        trains.push(curr_train);
    }

    return trains;
}

function makeJsonSchedule(string, numOfTransfers, moreInfoJson, date, tommorow) {

    let trains = [];
    let curr_train = {};

    for(let index = 0, curr_cycle = 1; index < string.length; index++, curr_cycle++) {

        let transfer_stations = [];

        //console.log(string);

        index++;

        fromStation = string[index];

        curr_train = {
            "duration": "",
            "departure_time": "",
            "arrival_time": "",
            "departure_date": date,
            "arrival_date": "",
            "num_of_transfers": 0,
            "trains": [],
        }
        
        index += 2;

        for(let j = 0; j < numOfTransfers[curr_cycle]; j++) {
            transfer_stations.push(string[index]);
            index += 2;
        }

        curr_train["num_of_transfers"] = transfer_stations.length;
        toStation = string[index++];
        curr_train["departure_time"] = string[index];

        let arrayDep = string[index].split(":");

        // Skip dashes
        index += 2;

        curr_train["arrival_time"] = string[index];

        let arrayArr = string[index].split(":");

        if((parseInt(arrayDep[0])) > (parseInt(arrayArr[0]))) {
            curr_train["arrival_date"] = tommorow;
        } else {
            curr_train["arrival_date"] = date;
        }

        // Skip useless info
        index += 5;

        curr_train["duration"] = string[index];

        //curr_train["trains"] = moreInfoJson[curr_cycle - 1];

        //curr_train["trains"] = transfer_stations;

        curr_train["trains"] = makeTrains(fromStation, toStation, moreInfoJson[curr_cycle - 1], transfer_stations, date, tommorow, curr_train["duration"]);

        // Continue to the next train
        index++;

        trains.push(curr_train);
        curr_train = {};
    }
    
    return trains;
}

function splitWords(inputString) {

    let textWithoutSpaces = inputString.replace(/\s\s+/g, ' ');
  
    // Use a regular expression to split words by spaces
    textWithoutSpaces = textWithoutSpaces.split(/\s+/);
  
    // Filter out any empty strings
    // The words "Най-бързо" and "пътуване" are just confusing the algorithm so we remove them
    textWithoutSpaces = textWithoutSpaces.filter(word => word !== '' && word !== 'Най-бързо' && word !== 'пътуване');

    return textWithoutSpaces;
}

function getRoute(string) {
    let route = "";
    
    var timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    for(let index = 1; index < string.length; index++) {
        if (timePattern.test(string[index])) {
            break;
          }
    
          if(route !== "") {
            route += " ";
          }
    
          route += string[index];
    }

    return route.toUpperCase();
}

async function get_trains_info(fromStation, toStation, date, tommorow) {
    const url = "https://razpisanie.bdz.bg/bg/" + fromStation + "/" + toStation + "/" + date;

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

        trainsInfo = makeJsonSchedule(divText, numOfTransfers, fullResponseInfo, date, tommorow);

        // translate from and to stations!!!!!

        let result = {
            "date": date,
            "route": getRoute(divText),
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
    // let day = 19;

    string += day.toString().padStart(2, '0');

    string += ".";

    let month = date.getMonth() + 1;
    string += month.toString().padStart(2, '0');

    string += ".";

    string += date.getFullYear();
  
    //console.log(string);
  
    return string;
}

  
router.get('/:from/:to', async (req, res) => {
    const fromStation = req.params.from;
    const toStation = req.params.to;

    const currentDate = new Date(); // Get the current date
    const formattedDate = formatDate(currentDate); // Format the date as a string

    let tommorow = new Date();
    tommorow.setDate(currentDate.getDate() + 1);
    const formattedTommorow = formatDate(tommorow);

    try {
        let trains_info = await get_trains_info(fromStation, toStation, formattedDate, formattedTommorow);

        res.json(trains_info);
    } catch (error) {
        // Handle the error appropriately, e.g., send an error response
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;