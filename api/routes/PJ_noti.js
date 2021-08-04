const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const auth = require('../../check-auth/auth')
const jwt = require('jsonwebtoken')

var key = "easycook"

//https://apifood.comsciproject.com
//http://localhost:3000
let pathHttp = "https://apifood.comsciproject.com" + '/'

router.get('/test',(req,res) =>{
    res.json({
        messsage: "5555"
    })
})


module.exports = router