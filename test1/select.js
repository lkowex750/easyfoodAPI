const express = require('express')
const router = express.Router()
const pool = require('../database/database')
const passwordHash = require('password-hash')
const mergeJSON = require('merge-json')
const multer = require('multer')
const jwt = require('jsonwebtoken')

module.exports = {
    Query : function(sql,cb){
        pool.query(sql,(err,res,field) =>{
            cb(res)
        })
    },
    
}

