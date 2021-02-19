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



router.post('/createPost', upload.single('postImage'), (req, res, next) => {
    //console.log(req.file.path)
    let server = "http://apifood.comsciproject.com"
    let localhost = "localhost:3000"
    let path = server + '/' + req.file.path

    let body = req.body
    //console.log(req.body.token)
    jwt.verify(req.body.token, 'secretkey', (err, authData) => {
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

            //jwt.sign({post: results}, 'secretkey', (err, token) =>{
            return res.json({
                data: results
            })
            //})

        })

    })
    // 

})

router.get('/countMyPost', auth.verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if (err) {
            res.json({
                message: "something this wrong!"
            })
        }
        let uid = authData.user
        pool.query("select count(post_ID) as countMyPost from post where uID = ? ", [uid], (error, results, field) => {
            if (error) {
                res.json({
                    message: "something this wrong selected!"
                })
            }
            return res.json({
                countMyPost: results[0].countMyPost
            })
        })
    })
})
//like post
router.post('/likepost', auth.verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) => {

        let uid = authData.user
        let pid = req.body.pid
        let count = null
        pool.query('select * from likepost where uID = ? and pID = ?', [uid, pid], (error, results, filed) => {
            if (error) {
                res.json({
                    message: "something this wrong selected!"
                })
            }
            else if (results == "") {
                //insert อันใหม่ลง

                pool.query('INSERT INTO `likepost` (`uID`, `pID`) VALUES (?, ?)', [uid, pid], (error1, result, filed) => {
                    if (error1) {
                        res.json({
                            message: "insert this wrong!"
                        })
                    } else {
                        pool.query('select count(like_ID) as countLike from likepost where pID = ?', [pid], (error, result, field) => {
                            if (error) {
                                res.json({ message: "err!" })
                            } else if (result == "") {
                                res.json({ message: "no one" })
                            }
                            return res.json({
                                success: 1,
                                countLike: result[0].countLike

                            })
                        })

                    }

                })
            } else {
                pool.query('delete from likepost where uID = ? and pID = ?', [uid, pid], (error, result, field) => {
                    if (error) {
                        res.json({
                            message: "delete this wrong!"
                        })
                    }
                    pool.query('select count(like_ID) as countLike from likepost where pID = ?', [pid], (error, result, field) => {
                        if (error) {
                            res.json({ message: "err!" })
                        } else if (result == "") {
                            res.json({ message: "no one" })
                        }
                        return res.json({
                            success: 1,
                            countLike: result[0].countLike

                        })
                    })

                })
            }
        })
    })
})

router.get('/newfeed', auth.verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        let uid = authData.user

        if (err) {
            res.json({
                message: "something this wrong!"
            })
        }
        let arr = new Array()
        arr.push(uid)

        pool.query("SELECT following_ID FROM follow where my_ID = ?", [uid], (error, results, field) => {
            results.forEach(element => {
                arr.push(element.following_ID)
            })

            let data1 = new Array()
                   
            arr.forEach(element =>{
                pool.query('SELECT * FROM `post` WHERE `uID` = ?  ORDER BY `date` DESC',[element],(err,results,field) =>{
                    if(results != ""){
                        results.forEach(e =>{
                            data1.push(e)
                        })
                    }

                    if(element == arr[arr.length-1]){
                        
                        res.json({
                            feed: data1
                        })
                       
                    }
                })
            })
            

        })

    })
})





module.exports = router
