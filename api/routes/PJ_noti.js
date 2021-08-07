const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const auth = require('../../check-auth/auth')
const jwt = require('jsonwebtoken')

var key = "easycook"

//https://apifood.comsciproject.com
//http://localhost:3000
let pathHttp = "https://apifood.comsciproject.com" + '/'

router.get('/test', (req, res) => {
    // This registration token comes from the client FCM SDKs.
    const registrationToken = 'AAAAUcj9FFw:APA91bHPa3bDMeID3GoocViemP0o8PnkuWMklTQaKjUDVxHNa2zadNgg9lAYa4OEb3OJLecNAHiySG-2fjH02-KF12AJXUdg6Qu2VfjLcFHiT-H_Bz0_MEQvEpRc_BpkoJ_3VJdX_wyH';

    const message = {
        data: {
            score: '850',
            time: '2:45'
        },
        token: registrationToken
    };

    // Send a message to the device corresponding to the provided
    // registration token.
    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
})


module.exports = router