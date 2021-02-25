const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const multer = require('multer')
const auth = require('../../check-auth/auth')
const jwt = require('jsonwebtoken')
const mergeJSON = require('merge-json')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:|\./g, '') + '-' + file.originalname);
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/gif') {
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
        pool.query("SELECT * FROM `post` WHERE `uID` = ? ORDER BY `date` DESC", [uid], (error, results, field) => {

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
                
                pool.query('SELECT user.username,user.nickName,user.profile_img ,`post_ID`, `uID`, `status_post`, `privacy_post`, `image`, `caption`, `date` FROM `post`,user WHERE user.user_ID = post.uID and uID = ? ORDER BY `date` DESC',[element],(err,results,field) =>{
                    if(results != ""){
                        results.forEach(e =>{
                            data1.push(e)
                            
                        })
                    }

                    if(element == arr[arr.length-1]){
                        data1.sort(function(a,b){
                            // Turn your strings into dates, and then subtract them
                            // to get a value that is either negative, positive, or zero.
                            return new Date(b.date) - new Date(a.date);
                          });
                        res.json({
                            feed: data1
                        })
                       
                    }
                })
            })
            

        })

    })
})


//##########################################-สำหรับตอนค้นหา-###################################################
router.get('/countMyPostUser/:id',(req,res)=>{
    let userID = req.params.id
    pool.query("select count(post_ID) as countMyPost from post where uID = ? ", [userID], (error, results, field) => {
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

router.get('/mypostUser/:id',(req, res) => {
    let userID = req.params.id
    pool.query("SELECT * FROM `post` WHERE `uID` = ? ORDER BY `date` DESC", [userID], (error, results, field) => {
        return res.json({
            data: results
        })
    })

})
//##########################################-สำหรับตอนค้นหา-###################################################

//EditPost ส่ง token มา และ ค่าต่างๆของโพสต์มาใน body

router.post('/editPost',auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,'secretkey', (err, authData) =>{
        if(err){
            res.json({message:"something this wrong!!"})
        }
        let post = req.body
        let uid = authData.user
        pool.query("select * from post where post_ID = ? and uID = ?",[post.post_ID,uid],(error,results,field) =>{
            let oldData = results[0]
             if (results == "") {
                return res.json({
                 success: 0,
                 message: "nodata"
            })
        }
            let jsonOldData = JSON.parse(JSON.stringify(oldData))

            let newData = mergeJSON.merge(jsonOldData, post)
            pool.query("UPDATE `post` SET `post_ID`=?,`uID`=?,`status_post`=?,`privacy_post`=?,`image`=?,`caption`=? WHERE `post_ID` = ? AND `uID` = ?",
            [newData.post_ID,uid,newData.status_post,newData.privacy_post,newData.image,newData.caption,newData.post_ID,uid],(error,results,field) =>{
            if(error){res.json({message: error})}
            
            else {return res.json({
                success: 1
                  })
             }
             })
        })
        
    })
})

//deletePost ส่ง token มา และ ค่าต่างๆของโพสต์มาใน body

router.post('/deletePost',auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,'secretkey',(err,authData) =>{
        if(err){
            res.json({message:"something this wrong!!"})
        }
        let post = req.body
        let uid = authData.user
        
        pool.query("delete from likepost where pID = ?",[post.post_ID])//delete like
        pool.query("delete from commentpost where pID = ?",[post.post_ID])//delete comment
        pool.query("delete from post where post_ID = ? and uID = ?",[post.post_ID,uid],(error,results,field) =>{
            if(error){res.json({message: error})}
            if(results.affectedRows != 0){
                return res.json({success: 1})
            }
        })
    })
})

module.exports = router
