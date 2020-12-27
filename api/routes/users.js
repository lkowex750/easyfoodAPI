const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const passwordHash = require('password-hash')



//GET ALL User
router.get('/', (req, res)=>{
    pool.query("SELECT * FROM user",[],(error, results,field)=>{
        if(error){
            return res.json({
                success: 0,
                message: error
            })
        }
        return res.json({
            success: 1,
            data: results
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
        //console.log(results[0])
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
            return res.json({
                success: 1,
                data: results[0]
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
            data: results
        })
        
        
    })
})

module.exports = router