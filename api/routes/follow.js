const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const auth = require('../../check-auth/auth')
const jwt = require('jsonwebtoken')


router.post('/following',auth.verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        let body = req.body
        if(err){
            res.json({
                message: "something this wrong!"
            })
        }
        let uid = authData.user
        pool.query("INSERT INTO `follow` (`follow_ID`, `my_ID`, `following_ID`) VALUES (NULL, ?, ?)",[uid,body.following_ID], (error, results, field) =>{
            if(error){
                res.json({
                    message: "insert error!"
                })
            }
            return res.json({
                success: 1
            })
        })
    })
})

router.post('/unfollowing',auth.verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        let body = req.body
        if(err){
            res.json({
                message: "something this wrong!"
            })
        }
        let uid = authData.user
        pool.query("DELETE FROM `follow` WHERE `my_ID` = ? AND `following_ID` = ?",[uid,body.following_ID], (error, results, field) =>{
            if(error){
                res.json({
                    message: "delete error!"
                })
            }
            if(results.affectedRows == 0){res.status(201).json({message: "no-data"})}
            else {return res.json({
                success: 1
            })
        }
        })
    })
})

router.get('/countFollowing',auth.verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err){
            res.json({
                message: "something this wrong!"
            })
        }
        let myid = authData.user
        //จำนวนที่เราติดตาม
        pool.query("select count(follow_ID) as countMyFollowing from follow where my_ID = ?",[myid],(error,results,field)=>{
            if(error){
                res.json({
                    message: "something this wrong from selected!"
                })
            }
            pool.query("select user.user_ID,user.username,user.nickName,user.profile_img  from user,follow where user.user_ID = follow.following_ID AND follow.my_ID = ?",[myid],(err,results1,field)=>{
                return res.json({
                    countMyFollowing: results[0].countMyFollowing,
                    following: results1
                })
            })

            // return res.json({
            //     countMyFollowing: results[0].countMyFollowing
            // })

        })
    })
})

router.get('/countFollower',auth.verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err){
            res.json({
                message: "something this wrong!"
            })
        }
        let myid = authData.user
        //จำนวนทีติดตามเรา
        pool.query("select count(follow_ID) as countMyFollower from follow where following_ID = ?",[myid],(error,results,field)=>{
            if(error){
                res.json({
                    message: "something this wrong from selected!"
                })
            }
            pool.query("select user.user_ID,user.username,user.nickName,user.profile_img  from user,follow where user.user_ID = follow.my_ID AND follow.following_ID = ?",[myid],(err,results1,field)=>{
                return res.json({
                    countMyFollower: results[0].countMyFollower,
                    follower: results1
                })
            })

            // return res.json({
            //     countMyFollower: results[0].countMyFollower
            // })

        })
    })
})

//##########################################-สำหรับตอนค้นหา-###################################################

//กำลังติดตาม
router.get('/countFollowingUser/:id',(req,res)=>{
    let userID = req.params.id
    pool.query("select count(follow_ID) as countMyFollowing from follow where my_ID = ?",[userID],(error,results,field)=>{
        if(error){
            res.json({
                message: "something this wrong from selected!"
            })
        }
        pool.query("select user.user_ID,user.username,user.nickName,user.profile_img  from user,follow where user.user_ID = follow.following_ID AND follow.my_ID = ?",[userID],(err,results1,field)=>{
            return res.json({
                countMyFollowing: results[0].countMyFollowing,
                following: results1
            })
        })

        // return res.json({
        //     countMyFollowing: results[0].countMyFollowing
        // })

    })
})

//ผู้ติดตาม
router.get('/countFollowerUser/:id',(req,res)=>{
    let userID = req.params.id
    //จำนวนทีติดตามเรา
    pool.query("select count(follow_ID) as countMyFollower from follow where following_ID = ?",[userID],(error,results,field)=>{
        if(error){
            res.json({
                message: "something this wrong from selected!"
            })
        }
        pool.query("select user.user_ID,user.username,user.nickName,user.profile_img  from user,follow where user.user_ID = follow.my_ID AND follow.following_ID = ?",[userID],(err,results1,field)=>{
            return res.json({
                countMyFollower: results[0].countMyFollower,
                follower: results1
            })
        })


       

    })
})

router.get('/checkFollow/:fid',auth.verifyToken,(req,res)=>{
    let fid = req.params.fid
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err){
            res.json({
                message: "something this wrong!"
            })
        }
        let myid = authData.user
        pool.query("SELECT COUNT(`follow_ID`) as MyFollower FROM `follow` WHERE `my_ID`= ? AND `following_ID` = ?",[myid,fid],(error,results,field) =>{
            if(error){
                res.json({
                    message: "something this wrong from selected!"
                })
            }
            return res.json({
                checkFollow: results[0].MyFollower
            })
            
        })
    })
})

//##########################################-สำหรับตอนค้นหา-###################################################

router.get("/randFollow",auth.verifyToken,(req,res) =>{
    //

    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err){
            res.json({
                message: "something this wrong!"
            })
        }
        let myid = authData.user
        pool.query("SELECT DISTINCT user.user_ID,user.username,user.nickName,user.profile_img FROM user,follow WHERE user.user_ID != ? ORDER BY RAND() LIMIT 10"
        ,[myid],(error,results,field) =>{
            if(error){
                res.json({
                    message: error
                })
            }
            return res.json({
                results
            })
        })
    })
})


module.exports = router