// routes/schedule-sec.js
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

async function get_trains_info(fromStation, toStation, date) {
    const url = "https://razpisanie.bdz.bg/bg/" + fromStation + "/" + toStation + "/" + date;

    const divSelector = '.p-2'; // Replace with your actual selector

    let trainInfo = {};

    // Make a GET request to the webpage
    try {
        const response = await axios.get(url);

        // Load the HTML content of the page into Cheerio
        const $ = cheerio.load(response.data);

        // Select the specific <div> and extract all the text
        const divText = $(divSelector).text().trim();

        trainInfo = splitWords(divText);

        return trainInfo;
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
  
    console.log(string);
  
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