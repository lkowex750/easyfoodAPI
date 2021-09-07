const express = require('express')
const app = express()
const userRoute = require('./api/routes/users')
const postRoute = require('./api/routes/post')
const followRoute = require('./api/routes/follow')
const bodyParser = require('body-parser')
const path = require('path')

//Project

const userRoutePJ = require('./api/routes/PJ_users')
const postRoutePJ = require('./api/routes/PJ_post')
const followRoutePJ = require('./api/routes/PJ_follow')
const notiRoutePJ = require('./api/routes/PJ_noti')


// app.use(bodyParser.json())
// //app.use(express.bodyParser({limit: '50mb'}))
// app.use(bodyParser.urlencoded({ extended: true }));

app.use( bodyParser.json({limit: '50mb'}) );
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit:50000
}));

app.use('/uploads',express.static(__dirname + '/uploads'))
app.use('/uploadProfile',express.static(__dirname + '/uploadProfile'))

app.use('/uploadProfilePj',express.static(__dirname + '/uploadProfilePj'))
app.use('/uploadHowto',express.static(__dirname + '/uploadHowto'))
app.use('/uploadIngredients_file',express.static(__dirname + '/uploadIngredients_file'))
app.use('/uploadPost',express.static(__dirname + '/uploadPost'))
app.use('/uploadWallpaper',express.static(__dirname + '/uploadWallpaper'))

app.use(function(req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, authorization ");
    
    next();
  });

app.use('/users',userRoute)
app.use('/post',postRoute)
app.use('/follow',followRoute)

//Project
app.use('/pjUsers',userRoutePJ)
app.use('/pjPost',postRoutePJ)
app.use('/pjFollow',followRoutePJ)
app.use('/pjNoti',notiRoutePJ)

module.exports = app