// routes/guide.js

// Import required modules
const express = require('express');
const router = express.Router();

// Import the JSON files with the guide topics
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

// Function to get the topic by its number and make the response in the requested language
const getTopic = (topic, language) => {
    chosenTopic = allTopics[topic];
    result = {
        "title": language === "bg" ? chosenTopic.title : chosenTopic.englishTitle,
        "subtitle": language === "bg" ? chosenTopic.subtitle : chosenTopic.englishSubtitle,
        "image": chosenTopic.image,
        "content": []
    }

    for(let index = 0; index < chosenTopic.content.length; index++) {
        currentContent = {
            "text": language === "bg" ? chosenTopic.content[index].text : chosenTopic.content[index].englishText,
        };
        if(chosenTopic.content[index].image) {
            currentContent.image = chosenTopic.content[index].image;
        }
        result.content.push(currentContent);
    }

    return result;
}

// Define the route for the guide
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
      res.status(400).json({ error: 'Bad Request! Please provide valid number for topic!' });
      return;
  }

  if (topic < 0 || topic > (allTopics.length - 1)) {
    res.status(404).json({ error: 'Bad Request! Topic not found!' });
    return;
  }

  try {
    let result = getTopic(topic, language);

    res.json(result);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error with access to guide topic!' });
  }
});
  
module.exports = router;