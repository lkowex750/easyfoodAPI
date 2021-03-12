const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const passwordHash = require('password-hash')
const mergeJSON = require('merge-json')
const multer = require('multer')
const jwt = require('jsonwebtoken')

var auth = require('../../check-auth/auth')
var key = "easycook"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploadFile/')
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:|\./g, '') + '-' + file.originalname);
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'video/mkv') {
        console.log("video")
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

router.post("/upload",upload.single("file"),(req,res) =>{
     let path = "http://localhost:3000" + '/' + req.file.path
    res.json({
        path: path
    })
})

module.exports = router