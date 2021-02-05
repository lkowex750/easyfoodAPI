const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const multer = require('multer')
const auth = require('../../check-auth/auth')
const jwt = require('jsonwebtoken')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
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
        fieldSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
})



router.post('/createPost', upload.single('postImage'), auth.verifyToken, (req, res, next) => {
    //console.log(req.file.path)
    let server = "http://apifood.comsciproject.com"
    let localhost = "localhost:3000"
    let path = server + '/' + req.file.path
   
    let body = req.body
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        //console.log(authData.user.fullName)
        if (err) {
            res.json({
                message: "something this wrong!"
            })
            //res.sendStatus(403)
        }
        // res.json({
        // token: req.token,
        // id: authData.user
        //  }) 
        let uid = authData.user
        pool.query("INSERT INTO `post` (`post_ID`, `uID`, `status_post`, `privacy_post`, `image`, `caption`, `date`) VALUES (NULL, ?, ?, ?, ?, ?,now())",
            [uid, body.status_post, body.privacy_post, path, body.caption], (error, results, field) => {
                if (error) {

                    return res.json({
                        success: 0,
                        message: error
                    })
                }
                return res.json({
                    success: 1

                })
            })


    })
    // res.json({
    //     body: body.uid,
    //     body1: req.token
    // })
    // 

})


router.get('/mypost', auth.verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if (err) {
            res.json({
                message: "something this wrong!"
            })

        }
        let uid = authData.user
        pool.query("SELECT * FROM post where uid = ?", [uid], (error, results, field) => {

            jwt.sign({post: results}, 'secretkey', (err, token) =>{
                return res.json({
                    data: token
                })
            })
            
        })

    })
    // 

})

module.exports = router
