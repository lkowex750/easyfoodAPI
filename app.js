const express = require('express')
const app = express()
const userRoute = require('./api/routes/users')
const postRoute = require('./api/routes/post')
const bodyParser = require('body-parser')
const path = require('path')



app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads',express.static(__dirname + '/uploads'))
app.use('/uploadProfile',express.static(__dirname + '/uploadProfile'))
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

app.use('/users',userRoute)
app.use('/post',postRoute)



module.exports = app