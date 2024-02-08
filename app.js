// app.js
const express = require('express');
var cors = require('cors');
const path = require('path');

// const apiRoutes = require('./routes/api');
const liveRoutes = require('./routes/live');
const trainInfoRoutes = require('./routes/trainInfo');
const scheduleRoutes = require('./routes/schedule');
const scheduleSecRoutes = require('./routes/schedule-sec');
const guide = require('./routes/guide');
const guideTopics = require('./routes/guide-topics');

const app = express();
const port = 3000;

app.use(cors())

// Serve static images from the '/guide/images' directory
app.use('/guide/images', express.static(path.join(__dirname, 'guide', 'images')));

// app.use('/api', apiRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/train-info', trainInfoRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/schedule', scheduleSecRoutes);
app.use('/api/guide', guide);
app.use('/api/guide', guideTopics);

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
