const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const multer = require('multer')

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'uploads/')
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



router.post('/',upload.single('postImage'),(req,res,next)=>{
    console.log(req.file.path)
    let path = "http://apifood.comsciproject.com"+'/'+req.file.path
    let body = req.body
    
    pool.query("INSERT INTO `post` (`post_ID`, `uID`, `status_post`, `privacy_post`, `image`, `caption`, `date`) VALUES (NULL, ?, ?, ?, ?, ?,now())",
    [body.uID,body.status_post,body.privacy_post,path,body.caption],(error,results,field)=>{
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



router.get('/',(req,res)=>{
    
    
    pool.query("SELECT * FROM post",[],(error,results,field)=>{
        return res.json({
            data: results
        })
    })

})

module.exports = router
