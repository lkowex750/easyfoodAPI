const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const passwordHash = require('password-hash')
const mergeJSON = require('merge-json')
const multer = require('multer')
const jwt = require('jsonwebtoken')


var auth = require('../../check-auth/auth')
var key = "easycook"
let pathHttp = "https://apifood.comsciproject.com" + '/' 

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploadProfilePj/')
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:|\./g, '') + '-' + file.originalname);
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2048 * 2048 * 10
    },
    fileFilter: fileFilter
})



router.post("/signup",(req,res) =>{
    let body = req.body
    //console.log()
    body.password = passwordHash.generate(body.password)
    //let img = "http://apifood.comsciproject.com/uploadProfile/img_avatar.png"
    let path = "http://apifood.comsciproject.com/uploadProfile/img_avatar.png"
    let alias = "ท่านสมาชิก"
    
    pool.query("INSERT INTO `pj_user` (`email`,`facebookID`, `password`, `name_surname`, `alias_name`, `user_status`, `access_status`, `balance`, `profile_image`) VALUES (?,NULL, ?, ?, ?, 1, 1, 0.00, ?)",[body.email,body.password,body.name_surname,alias,path],(err,results,fields) =>{
        if (err) {
            if (err.errno == 1062) {
                return res.json({
                    success: 0,
                    message: "อีเมล "+body.email+ " ถูกใช้งานแล้ว"
                })
            }
            return res.json({
                success: 0,
                message: err
            })
        }
        pool.query("select `user_ID` from `pj_user` where email = ? and password = ?",[body.email,body.password],(err,results1,field) =>{
            if(err){
                res.json({
                    message :err,
                    success : 0

                })
            }

            jwt.sign({ user: results1[0].user_ID }, key, (err, token) => {
                return res.json({
                    success: 1,
                    token
                })
            })
        })
    })



})

router.post("/signupNewStep1",(req,res) =>{
    let body = req.body
    //console.log()
    body.password = passwordHash.generate(body.password)
    //let img = "http://apifood.comsciproject.com/uploadProfile/img_avatar.png"
    let path = "http://apifood.comsciproject.com/uploadProfile/img_avatar.png"
    let alias = "ท่านสมาชิก"
    
    pool.query("INSERT INTO `pj_user` (`email`,`facebookID`, `password`, `name_surname`, `alias_name`, `user_status`, `access_status`, `balance`, `profile_image`) VALUES (?,NULL, ?, ?, ?, 1, 1, 0.00, ?)",[body.email,body.password,body.email,alias,path],(err,results,fields) =>{
        if (err) {
            if (err.errno == 1062) {
                return res.json({
                    success: 0,
                    message: "อีเมล "+body.email+ " ถูกใช้งานแล้ว"
                })
            }
            return res.json({
                success: 0,
                message: err
            })
        }
        pool.query("select `user_ID` from `pj_user` where email = ? and password = ?",[body.email,body.password],(err,results1,field) =>{
            if(err){
                res.json({
                    message :err,
                    success : 0

                })
            }

            jwt.sign({ user: results1[0].user_ID }, key, (err, token) => {
                return res.json({
                    success: 1,
                    token
                })
            })
        })
    })
})

router.post("/signupNewStep2",upload.single("profile_image"),(req,res) =>{
    let body = req.body
    let path = pathHttp + req.file.path
    jwt.verify(body.token,key,(err,authData) =>{
        if(err){res.json({success: 0,message:err})}
        let uid = authData.user
     
        pool.query("update `pj_user` set `profile_image`=? where user_ID = ?",[path,uid],(err,results,field) =>{
            if(err){
                res.json({
                    message: err,
                    success : 0
                })
            }
            if(results.affectedRows == 1){
                return res.json({
                    success: 1
                })
            }else{
                return res.json({
                    success : 0
                })
            }
        })
    })
})

router.post("/signupNewStep3",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){res.json({success: 0,message:err})}
        let uid = authData.user
        let body = req.body
        pool.query("select * from pj_user where user_ID = ?",[uid],(err,results,field) =>{

            let oldData = results[0]
            if (results == "") {
                return res.json({
                    success: 0,
                    message: "nodata"
                })
            }

            let jsonOldData = JSON.parse(JSON.stringify(oldData))
            let newData = mergeJSON.merge(jsonOldData, body)

            pool.query("update `pj_user` set `name_surname`=?, `alias_name` = ? where user_ID = ?",[newData.name_surname,newData.alias_name,uid],(err,results1,field) =>{
                if(err){
                    res.json({
                        message: err,
                        success : 0
                    })
                }
                else{
                    return res.json({
                        success : 1
                    })
                }
            })
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

        pool.query("SELECT `user_ID`,`email`,`facebookID`,`name_surname`,`alias_name`,`user_status`,`access_status`,`balance`,`profile_image` FROM `pj_user` WHERE `user_ID` =? ",[id],(error,results,fields) =>{
                res.json({
                success: 1,
                data: results
            })
        })
        
    })
    


})

//login with facebook

router.post('/loginFacebook',(req,res) =>{
    let body = req.body
   
    pool.query("SELECT COUNT(`user_ID`) as checkID FROM `pj_user` WHERE `facebookID` = ?",[body.userID],(err,results,fields) =>{
       
        if(results[0]['checkID']== 0){
            
            pool.query("INSERT INTO `pj_user` (`user_ID`, `facebookID`, `password`, `name_surname`, `alias_name`, `user_status`,`access_status`,`balance`, `profile_image`) VALUES (NULL, ?, 'facebook', ?, ?, 1, 1,0.00,?)",[body.userID,body.name_surname,body.alias_name,body.profile_image],(error,resultsIn,fields) =>{
                if (error) {
                    if (error.errno == 1062) {
                        return res.json({
                            success: 0,
                            message: "facebookID must be unique"
                        })
                    }
                    return res.json({
                        success: 0,
                        message: error
                    })
                }
                pool.query("SELECT * FROM `pj_user` WHERE `facebookID` = ?",[body.userID],(err,results1,fields) =>{
                    jwt.sign({ user: results1[0].user_ID }, key, (err, token) => {
                        return res.json({
                            success: 1,
                            token
                        })
                    })
                })

            })
        }
        
        else{
            pool.query("SELECT * FROM `pj_user` WHERE `facebookID` = ?",[body.userID],(err,results1,fields) =>{
                jwt.sign({ user: results1[0].user_ID }, key, (err, token) => {
                    return res.json({
                        success: 1,
                        token
                    })
                })
            })
        }

    })
})

//update profile 
//return path

router.post("/uploadProfile",upload.single("profile_image"), (req, res) =>{
    let path = "http://localhost:3000" + '/' + req.file.path
    let body = req.body

    jwt.verify(body.token,key,(error,authData) =>{
        
        if (error) {
            res.json({
                message: "something this wrong!"
                
            })
        }
        
        pool.query("UPDATE `pj_user` SET `profile_image`= ?  WHERE `user_ID` = ?",[path,authData.user],(err,results,fields) =>{
            if(err){
                res.json({success: 0,message: err})
            }

            else{
                pool.query("SELECT `profile_image` FROM `pj_user` WHERE `user_ID` = ?",[authData.user],(err,results,fields)=>{
                    res.json({
                        success: 1,
                        profile_image: results[0]
                    })
                })
            }
        })
        
    })
})

//edit 
router.post("/editProfileName",auth.verifyToken,(req,res)=>{
    let body = req.body
    jwt.verify(req.token,key,(error,authData) =>{
        if(error){
            res.json({
                message: error
            })
        }

        let id = authData.user
        pool.query("SELECT * FROM `pj_user` WHERE `user_ID` = ?",[id],(err,results,fields) =>{
            let oldData = results[0]
            if (results == "") {
                return res.json({
                    success: 0,
                    message: "nodata"
                })
            }

            let jsonOldData = JSON.parse(JSON.stringify(oldData))
            let newData = mergeJSON.merge(jsonOldData, body)
            pool.query("UPDATE `pj_user` SET `name_surname`= ?,`alias_name`=? WHERE `user_ID` = ?",[newData.name_surname,newData.alias_name,id],(err,results,fields)=>{
                if (err) {
                    return res.json({
                        success: 0,
                        message: err
                    })
                }
                if(results.affectedRows == 1){
                    pool.query("SELECT `name_surname`,`alias_name` FROM `pj_user` WHERE `user_ID` = ?",[id],(err,results,fileds) =>{
                      return  res.json({
                            success: 1,
                            name_surname: results[0].name_surname,
                            alias_name: results[0].alias_name
                        })
                    })
                }else{
                   return res.json({
                        success: 0
                    })
                }
              
            })
        })
    })
})

//cancleAccout

router.post("/cancleAccout",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(error,authData) =>{
        if(error){
            res.json({
                message: error
            })
        }
        let id = authData.user
        pool.query("UPDATE `pj_user` SET `access_status`= 0 WHERE `user_ID` = ?",[id],(err,results,fields) =>{
            if(err){
                res.json({
                    message: err
                })
            }
            if(results.affectedRows == 1){
                return res.json({
                    success: 1,
                    access_status: 0
                })
            }
        })
    })
})

//searchUser
router.get("/searchUser/:data",auth.verifyToken,(req,res) =>{
    
    jwt.verify(req.token,key,(err,authData) =>{

        if(err){
            return res.json({
                message: err
            })
        }

        let data = req.params.data
        console.log(data)
       pool.query("SELECT `user_ID`,`name_surname`,`alias_name`,`profile_image` FROM `pj_user` WHERE `name_surname` LIKE concat(?,'%') OR `alias_name` LIKE concat(?,'%') ORDER BY `name_surname`,`alias_name` ASC",[data,data],(error,results,field) =>{
           res.json({
               data: results
           })
       })

        
     })
})

//Ban accout

router.post("/banUser",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){
            return res.json({
                message: err
            })
        }
        let id = authData.user
        let body = req.body
        
        pool.query("UPDATE `pj_user` SET `access_status` = 0 WHERE `user_ID` = ?",[body.user_ID],(err,results,fields) =>{
            if(err){
                res.json({
                    message: err
                })
            }
            if(results.affectedRows == 1){
                pool.query("SELECT `name_surname` FROM `pj_user` WHERE `user_ID` = ?",[body.user_ID],(err,results,fields) =>{
                    return res.json({
                        success: 1,
                        message: "Admin ได้ทำการแบน "+results[0].name_surname+" แล้วจ้า" 
                    })
                })
                
            }


        })
        
    })
})







module.exports = router