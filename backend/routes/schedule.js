// routes/schedule.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// time format
// "2023-11-15T14:29:39.3985234+02:00"

function splitWords(inputString) {

  let textWithoutSpaces = inputString.replace(/\s\s+/g, ' ');

  // Use a regular expression to split words by spaces
  textWithoutSpaces = textWithoutSpaces.split(/\s+/);

  // Filter out any empty strings
  // The words "Най-бързо" and "пътуване" are just confusing the algorithm so we remove them
  textWithoutSpaces = textWithoutSpaces.filter(word => word !== '' && word !== 'Най-бързо' && word !== 'пътуване');

  return textWithoutSpaces;
}

function makeTrainsToOption(trains) {
  // needed from trains: name, stations, depart, arrive, total_time, time_to_wait

  let result = [];

  for(let index = 0; index < trains.length; index++)
  {
    let currentTrain = {};

    let nameWithoutSpaces = splitWords(trains[index].name);

    let splitStations = trains[index].stations.split(" - ");

    currentTrain["from"] = splitStations[0].toLowerCase();
    currentTrain["to"] = splitStations[1].toLowerCase();
    
    currentTrain["from"] = splitStations[0].charAt(0).toUpperCase() + splitStations[0].slice(1).toLowerCase();
    currentTrain["to"] = splitStations[1].charAt(0).toUpperCase() + splitStations[1].slice(1).toLowerCase();

    currentTrain["depart"] = trains[index].depart;
    currentTrain["arrive"] = trains[index].arrive;
    currentTrain["depart_date"] = trains[index].depart_date;
    currentTrain["arrive_date"] = trains[index].arrive_date;

    currentTrain["train_type"] = nameWithoutSpaces[0];
    currentTrain["train_number"] = nameWithoutSpaces[1];

    currentTrain["duration"] = trains[index].total_time;

    if(trains[index].time_to_wait === "00:00")
      currentTrain["time_to_wait_next"] = 0;
    else
      currentTrain["time_to_wait_next"] = trains[index].time_to_wait;

    result.push(currentTrain);
  }

  return result;

}

function makeOptionsTrains(options) {
  // needed from options: total_time, depart_time, arrive_time, depart_date, arrive_date, num_of_transfers, transfer_stations, trains
  // needed from trains: name, stations, depart, arrive, total_time, time_to_wait

  let result = [];

  for(let index = 0; index < options.length; index++)
  {
    let currentOption = {};

    currentOption["duration"] = options[index].total_time;
    currentOption["departure_time"] = options[index].departure_time;
    currentOption["arrival_time"] = options[index].arrival_time;
    currentOption["departure_date"] = options[index].departure_date;
    currentOption["arrival_date"] = options[index].arrival_date;
    currentOption["num_of_transfers"] = options[index].trains.length - 1;

    currentOption["trains"] = makeTrainsToOption(options[index].trains);

    result.push(currentOption);
  }

  return result;
}

const get_trains_info = async (fromStation, toStation, date) => {
  // translate stations!!!
  //let from = fromStation.toUpperCase();
  //let to = toStation.toUpperCase();

  //from = translateStation(from);
  //to = translateStation(to);


  const response = await axios.post('https://tickets.bdz.bg/portal/api/POSRoute/Trains', [
    {
      "station_from": fromStation,
      "station_to": toStation,
      "date": date
    }
  ], {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (response.status !== 200) {
    throw Error(response.message);
  }

  //needed: date, name, options
  // needed from options: total_time, depart_time, arrive_time, depart_date, arrive_date, num_of_transfers, transfer_stations, trains
  // needed from trains: name, stations, depart, arrive, total_time, time_to_wait

  let result = {}
  result["date"] = response.data[0].date;
  result["route"] = response.data[0].name;

  result["options"] = makeOptionsTrains(response.data[0].options);

  return result;
};

function formatDate(date) {
  let string = "";
  string += date.getFullYear();
  string += "-";
  let month = date.getMonth() + 1;
  string += month.toString().padStart(2, '0');
  string += "-";

  let day = date.getDate();
  //let day = 19;

  string += day.toString().padStart(2, '0');
  string += "T";
  let hours = date.getHours();
  string += hours.toString().padStart(2, '0');
  string += ":";
  let minutes = date.getMinutes();
  string += minutes.toString().padStart(2, '0');
  string += ":";
  let seconds = date.getSeconds();
  string += seconds.toString().padStart(2, '0');
  string += ".";
  string += "0000000"
  string += "+02:00";

  //console.log(string);

  return string;
}

const stations = require('../stations.json');

function translateStation(station) {
  const foundStation = stations.find((s) => s.romanizedName === station);
  if (foundStation) {
    return foundStation.id;
  } else {
    return null; // Station not found
  }
}

router.get('/:from/:to/:date', async (req, res) => {
  const from = req.params.from;
  const to = req.params.to;

  const fromStationID = translateStation(from);
  const toStationID = translateStation(to);

  const date = req.params.date;
  const formattedDate = formatDate(new Date(date)); // Format the date as a string

  try {
    let trains_info = await get_trains_info(fromStationID, toStationID, formattedDate);

    res.json(trains_info);
  } catch (error) {
    // Handle the error appropriately, e.g., send an error response
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;