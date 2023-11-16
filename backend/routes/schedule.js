// routes/schedule.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// time format
// "2023-11-15T14:29:39.3985234+02:00"

const get_trains_info = async (fromStation, toStation, date) => {
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

  //needed: name, stations, depart, arrive, total_time, distance

  var length = response.data[0].options.length;
  var trains = [];
  for (var i = 0; i < length; i++) {
    let item = response.data[0].options[i];
    var train = {
      name: item.trains[0].name,
      stations: item.trains[0].stations,
      depart: item.trains[0].depart,
      arrive: item.trains[0].arrive,
      total_time: item.trains[0].total_time,
      distance: item.trains[0].distance
    }
    trains.push(train);
  }

  return trains;
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

/*router.get('/:from/:to', async (req, res) => {
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
});*/

router.get('/:from/:to/:date', async (req, res) => {
  const from = req.params.from;
  const to = req.params.to;

  const date = req.params.date;
  const formattedDate = formatDate(new Date(date)); // Format the date as a string

  try {
    let trains_info = await get_trains_info(from, to, formattedDate);

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