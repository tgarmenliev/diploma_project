// routes/schedule.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const stations = require('../stations.json');

function transliterateBulgarianToEnglish(text) {
  const cyrillicMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
    'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'y', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'Zh', 'З': 'Z',
    'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
    'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch',
    'Ш': 'Sh', 'Щ': 'Sht', 'Ъ': 'A', 'Ь': 'Y', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text.split('').map(char => cyrillicMap[char] || char).join('');
}

function translateStationToEnglish(station) {
  let foundStation = stations.find((s) => s.name === station.toUpperCase());
  if (foundStation) {
    foundStation = foundStation.romanizedName.replace(/-/g, ' ');
    foundStation = foundStation.replace(/(?:^|\s)\S/g, (match) => match.toUpperCase());
    return foundStation;
  } else {
    return null; // Station not found
  }
}

function capitalizeFirstLetterOfRoute(route) {
  return route.toLowerCase().replace(/(?:^|\s)\S/g, (match) => match.toUpperCase());
}

function translateTrainType(trainType) {
  switch(trainType) {
    case "ПВ":
      return "RT";
    case "БВ":
      return "ICF";
    case "КПВ":
      return "SCT";
    case "МБВ":
      return "CCI";
  }
}

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

function makeTrainsToOption(trains, language = 'bg') {
  // needed from trains: name, stations, depart, arrive, total_time, time_to_wait

  let result = [];

  for(let index = 0; index < trains.length; index++)
  {
    let currentTrain = {};

    let nameWithoutSpaces = splitWords(trains[index].name);

    let splitStations = trains[index].stations.split(" - ");

    //currentTrain["from"] = splitStations[0].toLowerCase();
    //currentTrain["to"] = splitStations[1].toLowerCase();
    
    currentTrain["from"] = splitStations[0].charAt(0).toUpperCase() + splitStations[0].slice(1).toLowerCase();
    currentTrain["to"] = splitStations[1].charAt(0).toUpperCase() + splitStations[1].slice(1).toLowerCase();

    if (language === 'en') {
      currentTrain["from"] = translateStationToEnglish(currentTrain["from"]);
      currentTrain["to"] = translateStationToEnglish(currentTrain["to"]);
    }
    
    currentTrain["depart"] = trains[index].depart;
    currentTrain["arrive"] = trains[index].arrive;
    currentTrain["departDate"] = trains[index].depart_date;
    currentTrain["arriveDate"] = trains[index].arrive_date;

    currentTrain["trainType"] = nameWithoutSpaces[0];
    if(language === 'en') {
      currentTrain["trainType"] = translateTrainType(currentTrain["trainType"]);
    }
    currentTrain["trainNumber"] = nameWithoutSpaces[1];

    currentTrain["duration"] = trains[index].total_time;

    if(trains[index].time_to_wait === "00:00")
      currentTrain["timeToWaitNext"] = 0;
    else
      currentTrain["timeToWaitNext"] = trains[index].time_to_wait;

    result.push(currentTrain);
  }

  return result;

}

function makeOptionsTrains(options, language = 'bg') {
  // needed from options: total_time, depart_time, arrive_time, depart_date, arrive_date, num_of_transfers, transfer_stations, trains
  // needed from trains: name, stations, depart, arrive, total_time, time_to_wait

  let result = [];

  for(let index = 0; index < options.length; index++)
  {
    let currentOption = {};

    currentOption["duration"] = options[index].total_time;
    currentOption["departureTime"] = options[index].departure_time;
    currentOption["arrivalTime"] = options[index].arrival_time;
    currentOption["departureDate"] = options[index].departure_date;
    currentOption["arrivalDate"] = options[index].arrival_date;
    currentOption["numOfTransfers"] = options[index].trains.length - 1;

    currentOption["trains"] = makeTrainsToOption(options[index].trains, language);

    result.push(currentOption);
  }

  return result;
}

const get_trains_info = async (fromStation, toStation, date, language) => {
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
  result["route"] = capitalizeFirstLetterOfRoute(response.data[0].name);
  if(language === 'en') {
    result["route"] = transliterateBulgarianToEnglish(result["route"]);
  }

  result["totalTrains"] = 0;
  result["options"] = makeOptionsTrains(response.data[0].options, language);
  result["totalTrains"] = result["options"].length;

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

// function translateStation(station) {
//   const foundStation = stations.find((s) => s.romanizedName === station);
//   if (foundStation) {
//     return foundStation.id;
//   } else {
//     return null; // Station not found
//   }
// }

router.get('/:language/:from/:to/:date', async (req, res) => {
  let fromStation = null;
  let toStation = null;
  const language = req.params.language;

  if (language !== 'bg' && language !== 'en') {
    res.status(400).json({ error: 'Invalid language' });
    return;
  }

  try {
    fromStation = parseInt(req.params.from);
    toStation = parseInt(req.params.to);
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({ error: 'Bad Request' });
    return;
  }

  //const fromStationID = translateStation(from);
  //const toStationID = translateStation(to);

  const date = req.params.date;
  const formattedDate = formatDate(new Date(date)); // Format the date as a string

  try {
    let trains_info = await get_trains_info(fromStation, toStation, formattedDate, language);

    res.json(trains_info);
  } catch (error) {
    // Handle the error appropriately, e.g., send an error response
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;