const bodyParser = require('body-parser');
const express = require('express');
const router = require('./routes/router');
const cors = require('cors');
const app = express();
require('dotenv').config();

const port = process.env.APP_PORT ? process.env.APP_PORT : '3000';

app.use(bodyParser.json());
app.use(cors());

app.use('/', router);

app.use(function(req, res, next) {
    res.status(404).json({
      message: "Page Not Found"
    })
  });
  
  // error handler
  app.use(function(err, req, res, next) {
    res.status(err.status || 500).json({
      message: "Error Message"
    })
  });

app.listen(port, '0.0.0.0', () => console.log(`Server running at ${port}`))