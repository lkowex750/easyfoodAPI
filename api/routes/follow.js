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

            return res.json({
                countMyFollowing: results[0].countMyFollowing
            })

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

            return res.json({
                countMyFollower: results[0].countMyFollower
            })

        })
    })
})

//##########################################-สำหรับตอนค้นหา-###################################################
router.get('/countFollowingUser/:id',(req,res)=>{
    let userID = req.params.id
    pool.query("select count(follow_ID) as countMyFollowing from follow where my_ID = ?",[userID],(error,results,field)=>{
        if(error){
            res.json({
                message: "something this wrong from selected!"
            })
        }

        return res.json({
            countMyFollowing: results[0].countMyFollowing
        })

    })
})

router.get('/countFollowerUser/:id',(req,res)=>{
    let userID = req.params.id
    //จำนวนทีติดตามเรา
    pool.query("select count(follow_ID) as countMyFollower from follow where following_ID = ?",[userID],(error,results,field)=>{
        if(error){
            res.json({
                message: "something this wrong from selected!"
            })
        }

        return res.json({
            countMyFollower: results[0].countMyFollower
        })

    })
})

//##########################################-สำหรับตอนค้นหา-###################################################

module.exports = router