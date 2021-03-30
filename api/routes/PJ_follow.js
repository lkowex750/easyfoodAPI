const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const auth = require('../../check-auth/auth')
const jwt = require('jsonwebtoken')

var key = "easycook"

//https://apifood.comsciproject.com
//http://localhost:3000
let pathHttp = "https://apifood.comsciproject.com" + '/'

router.get("/checkFollower/:uid", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) { res.json({ message: err }) }
        let myid = authData.user
        let checkfollower = 0
        let uid = req.params.uid
        pool.query("select count(follow_ID) as countFollower from pj_follow where following_ID = ?", [uid], (error, result, field) => {
            if (error) { res.json({ message: error }) }
            else {
                pool.query("SELECT `my_ID` FROM `pj_follow` WHERE `following_ID` = ?", [uid], (error, resultID, field) => {
                    if (error) { res.json({ message: error }) }
                    else {

                        let data = []
                        var countLoop = 0
                        if (resultID.length != 0) {
                            resultID.forEach(element => {
                                pool.query("SELECT pj_user.user_ID, pj_user.name_surname,pj_user.alias_name,pj_user.profile_image,pj_user.user_status FROM pj_user WHERE pj_user.user_ID = ?", [element.my_ID], (error, resultProfile, field) => {
                                    if (error) { res.json({ message: error }) }
                                
                                    else {
                                        data.push(resultProfile[0])
                                        
                                        if(resultProfile[0].user_ID == myid){
                                            checkfollower = 1
                                        }
                                        countLoop += 1
                                    }

                                    if (countLoop == resultID.length) {
                                        res.json({
                                            count: result[0].countFollower,
                                            checkFollower: checkfollower,
                                            user: data
                                        })
                                    }
                                })
                            });
                        } else {
                            res.json({
                                count: result[0].countFollower,
                                checkFollower: checkfollower,
                                user: []
                            })
                        }

                    }
                })
                //
            }


        })
    })
})

router.get("/checkFollowing/:uid", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) { res.json({ message: err }) }
        
        let uid = req.params.uid
        pool.query("select count(follow_ID) as countFollowing from pj_follow where my_ID = ?", [uid], (error, result, field) => {
            if (error) { res.json({ message: error }) }
            else {
                pool.query("SELECT `following_ID` FROM `pj_follow` WHERE `my_ID` = ?", [uid], (error, resultID, field) => {
                    if (error) { res.json({ message: error }) }
                    else {

                        let data = []
                        var countLoop = 0
                        if (resultID.length != 0) {
                            resultID.forEach(element => {

                                pool.query("SELECT pj_user.user_ID, pj_user.name_surname,pj_user.alias_name,pj_user.profile_image,pj_user.user_status FROM pj_user WHERE pj_user.user_ID = ?", [element.following_ID], (error, resultProfile, field) => {
                                    if (error) { res.json({ message: error }) }
                                    else {
                                        data.push(resultProfile[0])
                                        countLoop += 1
                                    }
                                    if (countLoop == resultID.length) {
                                        res.json({
                                            count: result[0].countFollowing,
                                            user: data
                                        })
                                    }
                                })
                            });
                        } else {
                            res.json({
                                count: result[0].countFollowing,
                                user: []
                            })
                        }

                    }
                })
                //
            }


        })
    })
})

router.post("/ManageFollow",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){res.json({message: err})}
        else{
            let body = req.body
            let uid = authData.user
           
            if(uid == body.following_ID){
                return res.json({
                    message: "ไม่สามารถติดตาม หรือ ยกเลิกติดตามตัวเองได้"
                })
            }else{
                if(body.state == "fol"){
                    pool.query("INSERT INTO `pj_follow` (`my_ID`, `following_ID`) VALUES (?, ?)",[uid,body.following_ID],(error,result,field) =>{          
                        if(error){res.json({message: error})}
                        else{
                            if(result.affectedRows == 1){
                                return res.json({
                                    success: 1
                                })
                            }
                        }
                    })
    
                }else if(body.state == "unfol"){
                    pool.query("DELETE FROM `pj_follow` WHERE `my_ID` = ? AND `following_ID` = ?",[uid,body.following_ID],(error,result,field) =>{
                        if(error){res.json({message: error})}
                        else{
                            if(result.affectedRows == 1){
                                return res.json({
                                    success: 1
                                })
                            }
                        }
                    })
                }else{
                    return res.json({
                        message: "invalid state"
                    })
                }
            }
            
        }
    })
})

module.exports = router