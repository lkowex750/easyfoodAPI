const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const auth = require('../../check-auth/auth')
const jwt = require('jsonwebtoken')
const admin = require('firebase-admin')

var key = "easycook"

//https://apifood.comsciproject.com
//http://localhost:3000
let pathHttp = "https://apifood.comsciproject.com" + '/'




var serviceAccount = require("../../noti_service/easycook-1d66b-firebase-adminsdk-oyj4t-c853dff404.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});



router.post('/api_notification', (req, res) => {
    // This registration token comes from the client FCM SDKs.
    let token = req.body.token_noti
    let title = req.body.title
    let body = req.body.body


    const registrationToken = token;

    const message = {
        notification: {
            body: body,
            title: title,
            icon: "https://apifood.comsciproject.com/uploadProfilePj\\2021-08-07T175534781Z-889693.png"
        },
        // data: {
        //     body: body,
        //     title: title,
        // },
        token: registrationToken

    };



    // Send a message to the device corresponding to the provided
    // registration token.
    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
            res.json({
                success: 1,
                message: "Successfully"
            })
        })
        .catch((error) => {
            console.log('Error sending message:', error);
            res.json({
                success: 0,
                message: error
            })
        });



})

router.post('/updateToken', auth.verifyToken, (req, res) => {

    jwt.verify(req.token, key, (err, authData) => {
        if (err) { res.json({ message: err }) }

        let uid = authData.user
        let token = req.body.token_noti
        pool.query("update pj_user set token_noti = ? where user_ID = ?", [token, uid], (error, result, field) => {
            if (result.affectedRows == 1) {
                return res.json({
                    success: 1
                })
            } else {
                return res.json({
                    success: 0
                })
            }
        })
    })
})

router.get("/getTokenNoti/:user_ID", (req, res) => {

    let uid = req.params.user_ID

    pool.query("select token_noti from pj_user where user_ID = ?", [uid], (error, result, field) => {
        if (result == "") {
            res.json({
                token_noti: null
            })
        } else {
            res.json({
                token_noti: result[0].token_noti
            })
        }
    })
})


module.exports = router