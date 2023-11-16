// routes/schedule-sec.js
const express = require('express');
const router = express.Router();

const axios = require('axios');
const cheerio = require('cheerio');


function makeMoreInfoTrainJSON(string) {
    // error check
    if(string.length % 5 !== 0) {
        return null;
    }

    let trains = [];
    let curr_train = {};
    
    for(let i = 0; i < string.length; i+=5) {

        curr_train = {
            station: string[i],
            arrive_at: string[i+1],
            depart_at: string[i+2],
            train_type: string[i+3],
            train_number: string[i+4]
        }

        trains.push(curr_train);
    }

    return trains;
}

function makeJsonSchedule(string, numOfTransfers, moreInfoJson) {

    let trains = [];
    let curr_train = {};

    for(let index = 0, curr_cycle = 1; index < string.length; index++, curr_cycle++) {

        let transfer_stations = [];

        index++;
        curr_train = {
            from: string[index]
        }
        index += 2;

        for(let j = 0; j < numOfTransfers[curr_cycle]; j++) {
            transfer_stations.push(string[index]);
            index += 2;
        }

        curr_train["num_of_transfers"] = numOfTransfers[curr_cycle];
        curr_train["transfer_stations"] = transfer_stations;
        curr_train["to"] = string[index++];
        curr_train["depart"] = string[index++];

        // Skip dashes
        index++;

        curr_train["arrive"] = string[index++];

        // Skip useless info
        index += 2;

        curr_train["train_type"] = string[index++];
        curr_train["train_number"] = string[index++];
        curr_train["duration"] = string[index];
        curr_train["more_info"] = moreInfoJson[curr_cycle - 1];

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

async function get_trains_info(fromStation, toStation, date) {
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

        trainsInfo = makeJsonSchedule(divText, numOfTransfers, fullResponseInfo);

        return trainsInfo;
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

    try {
        let trains_info = await get_trains_info(fromStation, toStation, formattedDate);
        
        const data = {
            trains_info: trains_info
        };

        res.json(data);
    } catch (error) {
        // Handle the error appropriately, e.g., send an error response
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;