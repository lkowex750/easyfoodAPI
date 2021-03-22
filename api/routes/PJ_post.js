const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const passwordHash = require('password-hash')
const mergeJSON = require('merge-json')
const multer = require('multer')
const jwt = require('jsonwebtoken')

var auth = require('../../check-auth/auth')
const { json } = require('body-parser')
var key = "easycook"
//https://apifood.comsciproject.com
//http://localhost:3000
let pathHttp = "https://apifood.comsciproject.com" + '/' 

const storageHowto = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploadHowto/')
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:|\./g, '') + '-' + file.originalname);
    }
})

const storageIngred = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploadIngredients_file/')
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:|\./g, '') + '-' + file.originalname);
    }
})

const storageRecipe = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploadPost/')
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:|\./g, '') + '-' + file.originalname);
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'video/mkv') {
        //console.log("video")
        cb(null, true)
    } else {
        cb(null, false)
    }
}

const uploadHowto = multer({
    storage: storageHowto
    // limits: {
    //     fileSize: 2048 * 2048 * 10
    // }
    //fileFilter: fileFilter
})

//เรียก uploadของ 

const uploadIngred = multer({
    storage: storageRecipe
})

const uploadRecipe = multer({
    storage: storageRecipe
})

//'video/x-matroska'
//'video/mp4'

router.post("/uploadHowtoFile",uploadHowto.single("file"),(req,res) =>{
    console.log(req.file)
    let type = req.file.mimetype
    let typeArr = type.split('/')
    type = typeArr[0]
    let path = pathHttp + req.file.path
    res.json({
        path: path,
        type: type
    })
})


//เพิ่มข้อมูลวัตถุดิบเข้าระบบ
router.post("/addIngredientsFile",uploadIngred.single("image"),(req,res) =>{
    let body = req.body
    let path = pathHttp + req.file.path
     jwt.verify(body.token,key,(err,authData) =>{
        if(err){
            return res.json({
                message: err
            })
        }

        //let uid = authData.user
        pool.query("INSERT INTO `pj_ingredients_file` (`name`, `image`) VALUES (?, ?)",[body.name,path],(error,result,field) =>{
            if(error){
                res.json({
                    message: err
                })
            }
            if(result.affectedRows == 1){
                return res.json({
                    success: 1,
                    message: "เพิ่มข้อมูลวัตถุดิบเข้าระบบ สำเร็จ"
                })
            }
        })
     })
    
    //console.log(req.file)
})


//เพิ่ม post
router.post("/createPost",uploadRecipe.single("image"),(req,res) =>{
    //console.log(req.file)
    let path = pathHttp + req.file.path
    let body = req.body
    
    jwt.verify(body.token,key,(err,authData) =>{
        if(err){
            return res.json({
                message: err
            })
        }

        let uid = authData.user
        //console.log(parseFloat(body.price))
        pool.query("INSERT INTO `pj_recipe` (`user_ID`, `recipe_name`, `image`, `date`,`price`) VALUES (?, ?, ?, now(),?)",[uid,body.recipe_name,path,body.price],(error,results,field) =>{
            if(error){
                res.json({
                    message: error
                })
            }
           

            if(results.affectedRows == 1){
                pool.query("SELECT `rid` FROM `pj_recipe` WHERE `user_ID` = ? ORDER BY `rid` DESC LIMIT 1",[uid],(error,result,field) =>{
                    return res.json({
                        success: 1,
                        recipe_ID: result[0].rid
                    })
                })
            }else{
                return res.json({
                    success: 0,
                    message: "something failed!"
                })
            }
        })
    })
})

//เพิ่ม วัตถุดิบลง post  <<== จะส่งแบบไหนดี array หรือ loop ส่ง
// router.post("/addIngredients",auth.verifyToken,(req,res) =>{
//     jwt.verify(req.token,key,(err,authData) =>{
//         if(err){
//             return res.json({
//                 message: err
//             })
//         }

//         let body = req.body
//         pool.query("INSERT INTO `pj_ingredients` (`rid`, `ingredients_file_ID`, `amount`, `unit`) VALUES (?, ?, ?, ?)",[body.recipe_ID,body.ingredients_file_ID,body.amount,body.unit],(error,result,field) =>{
//             if(error){
//                 res.json({
//                     message: err
//                 })
//             }
//             if(result.affectedRows == 1){
//                 return res.json({
//                     success: 1,
//                     message: "insert ingredients success!"
//                 })
//             }

//         })

//     })
// })

//เพิ่มวัตถุดิบแบบ Array

router.post("/addIngredientsArray",auth.verifyToken,(req,res) =>{
    
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){
            return res.json({
                message: err
            })
        }

        let body = req.body
        var countLoop = 0
       //console.log(body.amount)
        for(var i=0;i<body.step.length;i++){
            pool.query("INSERT INTO `pj_ingredients` (`rid`, `ingredientName`, `amount`, `step`) VALUES (?, ?, ?, ?)",[body.recipe_ID,body.ingredientName[i],body.amount[i],body.step[i]],(error,result,field) =>{
                if(error){
                    res.json({
                        success: 0,
                        message: err
                    })
                }
                if(result.affectedRows == 1){
                    
                    countLoop +=1
                    if(countLoop == body.step.length){
                        res.json({
                            success: 1
                        })
                    }
                }else{
                    return res.json({
                        success: 0
                    })
                }
            })
        }
       
    })
    
    
})

//เพิ่มวิธีทำแบบ Array
router.post("/addHowtoArray",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){
            res.json({
                message: err
            })
        }

        let body = req.body
        var countLoop = 0
        for(var i=0;i<body.step.length;i++){
            //console.log(body.type_file[i])
            pool.query("INSERT INTO `pj_howto` (`rid`, `description`, `step`, `path_file`, `type_file`) VALUES (?, ?, ?, ?, ?)",[body.recipe_ID,body.description[i],body.step[i],body.path_file[i],body.type_file[i]],(error,result,field) =>{
                if(error){
                    res.json({
                        success: 0,
                        message: err
                    })
                }

                if(result.affectedRows ==1){
                    countLoop +=1
                    if(countLoop == body.step.length){
                        res.json({
                            success: 1
                        })
                    }
                }else{
                    return res.json({
                        success: 0
                    })
                }
            })
        }

    })
})

router.get("/mypost/:id",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){
            return res.json({
                message: err
            })
        }

        let id = req.params.id
        pool.query("SELECT pj_recipe.rid, pj_user.user_ID,pj_user.name_surname, pj_user.alias_name,pj_user.profile_image,pj_recipe.recipe_name, pj_recipe.image, pj_recipe.date FROM `pj_recipe`,`pj_user` where pj_recipe.user_ID = pj_user.user_ID and pj_user.user_ID = ?",[id], (error,result,field) =>{
            //console.log(result[0])
            var data = []
            var dataHowto = []
            var loop = 0
            var countLoop = result.length
            result.forEach(element => {
               console.log(element.rid)
                pool.query("SELECT * FROM `pj_ingredients` WHERE rid= ? ORDER BY step ASC",[element.rid],(error,result1,field) =>{
                    data.push(result1)
                    loop+=1

                    if(countLoop == loop){
                        var loop1 = 0
                        var countLoop1 = result.length
                        result.forEach(element => {
                            pool.query("SELECT * FROM `pj_Howto` WHERE rid= ? ORDER BY step ASC",[element.rid],(error,result2,field) =>{
                                dataHowto.push(result2)
                                loop1+=1
                                if(countLoop1 == loop1){
                                    res.json({post: result,indient: data,HowTo: dataHowto})
                                }
                                
                            })
                        });
                        
                   }
                    
               })

              
               
            });
            
          
           
            // return res.json({
            //     data: result
            // })
        })
    })
})

router.get("/myRecipeHowto/:rid",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){
            return res.json({
                message: err
            })
        }

        let pid = req.params.rid
        
    })
})

router.post("/editRecipePost",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){
            res.json({message:err})
        }
        let body = req.body
        let uid = authData.user

        pool.query("update pj_recipe set recipe_name = ? ,image = ? , date = now() ,price = ? where user_ID = ? and rid = ?",[body.recipe_name,body.image,body.price,uid,body.rid],(err,result,field) =>{
            if(err){
                res.json({message: err})
            }

            res.json({
                success: 1

            })
        })


        
    })
})

router.post("/addImageRecipePost",uploadRecipe.single("image"),(req,res) =>{
    let body = req.body
    let path = pathHttp+req.file.path
    jwt.verify(body.token,key,(err,authData) =>{
        if(err){res,json({message: err})}

        return res.json({
            path: path
        })
    })
})

router.post("/editHowto",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){
            res.json({message: err})
        }

        let body = req.body
        //console.log(body.step)
        let loopCount = 0
        for(var i=0;i<body.step.length;i++){
            
            if(body.howto_ID[i] != null){
                //console.log("update")
                 pool.query("UPDATE `pj_howto` SET `description`=?,`step`=?,`path_file`=?,`type_file`=? where `howto_ID` = ? AND `rid` = ?",[body.description[i],body.step[i],body.path_file[i],body.type_file[i],body.howto_ID[i],body.recipe_ID],(error,result,field) =>{
                     if(err){
                         res.json({
                             message:err
                         })
                     }
                     //console.log(result)
                     
                 })
                 loopCount+=1
                 
            }else{
                //console.log("insert")
                pool.query("INSERT INTO `pj_howto` (`rid`, `description`, `step`, `path_file`, `type_file`) VALUES (?, ?, ?, ?, ?)",[body.recipe_ID,body.description[i],body.step[i],body.path_file[i],body.type_file[i]],(error,result,field) =>{
                    if(err){
                        res.json({
                            message:err
                        })
                    }
                })

                loopCount+=1
                
            }

            console.log(body.step.length)

            if(loopCount == body.step.length){
                return res.json({
                    success : 1
                })
            }
          
        }

    })
})

router.post("/editIngredient",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){res.json({message:err})}
        let body = req.body
        let countLoop = 0
        for(var i=0;i<body.step.length;i++){
            if(body.ingredients_ID[i] != null){
                pool.query("UPDATE `pj_ingredients` SET `ingredientName`=?,`amount`=?,`step`=? WHERE `ingredients_ID` = ? AND `rid` = ?",[body.ingredientName[i],body.amount[i],body.step[i],body.ingredients_ID[i],body.recipe_ID],(error,result,field) =>{
                    if(error){res.json({message:error})}
                    
                })
                countLoop+=1
            }else{
                
                pool.query("INSERT INTO `pj_ingredients` (`rid`, `ingredientName`, `amount`, `step`) VALUES (?, ?, ?, ?)",[body.recipe_ID,body.ingredientName[i],body.amount[i],body.step[i]],(error,result,field) =>{
                    if(error){res.json({message:error})}
                    
                })
                countLoop+=1
            }

            if(countLoop == body.step.length){
                return res.json({
                    success : 1
                })
            }
        }
    })
})

router.post("/deleteIngredient",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){res.json({message:err})}
        let body = req.body
        pool.query("select * from pj_ingredients where ingredients_ID = ?",[body.ingredients_ID],(error,result,filed) =>{
            if(error){res.json({message:error})}

            if(result[0] == ""){
                return res.json({success: 1})
            }else{
                pool.query("DELETE FROM `pj_ingredients` WHERE `ingredients_ID` = ? and `rid` = ?",[body.ingredients_ID,body.recipe_ID],(error,result,field) =>{
                    if(error){res.json({message:error})}

                    if(result.affectedRows == 1){
                        res.json({
                            success: 1
                        })
                    }
                })
            }
        })
    })
})

router.post("/deleteHowto",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){res.json({message:err})}
        let body = req.body
        pool.query("select * from pj_howto where howto_ID = ?",[body.howto_ID],(error,result,filed) =>{
            if(error){res.json({message:error})}

            if(result[0] == ""){
                return res.json({success: 1})
            }else{
                pool.query("DELETE FROM `pj_howto` WHERE `howto_ID` = ? and `rid` = ?",[body.howto_ID,body.recipe_ID],(error,result,field) =>{
                    if(error){res.json({message:error})}

                    if(result.affectedRows == 1){
                        res.json({
                            success: 1
                        })
                    }
                })
            }
        })
    })
})

router.get("/newfeeds",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){
            return res.json({message:err})
        }

        let uid = authData.user
        pool.query("SELECT pj_user.user_ID, pj_user.name_surname, pj_user.alias_name , pj_user.user_status,pj_user.access_status , pj_user.profile_image ,pj_recipe.rid , pj_recipe.recipe_name, pj_recipe.image, pj_recipe.date, pj_recipe.price FROM pj_user,pj_recipe WHERE pj_user.user_ID = pj_recipe.user_ID AND pj_user.user_ID = ? ORDER BY pj_recipe.date DESC",[uid],(error,result,field) =>{
            if(error){
                res.json({
                    message: error
                })
            }

            return res.json({
                success: 1,
                feeds: result
            })
        })

    })
})

//ใช้อันนี้ ตอนกดเข้า post
router.get("/getPost/:rid",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){
            res.json({
                message: err
            })
        }

        let uid = authData.user
        let rid = req.params.rid

        pool.query("SELECT `rid`, `user_ID`, `recipe_name`, `image`, `date`, `price` FROM `pj_recipe` WHERE `rid` = ? AND `user_ID` = ?",[rid,uid],(error,resultRecipe,field) =>{  
            if(error){res.json({message: error })}       
            else{
                pool.query("SELECT `ingredients_ID`, `ingredientName`, `amount`, `step` FROM `pj_ingredients` WHERE rid = ?",[rid],(error,resultIngred,field) =>{
                    if(error){res.json({message: error})}
                    else{
                        pool.query("SELECT `howto_ID`, `description`, `step`, `path_file`, `type_file` FROM `pj_howto` WHERE rid = ?",[rid],(error,resultHowto,field) =>{
                            if(error){res.json({message: error})}
                            else{
                                pool.query("SELECT AVG(`score`) as score FROM `pj_score` WHERE `recipe_ID` = ?",[rid],(error,resultScore,field) =>{
                                    if(error){res.json({message: error})}
                                    else{

                                        let newData = {
                                            rid: resultRecipe[0].rid,
                                            user_ID: resultRecipe[0].user_ID,
                                            recipe_name: resultRecipe[0].recipe_name,
                                            image: resultRecipe[0].image,
                                            date: resultRecipe[0].date,
                                            price: resultRecipe[0].price,
                                            ingredient: resultIngred,
                                            howto: resultHowto,
                                            score: resultScore[0].score
                                        }

                                        return res.json(newData)
                                    }
                                })                           
                            }
                        })
                    }
                })
                
            }
        })
    })
})






module.exports = router