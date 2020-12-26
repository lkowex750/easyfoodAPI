const express = require('express')
const app = express()
const userRoute = require('./api/routes/users')
const bodyParser = require('body-parser')


app.use(bodyParser.json())

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

app.use('/users',userRoute)

module.exports = app