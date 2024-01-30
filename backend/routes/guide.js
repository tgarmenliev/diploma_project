// routes/guide.js
const express = require('express');
const router = express.Router();

const topic1 = require('../guide/texts/topic1.json');
const topic2 = require('../guide/texts/topic2.json');
const topic3 = require('../guide/texts/topic3.json');
const topic4 = require('../guide/texts/topic4.json');
const topic5 = require('../guide/texts/topic5.json');
const topic6 = require('../guide/texts/topic6.json');
const topic7 = require('../guide/texts/topic7.json');
const topic8 = require('../guide/texts/topic8.json');
const topic9 = require('../guide/texts/topic9.json');
const topic10 = require('../guide/texts/topic10.json');
const topic11 = require('../guide/texts/topic11.json');

const getTopic = (topic) => {
    switch (topic) {
        case 1:
            return topic1;
        case 2:
            return topic2;
        case 3:
            return topic3;
        case 4:
            return topic4;
        case 5:
            return topic5;
        case 6:
            return topic6;
        case 7:
            return topic7;
        case 8:
            return topic8;
        case 9:
            return topic9;
        case 10:
            return topic10;
        case 11:
            return topic11;
        default:
            return null;
    }
}

router.get('/:language/:topic', async (req, res) => {
  const language = req.params.language;
  if(language !== "bg" && language !== "en") {
      res.status(400).json({ error: 'Language not provided' });
      return;
  }

  let topic = null;

  try {
      topic = parseInt(req.params.topic);
  } catch (error) {
      // Handle the error appropriately, e.g., send an error response
      console.error('Error:', error);
      res.status(400).json({ error: 'Bad Request for guide!' });
      return;
  }

  if (topic < 1 || topic > 11) {
    res.status(404).json({ error: 'Topic not found!' });
    return;
  }

  try {
    let result = getTopic(topic);

    res.json(result);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error with access to the guide!' });
  }
});
  
module.exports = router;