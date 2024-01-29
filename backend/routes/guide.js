// routes/guide.js
const express = require('express');
const router = express.Router();

const topic1 = require('../guide/texts/topic1.json');

router.get('/:topic', async (req, res) => {
    let topic = req.params.topic;
  
    try {
  
      res.json(topic1);
  
    } catch (error) {
      // Handle the error appropriately, e.g., send an error response
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error with access to the guide!' });
    }
});
  
module.exports = router;