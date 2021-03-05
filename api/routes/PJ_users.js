const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const passwordHash = require('password-hash')
const mergeJSON = require('merge-json')
const multer = require('multer')
const jwt = require('jsonwebtoken')


var auth = require('../../check-auth/auth')
var key = "easycook"
router.post("/signup",(req,res) =>{
    let body = req.body
    body.password = passwordHash.generate(body.password)
    let img = "http://apifood.comsciproject.com/uploadProfile/img_avatar.png"
    let alias = "ท่านสมาชิก"
    pool.query("INSERT INTO `pj_user` (`email`, `password`, `name_surname`, `alias_name`, `user_status`, `access_status`, `balance`, `profile_image`) VALUES (?, ?, ?, ?, 1, 1, 0.00, ?)",[body.email,body.password,body.name_surname,alias,img],(err,results,fields) =>{
        if (err) {
            if (err.errno == 1062) {
                return res.json({
                    success: 0,
                    message: "อีเมล "+body.email+ " ถูกใช้งานแล้ว"
                })
            }
            return res.json({
                success: 0,
                message: error
            })
        }
        return res.json({
            success: 1,
            data: results,

        })
    })



})

router.post("/signin",(req,res) =>{
    let body = req.body
   
    pool.query("SELECT `password` FROM `pj_user` WHERE `email` = ?",[body.email],(err,results,fields) =>{
        if (err) {
            return res.json({
                success: 0,
                message: err
            })
        }
        if (results[0] == null) {
            return res.json({
                success: 0,
                message: "อีเมล หรือ รหัสผ่าน ไม่ถูกต้อง"
            })
        }
        let check = passwordHash.verify(body.password, results[0].password)
        if (check == false) {
            return res.json({
                success: 0,
                message: "รหัสผ่านไม่ถูกต้อง"
            })
        }
        pool.query("SELECT  * FROM `pj_user` WHERE `email` = ? and `password` = ?", [body.email, results[0].password], (err, results, field) => {

            jwt.sign({ user: results[0].user_ID }, key, (err, token) => {
                return res.json({
                    success: 1,
                    token
                })
            })


        })
    })



})

router.get("/myAccount",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(error,authData) =>{
        if (error) {
            res.json({
                message: "something this wrong!"
            })
        }
        let id = authData.user

        res.json({
            message: id
        })
    })
})

module.exports = router