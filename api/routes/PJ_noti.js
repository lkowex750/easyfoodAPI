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
    let state = req.body.state
    //icon: "https://apifood.comsciproject.com/uploadProfilePj\\2021-08-07T175534781Z-889693.png"
    // let ace = "https://apifood.comsciproject.com/uploadProfilePj\\2021-08-08T054800988Z-aceee.png"
    // let food = "https://apifood.comsciproject.com/uploadProfilePj\\2021-08-07T175534781Z-889693.png"
    const registrationToken = token;

    const message = {
        
        notification: {
            body: body,
            title: title
            //image: ace
            
        },
        android: {
            priority: "high",
            notification: {
                click_action: "OPEN_ACTIVITY_1"
            }
          },
        
        token: registrationToken
       

    };

    if(state =="specific"){
        admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
            res.json({
                success: 1,
                message: "Successfully_1"
            })
        })
        .catch((error) => {
            console.log('1Error sending message:', error);
            res.json({
                success: 0,
                message: error
            })
        });
    }else if(state =="multiple"){
        admin.messaging().sendMulticast(message)
        .then((response) => {
            
            // Response is a message ID string.
            console.log('Successfully sent message:', response);
            res.json({
                success: 1,
                message: "Successfully_1"
            })
        })
        .catch((error) => {
            console.log('1Error sending message:', error);
            res.json({
                success: 0,
                message: error
            })
        });
    }
    
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

router.get("/getAllTokenNoti",(req,res) =>{
    pool.query("select token_noti from pj_user where token_noti != '' ",(error,results,field) =>{
        if (results == "") {
            res.json({
                token_noti: []
            })
        } else {

            data = new Array()
            results.forEach(e =>{
                data.push(e.token_noti)
            })
            res.json({
                token_noti: data
            })
        }
    })
})

router.post("/insertNotificationData",(req,res)=>{

    let body = req.body
   
    pool.query("INSERT INTO `pj_notification` (`my_ID`, `state`, `description`, `date`, `visited`,`status`, `recipe_ID`, `from_userid`) VALUES (?, ?, ?, now(), false,? , ?, ?)",[body.my_ID,body.state,body.description,body.status,body.recipe_ID,body.from_userid],(error,result,field) =>{
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

router.post("/clearNotificationData",auth.verifyToken,(req,res) =>{

    jwt.verify(req.token,key,(err,authData) =>{
        let uid = authData.user

        pool.query("delete from pj_notification where my_ID = ?",[uid],(error,result,field) =>{
            res.json({
                success: 1
            })
        })
    })
})

router.get("/getCountVisited",auth.verifyToken,(req,res) =>{

    jwt.verify(req.token,key,(err,authData)=>{
        let uid = authData.user

        pool.query("SELECT COUNT(*) as countVisit FROM pj_notification WHERE my_ID = ? and visited = false",[uid],(error,result,field) =>{
            if(result ==""){
                res.json({
                    countVisit: 0
                })
            }else{
                res.json({
                    countVisit: result[0].countVisit
                })
            }
        })
    })
})

router.get("/getNotification",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        let uid = authData.user

        pool.query("SELECT * FROM `pj_notification` WHERE `my_ID` = ?",[uid],(error,results,field) =>{
            if(results != ""){
                // res.json({
                //     data: results
                // })
                
                let countLoop = 0
                let Newdata = new Array()
                results.forEach(element =>{
                    //console.log(results[countLoop].state)
                    //countLoop++
                    
                        pool.query("select pj_user.name_surname, pj_user.alias_name, pj_user.profile_image from pj_user where  pj_user.user_ID = ?",[element.from_userid],(error1,resultsUser,field) =>{
                            
                            Newdata.push({
                                nid: element.nid,
                                my_ID: element.my_ID,
                                state: element.state,
                                description: element.description,
                                date: element.date,
                                visited: element.visited,
                                status: element.status,
                                recipe_ID: element.recipe_ID,
                                
                                from_userid: element.from_userid,
                                from_name_surname: resultsUser[0].from_name_surname,
                                from_alias_name: resultsUser[0].from_alias_name,
                                from_profile_image: resultsUser[0].profile_image
                            })
                            //countLoop++
                            //console.log(countLoop)
                            countLoop++
                    
                            if(countLoop == results.length){
                                res.json({
                                    data: Newdata
                                })
                            }
                            
                        })
                    
                   
                })

            }else{
                res.json({
                    data: []
                })
            }
        })
    })
})

router.post("/setVisited",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{

        let uid = authData.user

        pool.query("update pj_notification set visited = true where my_ID = ?",[uid],(error,result,field) =>{
            
                return res.json({
                    success: 1
                })
            
        })

    })
})








module.exports = router