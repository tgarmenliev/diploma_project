// app.js
const express = require('express');
var cors = require('cors')

// const apiRoutes = require('./routes/api');
const liveRoutes = require('./routes/live');
const trainInfoRoutes = require('./routes/trainInfo');
const scheduleRoutes = require('./routes/schedule');
const scheduleSecRoutes = require('./routes/schedule-sec');

const app = express();
const port = 3000;

app.use(cors())

// app.use('/api', apiRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/train-info', trainInfoRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/schedule', scheduleSecRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
