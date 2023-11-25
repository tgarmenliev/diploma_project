// routes/api.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

async function getNomenclatures() {
  const response = await axios.get('https://tickets.bdz.bg/portal/api/Nomenclatures/GetNomenclatures');
  return response.data;
}

function romanizeBulgarian(text) {
  const bulgarianToRoman = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'j',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'sht',
    ъ: 'a',
    ь: 'j',
    ю: 'ju',
    я: 'ja',
    '.': '', // Remove dots
  };

  const words = text
    .replace(/[-\s.]+/g, '-') // Replace multiple spaces, dots, and dashes with a single dash
    .split('-');

  const romanizedWords = words.map(word => {
    // Special case: if the word is "СП.", convert it to "st"
    console.log(word);
    if (word.toLowerCase() === 'сп') {
      return 'st';
    }

    return word
      .toLowerCase()
      .split('')
      .map(char => bulgarianToRoman[char] || char)
      .join('');
  });

  // Remove the trailing dash if it exists
  const result = romanizedWords.join('-').replace(/-$/, '');

  return result;
}

function translateStations(nomenclatures) {
  let result = [];
  let current = {};

  nomenclatures.stations.forEach(st => {
    current = {
      id: st.id,
      name: st.name,
      romanizedName: romanizeBulgarian(st.name),
    };
    result.push(current);
  });

  return result;
}

router.get('/:station', async (req, res) => {
  let station = req.params.station;

  try {
    //let result = await getNomenclatures();

    let translated = translateStations(await getNomenclatures());

    res.json(translated);

  } catch (error) {
    // Handle the error appropriately, e.g., send an error response
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
