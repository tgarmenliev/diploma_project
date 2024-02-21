// routes/guide-topics.js
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
const topic12 = require('../guide/texts/topic12.json');

const allTopics = [topic1, topic2, topic3, topic4, topic5, topic6, topic7, topic8, topic9, topic10, topic11, topic12];

function makeAllTopicsJson(language) {
    let result = [];

    for(let index = 0; index < allTopics.length; index++) {
        currentResult = {
            "id": index,
            "title": language === "bg" ? allTopics[index].title : allTopics[index].englishTitle,
            "subtitle": language === "bg" ? allTopics[index].subtitle : allTopics[index].englishSubtitle,
            "image": allTopics[index].image
        }
        result.push(currentResult);
    }

    return result;
}

router.get('/:language', async (req, res) => {
    const language = req.params.language;
    if(language !== "bg" && language !== "en") {
        res.status(400).json({ error: 'Bad request! Language not provided!' });
        return;
    }
  
    try {
      res.json(makeAllTopicsJson(language));
  
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error with access to the guide!' });
    }
  });
    
  module.exports = router;