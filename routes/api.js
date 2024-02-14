// routes/api.js
const express = require('express');
const router = express.Router();

router.get('/:train', async (req, res) => {
  let train = req.params.train;

  try {
    res.json({ train: train });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
