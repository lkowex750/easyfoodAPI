const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const passwordHash = require('password-hash')
const mergeJSON = require('merge-json')
const multer = require('multer')
const jwt = require('jsonwebtoken')

var auth = require('../../check-auth/auth')
const { verifyToken } = require('../../check-auth/auth')


//GET ALL User
router.get('/:uID', (req, res)=>{
    let id = req.params.uID
    pool.query("SELECT * FROM user WHERE user_ID = ?",[id],(error, results,field)=>{
        var data = {
            user_ID: results[0].user_ID,
            username : results[0].username,
            fullName : results[0].fullName,
            nickName : results[0].nickName,
            profile_img : results[0].profile_img,
            status : results[0].status
        }
        
        if(results ==""){
            return res.json({
                success: 0,
                message: "no-data"
            })
        }
        if(error){
            return res.json({
                success: 0,
                message: error
            })
        }
        return res.json({
            success: 1,
            data: data
        })
    })
})

/*Login
{"username": "",
"password": ""}
*/
router.post('/login',(req,res)=>{
    let body = req.body
    pool.query("SELECT password FROM user WHERE username = ?",[body.username],(error,results,field) => {
        if(error){
            res.json({
                success: 0,
                message: error
            })
        }
        
        if(results[0] == null){
            return res.json({
                success: 0,
                message: "invalid username or password"
            })
        }
        console.log(results[0].password) 
        let check =   passwordHash.verify(body.password,results[0].password)
        console.log(check) 
        if(!check){
            return res.json({
                success: 0,
                message: "invalid password"
            })
        }
        pool.query("SELECT * FROM user WHERE username = ? AND password = ?",[body.username,results[0].password],(err,results,field)=>{
           
            jwt.sign({user: results[0].user_ID}, 'secretkey', (err,token)=>{
                return res.json({
                    success: 1,
                    token
                })
            })

            
        })
  
    })  
})

/*
SignUp
{ 
        "username": "test5",
        "password": "test5",
        "fullName": "tester54321",
        "nickName": "xx2",
        "status": 1,
        "profile_img": "abcdefg"
       }
*/
router.post('/signup',(req,res)=>{
    let body = req.body
    body.password = passwordHash.generate(body.password)
    console.log(body.password)
    pool.query("INSERT INTO `user` (`user_ID`, `username`, `password`, `fullName`, `nickName`, `status`, `profile_img`) VALUES (NULL, ?, ?, ?, ?, ?, ?)",
    [body.username,body.password,body.fullName,body.nickName,body.status,body.profile_img],(error,results,fields)=>{

       
        if(error){
            if(error.errno == 1062){
                return res.json({
                    success: 0,
                    message: "username must be unique"
                })
            }
            return res.json({
                success: 0,
                message: error
            })
        }
            return res.json({
                success: 1,
                data : results,
                
            })
        
        
        
    })
})
/*
Update user profile & cancel profile
{"fullName:": "","nickName":""}
*/ 
router.post('/edit',(req,res)=>{
    let id = req.body.uid
    let body = req.body

    pool.query("SELECT * FROM user WHERE user_ID = ?",[id],(err,results,field)=>{
       let oldData = results[0]
       if(results == ""){
           return res.json({
               success: 0,
               message: "nodata"
           })
       }
       let jsonOldData = JSON.parse(JSON.stringify(oldData))

       let newData = mergeJSON.merge(jsonOldData, body)
       pool.query("UPDATE `user` SET `fullName` = ?, `nickName` = ?, `status`= ? WHERE `user_ID` = ?",[newData.fullName,newData.nickName,newData.status,id],(error,results,fields)=>{
            if(error){
                return res.json({
                    success: 0,
                    message: error
                })
            }
            return res.json({
                success: 1,
                message : "Update success"

            })
       })
    })
})


const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'uploadProfile/')
    },
    filename: function(req, file, cb){
        cb(null, new Date().toISOString().replace(/:|\./g,'') + '-' + file.originalname);
    }
})

const fileFilter = (req, file , cb ) =>{
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg'){
        cb(null,true)
    }else {
        cb(null,false)
    } 
}

const upload = multer({
    storage: storage,
    limits: {
    fieldSize: 1024 * 1024 * 5
    },
    fileFilter : fileFilter
})

/*
Update profie  picture
{
    "uid": "",
    "profile_picture" : file
}
*/ 
router.post('/uploadProfile',upload.single("profile_picture"),(req,res)=>{
    //console.log(req.file)
    //http://apifood.comsciproject.com//
    //http://localhost:3000

    //jwt.verify(req.token,'secretkey',(err,authData) =>{
       
        let path = "http://apifood.comsciproject.com"+'/'+req.file.path
        //let path = "http://localhost:3000"+'/'+req.file.path
        let body = req.body
        pool.query("UPDATE `user` SET `profile_img` = ?  WHERE `user_ID` = ?",[path,body.uid],(error,results,fields)=>{
            if(results == ""){
                res.json({
                    success: 0,
                    message: "no-data"
                })
            }
            if(error){
                return res.json({
                    success: 0,
                    message: error
                })
            }

            return res.json({
                success: 1,
                message : "Update success"
            })

        })
   // })
    

})

router.get('/path_profileImage/:uid', (req, res)=>{//ดึง path รูปภาพล่าสุด/pok
    let id = req.params.uid
    pool.query("SELECT profile_img FROM user WHERE user_ID = ?",[id],(error, results,field)=>{
        var data = {
            profile_img : results[0].profile_img,
        }
        
        if(results ==""){
            return res.json({
                success: 0,
                message: "no-data"
            })
        }
        if(error){
            return res.json({
                success: 0,
                message: error
            })
        }
        return res.json({
            success: 1,
            data: data
        })
    })
})

router.post('/path_updateprofileImage',(req,res)=>{//Update path รูปภาพล่าสุด/pok
    let body = req.body
    pool.query("UPDATE `user` SET `profile_img` = ? WHERE `user_ID` = ?",[body.profileImagePath,body.user_id],(error,results,fields)=>{
        if(error){
            return res.json({
                success: 0,
                message: error
            })
        }

        pool.query("SELECT * FROM user WHERE user_ID = ?",[body.user_id],(error, results,field)=>{
            var data = {
                user_ID: results[0].user_ID,
                username : results[0].username,
                fullName : results[0].fullName,
                nickName : results[0].nickName,
                profile_img : results[0].profile_img,
                status : results[0].status
            }
            
            if(results ==""){
                return res.json({
                    success: 0,
                    message: "no-data"
                })
            }
            if(error){
                return res.json({
                    success: 0,
                    message: error
                })
            }
            return res.json({
                success: 1,
                data: data
            })
        })
        
   })
})

router.post('/editNickname',(req,res)=>{//แก้ไขชื่อเล่น/pok
    let body = req.body
    pool.query("UPDATE `user` SET `nickName` = ? WHERE `user_ID` = ?",[body.newNickname,body.user_id],(error,results,fields)=>{
        if(error){
            return res.json({
                success: 0,
                message: error
            })
        }

        pool.query("SELECT * FROM user WHERE user_ID = ?",[body.user_id],(error, results,field)=>{
            var data = {
                user_ID: results[0].user_ID,
                username : results[0].username,
                fullName : results[0].fullName,
                nickName : results[0].nickName,
                profile_img : results[0].profile_img,
                status : results[0].status
            }
            
            if(results ==""){
                return res.json({
                    success: 0,
                    message: "no-data"
                })
            }
            if(error){
                return res.json({
                    success: 0,
                    message: error
                })
            }
            return res.json({
                success: 1,
                data: data
            })
        })
        
   })
})




router.post('/test1',auth.verifyToken,(req,res) =>{
    
    jwt.verify(req.token,'secretkey',(err,authData) =>{
        //console.log(authData.user.fullName)
        if(err){
            
            res.sendStatus(403)
        }else {
            res.json({
            message: '55555',
            authData
            
             }) 
        }
    })
   
})  
//format of token
//authorization : bearer <access_token>

//verify token
// function verifyToken(req,res,next){
//     //get auth header value

//     const bearerHeader = req.headers['authorization']
//     //check if bearer is undifined
//     if(typeof bearerHeader !== 'undefined'){
//         //split at the space
//         const bearer = bearerHeader.split(' ')
//         //get token from array
//         const bearerToken = bearer[1]
//         //set the token

       
//         req.token = bearerToken 
//         next()
//     }else {
//         //forbidden
//         res.sendStatus(403)
//     }
// }

module.exports = router