const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const passwordHash = require('password-hash')
const mergeJSON = require('merge-json')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const mysql = require('mysql')
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

router.post("/uploadHowtoFile", uploadHowto.single("file"), (req, res) => {
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
router.post("/addIngredientsFile", uploadIngred.single("image"), (req, res) => {
    let body = req.body
    let path = pathHttp + req.file.path
    jwt.verify(body.token, key, (err, authData) => {
        if (err) {
            return res.json({
                message: err
            })
        }

        //let uid = authData.user
        pool.query("INSERT INTO `pj_ingredients_file` (`name`, `image`) VALUES (?, ?)", [body.name, path], (error, result, field) => {
            if (error) {
                res.json({
                    message: err
                })
            }
            if (result.affectedRows == 1) {
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
router.post("/createPost", uploadRecipe.single("image"), (req, res) => {
    //console.log(req.file)
    let path = pathHttp + req.file.path
    let body = req.body

    jwt.verify(body.token, key, (err, authData) => {
        if (err) {
            return res.json({
                message: err
            })
        }

        let uid = authData.user
        //console.log(parseFloat(body.price))
        pool.query("INSERT INTO `pj_recipe` (`user_ID`, `recipe_name`, `image`, `date`,`suitable_for`, `take_time`, `food_category`, `description`,`price`) VALUES (?, ?, ?, now(),?,?,?,?,?)", [uid, body.recipe_name, path, body.suitable_for,body.take_time,body.food_category,body.description,body.price], (error, results, field) => {
            if (error) {
                res.json({
                    message: error
                })
            }


            if (results.affectedRows == 1) {
                pool.query("SELECT `rid` FROM `pj_recipe` WHERE `user_ID` = ? ORDER BY `rid` DESC LIMIT 1", [uid], (error, result, field) => {
                    return res.json({
                        success: 1,
                        recipe_ID: result[0].rid
                    })
                })
            } else {
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

router.post("/addIngredientsArray", auth.verifyToken, (req, res) => {

    jwt.verify(req.token, key, (err, authData) => {
        if (err) {
            return res.json({
                message: err
            })
        }

        let body = req.body
        var countLoop = 0
        //console.log(body.amount)
        for (var i = 0; i < body.step.length; i++) {
            pool.query("INSERT INTO `pj_ingredients` (`rid`, `ingredientName`, `amount`, `step`) VALUES (?, ?, ?, ?)", [body.recipe_ID, body.ingredientName[i], body.amount[i], body.step[i]], (error, result, field) => {
                if (error) {
                    res.json({
                        success: 0,
                        message: err
                    })
                }
                if (result.affectedRows == 1) {

                    countLoop += 1
                    if (countLoop == body.step.length) {
                        res.json({
                            success: 1
                        })
                    }
                } else {
                    return res.json({
                        success: 0
                    })
                }
            })
        }

    })


})

//เพิ่มวิธีทำแบบ Array
router.post("/addHowtoArray", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) {
            res.json({
                message: err
            })
        }

        let body = req.body
        var countLoop = 0
        for (var i = 0; i < body.step.length; i++) {
            //console.log(body.type_file[i])
            pool.query("INSERT INTO `pj_howto` (`rid`, `description`, `step`, `path_file`, `type_file`) VALUES (?, ?, ?, ?, ?)", [body.recipe_ID, body.description[i], body.step[i], body.path_file[i], body.type_file[i]], (error, result, field) => {
                if (error) {
                    res.json({
                        success: 0,
                        message: err
                    })
                }

                if (result.affectedRows == 1) {
                    countLoop += 1
                    if (countLoop == body.step.length) {
                        res.json({
                            success: 1
                        })
                    }
                } else {
                    return res.json({
                        success: 0
                    })
                }
            })
        }

    })
})



//SELECT pj_recipe.rid, pj_user.user_ID,pj_user.name_surname, pj_user.alias_name,pj_user.profile_image,pj_recipe.recipe_name, pj_recipe.image, pj_recipe.date FROM `pj_recipe`,`pj_user` where pj_recipe.user_ID = pj_user.user_ID and pj_user.user_ID = ?
router.get("/mypost/:id", (req, res) => {
    // jwt.verify(req.token,key,(err,authData) =>{
    //     if(err){
    //         return res.json({
    //             message: err
    //         })
    //     }

    let id = req.params.id
    pool.query("SELECT * FROM `pj_user` where user_ID = ?", [id], (error, result, field) => {
        if (error) { res.json({ message: error }) }
        else {
            pool.query("select count(follow_ID) as countFollower from pj_follow where following_ID = ?", [id], (error, resultCountFwer, field) => {
                if (error) { res.json({ message: error }) }
                else {
                    pool.query("select count(follow_ID) as countFollowing from pj_follow where my_ID = ?", [id], (error, resultCountFwing, field) => {
                        if (error) { res.json({ message: error }) }
                        else {
                            pool.query("SELECT rid, recipe_name, image, date, price FROM pj_recipe  WHERE pj_recipe.user_ID = ? ORDER BY date DESC", [id], (error, resultRecipe, field) => {
                                if (error) { res.json({ message: error }) }
                                else {

                                    let countLoop = 0
                                    let resultRecipeNew = []
                                    let dataScore = []
                                    
                                    if (resultRecipe.length != 0) {
                                        resultRecipe.forEach(element => {
                                            pool.query("SELECT AVG(pj_score.score) as score FROM `pj_score` WHERE `recipe_ID` = ?", [element.rid], (error, resultAvg, field) => {
                                                if (error) { res.json({ message: error }) }
                                                else {
                                                    if (resultAvg[0].score != null) {
                                                        dataScore.push(resultAvg[0].score)
                                                    } else {
                                                        dataScore.push(0)
                                                    }
                                                    resultRecipeNew.push({
                                                        rid: resultRecipe[countLoop].rid,
                                                        recipe_name: resultRecipe[countLoop].recipe_name,
                                                        image: resultRecipe[countLoop].image,
                                                        date: resultRecipe[countLoop].date,
                                                        price: resultRecipe[countLoop].price,
                                                        score: dataScore[countLoop]
                                                    })

                                                    countLoop++
                                                    if (countLoop == resultRecipe.length) {
                                                        let newData = {
                                                            user_ID: result[0].user_ID,
                                                            name_surname: result[0].name_surname,
                                                            alias_name: result[0].alias_name,
                                                            user_status: result[0].user_status,
                                                            profile_image: result[0].profile_image,
                                                            countPost: resultRecipeNew.length,
                                                            countFollower: resultCountFwer[0].countFollower,
                                                            countFollowing: resultCountFwing[0].countFollowing,
                                                            recipePost: resultRecipeNew
                                                        }

                                                        return res.json(newData)
                                                    }
                                                }
                                            })
                                        });

                                    }else{
                                        let newData = {
                                            user_ID: result[0].user_ID,
                                            name_surname: result[0].name_surname,
                                            alias_name: result[0].alias_name,
                                            user_status: result[0].user_status,
                                            profile_image: result[0].profile_image,
                                            countPost: resultRecipeNew.length,
                                            countFollower: resultCountFwer[0].countFollower,
                                            countFollowing: resultCountFwing[0].countFollowing,
                                            recipePost: resultRecipeNew
                                        }
                                        return res.json(newData)
                                    }

                                }
                            })

                        }
                    })
                }

            })



        }
        //console.log(result[0])

    })
    //})*
})

router.get("/myRecipeHowto/:rid", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) {
            return res.json({
                message: err
            })
        }

        let pid = req.params.rid

    })
})

router.post("/editRecipePost", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) {
            res.json({ message: err })
        }
        let body = req.body
        let uid = authData.user

        pool.query("update pj_recipe set recipe_name = ? ,image = ? , date = now() ,price = ? where user_ID = ? and rid = ?", [body.recipe_name, body.image, body.price, uid, body.rid], (err, result, field) => {
            if (err) {
                res.json({ message: err })
            }

            res.json({
                success: 1

            })
        })



    })
})

router.post("/addImageRecipePost", uploadRecipe.single("image"), (req, res) => {
    let body = req.body
    let path = pathHttp + req.file.path
    jwt.verify(body.token, key, (err, authData) => {
        if (err) { res, json({ message: err }) }

        return res.json({
            path: path
        })
    })
})

router.post("/editHowto", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) {
            res.json({ message: err })
        }

        let body = req.body
        //console.log(body.step)
        let loopCount = 0
        for (var i = 0; i < body.step.length; i++) {

            if (body.howto_ID[i] != null) {
                //console.log("update")
                pool.query("UPDATE `pj_howto` SET `description`=?,`step`=?,`path_file`=?,`type_file`=? where `howto_ID` = ? AND `rid` = ?", [body.description[i], body.step[i], body.path_file[i], body.type_file[i], body.howto_ID[i], body.recipe_ID], (error, result, field) => {
                    if (err) {
                        res.json({
                            message: err
                        })
                    }
                    //console.log(result)

                })
                loopCount += 1

            } else {
                //console.log("insert")
                pool.query("INSERT INTO `pj_howto` (`rid`, `description`, `step`, `path_file`, `type_file`) VALUES (?, ?, ?, ?, ?)", [body.recipe_ID, body.description[i], body.step[i], body.path_file[i], body.type_file[i]], (error, result, field) => {
                    if (err) {
                        res.json({
                            message: err
                        })
                    }
                })

                loopCount += 1

            }

            console.log(body.step.length)

            if (loopCount == body.step.length) {
                return res.json({
                    success: 1
                })
            }

        }

    })
})

router.post("/editIngredient", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) { res.json({ message: err }) }
        let body = req.body
        let countLoop = 0
        for (var i = 0; i < body.step.length; i++) {
            if (body.ingredients_ID[i] != null) {
                pool.query("UPDATE `pj_ingredients` SET `ingredientName`=?,`amount`=?,`step`=? WHERE `ingredients_ID` = ? AND `rid` = ?", [body.ingredientName[i], body.amount[i], body.step[i], body.ingredients_ID[i], body.recipe_ID], (error, result, field) => {
                    if (error) { res.json({ message: error }) }

                })
                countLoop += 1
            } else {

                pool.query("INSERT INTO `pj_ingredients` (`rid`, `ingredientName`, `amount`, `step`) VALUES (?, ?, ?, ?)", [body.recipe_ID, body.ingredientName[i], body.amount[i], body.step[i]], (error, result, field) => {
                    if (error) { res.json({ message: error }) }

                })
                countLoop += 1
            }

            if (countLoop == body.step.length) {
                return res.json({
                    success: 1
                })
            }
        }
    })
})

router.post("/deleteIngredient", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) { res.json({ message: err }) }
        let body = req.body
        pool.query("select * from pj_ingredients where ingredients_ID = ?", [body.ingredients_ID], (error, result, filed) => {
            if (error) { res.json({ message: error }) }

            if (result[0] == "") {
                return res.json({ success: 1 })
            } else {
                pool.query("DELETE FROM `pj_ingredients` WHERE `ingredients_ID` = ? and `rid` = ?", [body.ingredients_ID, body.recipe_ID], (error, result, field) => {
                    if (error) { res.json({ message: error }) }

                    if (result.affectedRows == 1) {
                        res.json({
                            success: 1
                        })
                    }
                })
            }
        })
    })
})

router.post("/deleteHowto", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) { res.json({ message: err }) }
        let body = req.body
        pool.query("select * from pj_howto where howto_ID = ?", [body.howto_ID], (error, result, filed) => {
            if (error) { res.json({ message: error }) }

            if (result[0] == "") {
                return res.json({ success: 1 })
            } else {
                pool.query("DELETE FROM `pj_howto` WHERE `howto_ID` = ? and `rid` = ?", [body.howto_ID, body.recipe_ID], (error, result, field) => {
                    if (error) { res.json({ message: error }) }

                    if (result.affectedRows == 1) {
                        res.json({
                            success: 1
                        })
                    }
                })
            }
        })
    })
})

router.get("/newfeeds", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) {
            return res.json({ message: err })
        }

        let uid = authData.user
        pool.query("SELECT pj_follow.following_ID FROM pj_follow WHERE pj_follow.my_ID = ?", [uid], (error, resultID, field) => {
            if (error) {
                res.json({
                    message: error
                })
            }
            let listUserID = new Array()
            listUserID.push(uid)

            resultID.forEach(element =>{
                listUserID.push(element.following_ID)
            })
            let newData = new Array()
            listUserID.forEach(element =>{
                //console.log(element)
               

                pool.query("SELECT pj_user.user_ID, pj_user.name_surname, pj_user.alias_name , pj_user.user_status,pj_user.access_status , pj_user.profile_image ,pj_recipe.rid ,pj_recipe.recipe_name, pj_recipe.image, pj_recipe.date, pj_recipe.price FROM pj_user,pj_recipe WHERE pj_user.user_ID = pj_recipe.user_ID AND pj_user.user_ID = ? ORDER BY pj_recipe.date DESC",[element],(error,resultData,field) =>{
                    //console.log(resultData)

                    if(resultData != ""){
                        resultData.forEach(e =>{
                            newData.push(e)
                            
                        })
                    }

                    if(element == listUserID[listUserID.length-1]){
                        newData.sort(function(a,b){
                            // Turn your strings into dates, and then subtract them
                            // to get a value that is either negative, positive, or zero.
                            return new Date(b.date) - new Date(a.date);
                          });

                        res.json({
                            success: 1,
                            feed: newData
                        })
                       
                    }
                })
            })
    
        })

    })
})

router.get("/newfeedsglobal",(req,res) =>{
    pool.query("SELECT pj_user.user_ID, pj_user.name_surname, pj_user.alias_name , pj_user.user_status,pj_user.access_status , pj_user.profile_image ,pj_recipe.rid ,pj_recipe.recipe_name, pj_recipe.image, pj_recipe.date, pj_recipe.price FROM pj_user,pj_recipe WHERE pj_user.user_ID = pj_recipe.user_ID  ORDER BY pj_recipe.date DESC",(error,result,field) =>{
        res.json(result)
    })
})

//ใช้อันนี้ ตอนกดเข้า post
router.get("/getPost/:rid", (req, res) => {
    //jwt.verify(req.token,key,(err,authData) =>{
    // if(err){
    //     res.json({
    //         message: err
    //     })
    // }

    //let uid = authData.user
    let rid = req.params.rid

    pool.query("SELECT pj_recipe.rid,pj_recipe.user_ID,pj_recipe.recipe_name,pj_user.name_surname,pj_user.alias_name,pj_user.profile_image,pj_recipe.image, pj_recipe.date, pj_recipe.price,pj_recipe.suitable_for, pj_recipe.take_time, pj_recipe.food_category, pj_recipe.description FROM `pj_recipe`,`pj_user` WHERE pj_user.user_ID = pj_recipe.user_ID and `rid` = ?", [rid], (error, resultRecipe, field) => {
        if (error) { res.json({ message: error }) }
        else {
            pool.query("SELECT `ingredients_ID`, `ingredientName`, `amount`, `step` FROM `pj_ingredients` WHERE rid = ?", [rid], (error, resultIngred, field) => {
                if (error) { res.json({ message: error }) }
                else {
                    pool.query("SELECT `howto_ID`, `description`, `step`, `path_file`, `type_file` FROM `pj_howto` WHERE rid = ?", [rid], (error, resultHowto, field) => {
                        if (error) { res.json({ message: error }) }
                        else {
                            pool.query("SELECT AVG(`score`) as score FROM `pj_score` WHERE `recipe_ID` = ?", [rid], (error, resultScore, field) => {
                                if (error) { res.json({ message: error }) }
                                else {
                                    pool.query("SELECT pj_user.user_ID,pj_user.name_surname,pj_user.alias_name,pj_user.profile_image,pj_comment.cid,pj_comment.recipe_ID,pj_comment.commentDetail,pj_comment.datetime FROM pj_user,pj_comment WHERE pj_user.user_ID = pj_comment.user_ID AND pj_comment.recipe_ID = ? ORDER BY pj_comment.datetime ASC", [rid], (error, resultsComm, filed) => {
                                        if (error) { res.json({ message: error }) }
                                        else {
                                            let newData = {
                                                rid: resultRecipe[0].rid,
                                                user_ID: resultRecipe[0].user_ID,
                                                name_surname : resultRecipe[0].name_surname,
                                                alias_name: resultRecipe[0].alias_name,
                                                profile_image: resultRecipe[0].profile_image,
                                                recipe_name: resultRecipe[0].recipe_name,
                                                image: resultRecipe[0].image,
                                                date: resultRecipe[0].date,
                                                suitable_for: resultRecipe[0].suitable_for,
                                                take_time: resultRecipe[0].take_time,
                                                food_category: resultRecipe[0].food_category,
                                                description: resultRecipe[0].description,
                                                price: resultRecipe[0].price,
                                                ingredient: resultIngred,
                                                howto: resultHowto,
                                                score: resultScore[0].score,
                                                comment: resultsComm
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

        }
    })
    //})*
})

//score//
router.post("/score", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) { res.json({ message: err }) }
        let body = req.body
        let uid = authData.user
        //console.log(uid)
        pool.query("SELECT `score_ID` FROM `pj_score` WHERE `user_ID` = ? AND `recipe_ID` = ?", [uid, body.recipe_ID], (error, results, field) => {
            if (error) { res.json({ message: error }) }
            else {
                if (results != "") {
                    pool.query("UPDATE `pj_score` SET `score`= ? WHERE `score_ID` = ?", [body.score, results[0].score_ID], (error, resultScore, field) => {
                        if (error) { res.json({ message: error }) }
                        else {
                            pool.query("SELECT AVG(`score`) as AVGscore FROM `pj_score` WHERE `recipe_ID` = ?", [body.recipe_ID], (error, resultAvg, field) => {
                                if (error) { res.json({ message: error }) }
                                else {
                                    return res.json({
                                        success: 1,
                                        avgscore: resultAvg[0].AVGscore
                                    })
                                }
                            })
                        }
                    })
                } else {
                    pool.query("INSERT INTO `pj_score` (`user_ID`, `recipe_ID`, `score`) VALUES (?, ?, ?)", [uid, body.recipe_ID, body.score], (error, resultScore, field) => {
                        if (error) { res.json({ message: error }) }
                        else {
                            if (resultScore.affectedRows == 1) {
                                pool.query("SELECT AVG(`score`) as AVGscore FROM `pj_score` WHERE `recipe_ID` = ?", [body.recipe_ID], (error, resultAvg, field) => {
                                    if (error) { res.json({ message: error }) }
                                    else {
                                        return res.json({
                                            success: 1,
                                            avgscore: resultAvg[0].AVGscore
                                        })
                                    }
                                })
                            } else {
                                return res.json({
                                    success: 0

                                })
                            }
                        }
                    })
                }
            }
        })
    })
})


//สองอันนี้ ถ้าตอนกดเข้าดูอันที่เลือกค่อยส่ง rid เข้า service getPost เอาเด้อ
router.get("/searchIngredient/:name", (req, res) => {
    //jwt.verify(req.token,key,(err,authData) =>{
    //if(err){res.json({message: err})}
    //  else{*
    // let uid = authData.user
    let name = req.params.name
    pool.query("SELECT  `rid`, `ingredientName` FROM `pj_ingredients` WHERE `ingredientName` LIKE concat(?,'%')", [name], (error, result, field) => {
        res.json({
            data: result
        })
    })
    //  }*
    //  })*
})

//searchRecipeName
router.get("/searchRecipeName/:name", (req, res) => {
    //jwt.verify(req.token,key,(err,authData) =>{
    // if(err){res.json({message: err})}
    // else{
    //let uid = authData.user
    let name = req.params.name
    pool.query("SELECT  pj_recipe.rid,  pj_recipe.recipe_name, pj_recipe.image ,pj_user.user_ID, pj_user.alias_name,pj_user.name_surname,pj_user.profile_image FROM `pj_recipe`, pj_user WHERE pj_user.user_ID = pj_recipe.user_ID AND  pj_recipe.recipe_name LIKE concat(?,'%') order by recipe_name", [name], (error, result, field) => {
        //console.log(result[0].rid)
        let countLoop = 0
        let data = []
        let newData = []
        result.forEach(element => {
            pool.query("SELECT AVG(`score`) as AVGscore FROM `pj_score` WHERE `recipe_ID` = ?", [element.rid], (error, resutlsScore, field) => {

                if (error) { res.json({ message: err }) }
                else {

                    if (resutlsScore[0].AVGscore != null) {
                        data.push(resutlsScore[0].AVGscore)
                    } else {
                        data.push(0)
                    }
                    //alias_name,pj_user.name_surname,pj_user.profile_image
                    newData.push({
                        rid: result[countLoop].rid,
                        recipe_name: result[countLoop].recipe_name,
                        image: result[countLoop].image,
                        user_ID: result[countLoop].user_ID,
                        alias_name: result[countLoop].alias_name,
                        name_surname: result[countLoop].name_surname,
                        profile_image: result[countLoop].profile_image,
                        score: data[countLoop]
                    })
                    //console.log(data)
                    countLoop += 1

                    if (countLoop == result.length) {
                        res.json({
                            data: newData
                        })
                    }
                }
            })
        });
        // res.json({
        //     data: result
        // })
    })
    //}*
    //})*
})

router.post("/commentPost", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) { res.json({ message: err }) }
        else {
            let body = req.body
            let uid = authData.user

            pool.query("INSERT INTO `pj_comment` (`recipe_ID`, `user_ID`, `commentDetail`, `datetime`) VALUES (?, ?, ?, CURRENT_TIMESTAMP)", [body.recipe_ID, uid, body.commentDetail], (error, result, field) => {
                if (error) { res.json({ message: error }) }
                else {
                    if (result.affectedRows == 1) {
                        pool.query("SELECT pj_user.user_ID,pj_user.name_surname,pj_user.alias_name,pj_user.profile_image,pj_comment.cid,pj_comment.recipe_ID,pj_comment.commentDetail,pj_comment.datetime FROM pj_user,pj_comment WHERE pj_user.user_ID = pj_comment.user_ID AND pj_comment.recipe_ID = ? AND pj_comment.user_ID = ? ORDER BY pj_comment.cid DESC LIMIT 1", [body.recipe_ID, uid], (error, resultComm, field) => {
                            if (error) { res.json({ message: error }) }
                            else {
                                res.json({
                                    success: 1,
                                    comment: resultComm
                                })
                            }
                        })
                    } else {
                        res.json({
                            success: 0
                        })
                    }

                }
            })
            //res.json(authData)
        }

    })
})

router.get("/getComment/:rid", (req, res) => {
    let rid = req.params.rid
    pool.query("SELECT pj_user.user_ID,pj_user.name_surname,pj_user.alias_name,pj_user.profile_image,pj_comment.cid,pj_comment.recipe_ID,pj_comment.commentDetail,pj_comment.datetime FROM pj_user,pj_comment WHERE pj_user.user_ID = pj_comment.user_ID AND pj_comment.recipe_ID = ? ORDER BY pj_comment.datetime ASC", [rid], (error, results, filed) => {
        if (error) { res.json({ message: error }) }
        else {
            res.json(results)
        }
    })
})

router.get("/searchWithCategory/:name", (req, res) => {
    let name = req.params.name
    pool.query("SELECT pj_recipe.rid,pj_recipe.user_ID,pj_user.name_surname,pj_user.alias_name,pj_user.profile_image,pj_recipe.recipe_name,pj_recipe.food_category,pj_recipe.description,pj_recipe.image,pj_recipe.price from pj_recipe,pj_user where pj_user.user_ID = pj_recipe.user_ID and food_category = ?", [name], (error, results, filed) => {
        if (error) { res.json({ message: error }) }
        else {
            //console.log(results)
            if(results == "" || results == null){
                res.json({message:"ไม่พบหมวดหมู่ "+name+ " ในการค้นหานี้ "})
            }else{
                let dataScore = []
            let countLoop = 0
            let dataRecipe = []
            results.forEach(element =>{
                pool.query("SELECT AVG(`score`) as score FROM `pj_score` WHERE `recipe_ID` = ?",[element.rid],(error ,score1,filed) =>{
                    if (error) { res.json({ message: error }) }
                    else{
                        if(score1[0].score != null){
                            dataScore.push(score1[0].score)
                        }else{         
                            dataScore.push(0)
                        }
     
                        dataRecipe.push({
                            rid: results[countLoop].rid,
                            user_ID: results[countLoop].user_ID,
                            name_surname: results[countLoop].name_surname,
                            alias_name: results[countLoop].alias_name,
                            profile_image: results[countLoop].profile_image,
                            recipe_name: results[countLoop].recipe_name,
                            food_category: results[countLoop].food_category,
                            description: results[countLoop].description,
                            image: results[countLoop].image,
                            price: results[countLoop].price,
                            score: dataScore[countLoop]
                        })
                        countLoop++
                        if(countLoop == results.length){
                            
        
                            res.json(dataRecipe)
                        }
                        
                        
                    }
                })
                
            })
            }
            
            
            
            
        }
    })
})

router.post("/buy",auth.verifyToken, (req,res) =>{
    jwt.verify(req.token, key, (err, authData) =>{
        if (err) { res.json({ success: 0,message: err }) }

        let rid = req.body.rid
        let uid = authData.user

        //query price of recipe
        pool.query("select user_ID,price from pj_recipe where rid = ? ",[rid],(error,resultR,field) =>{
            if(error) {res.json({success: 0,message: error})}
            else{
                //query balance of user by id
                if(resultR[0].price > 0){
                    pool.query("select balance from pj_user where user_ID = ?",[uid],(error,balance,field) =>{
                        if(error) {res.json({success: 0,message: error})}
                        else{
                            if(balance[0].balance >= resultR[0].price){
                                //partner balance
                                let myBalance = balance[0].balance - resultR[0].price
                                let partnerBalance = resultR[0].price
                                let partnerID = resultR[0].user_ID

                                //query balance of partner for update
                                pool.query("select balance from pj_user where user_ID = ?",[partnerID],(error2,balanceP,field) =>{
                                    partnerBalance = balanceP[0].balance + partnerBalance

                                    //update all data
                                    //this update myBalance
                                    pool.query("update pj_user set balance = ? where user_ID = ?",[myBalance,uid])
                                    //this update partnerBalance
                                    pool.query("update pj_user set balance = ? where user_ID = ?",[partnerBalance,partnerID])
                                    let state = ""
                                    //insert data in buy table
                                    pool.query("INSERT INTO `pj_buy` (`recipe_ID`, `user_ID`, `datetime`, `price`) VALUES (?, ?, now(), ?)",[rid,uid,resultR[0].price],(error,resultBuy,field) =>{
                                        if(error){res.json({success: 0,message: error})}
                                        else{ 
                                            if(resultBuy.affectedRows == 1){
                                                //insert transection of my by id
                                                state = "buy_recipe"
                                                pool.query("INSERT INTO `pj_transaction`(`user_ID`, `state`, `money`, `datetime`) VALUES (?,?,?,CURRENT_TIMESTAMP)",[uid,state,resultR[0].price])
                                                
                                                //insert data in sell table
                                                pool.query("INSERT INTO `pj_sell` (`user_ID`,`partner_ID`, `recipe_ID`, `datetime`, `price`) VALUES (?, ?,?, now(), ?)",[partnerID,uid,rid,resultR[0].price],(error,resultSell,field) =>{
                                                    if(error){res.json({message: error})}
                                                    if(resultSell.affectedRows == 1){
                                                        //insert transection of partner by id
                                                        state = "sell_recipe"
                                                        pool.query("INSERT INTO `pj_transaction`(`user_ID`, `state`, `money`, `datetime`) VALUES (?,?,?,CURRENT_TIMESTAMP)",[partnerID,state,resultR[0].price])
                                                        res.json({success: 1,message: "ดำเนินการสำเร็จ"})
                                                    }
                                                })
                                            }
                                        }
                                    })
                                    
                                })
                                
                            }else{
                                res.json({success: 0,message: "เงินคุณไม่พอสำหรับซื้อสูตรอาหาร"})
                            }
                        }
                    })
                }
            }
            
        })

    })
})

router.get("/mybuy",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){res.json({message: err})}
        let uid = authData.user

        pool.query("select pj_buy.bid,pj_buy.recipe_ID,pj_buy.datetime,pj_buy.price,pj_recipe.recipe_name,pj_recipe.image,pj_recipe.food_category,pj_recipe.description from pj_buy,pj_recipe where pj_recipe.rid = pj_buy.recipe_ID and pj_buy.user_ID = ?",[uid],(error,result,field) =>{
            res.json(result)
        })
    })
})

router.get("/mysell",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){res.json({message: err})}
        let uid = authData.user

        pool.query("select pj_sell.sid,pj_sell.datetime,pj_recipe.recipe_name,pj_user.name_surname,pj_sell.price from pj_user,pj_recipe,pj_sell where pj_user.user_ID = pj_recipe.user_ID and pj_recipe.rid = pj_sell.recipe_ID and pj_sell.user_ID = ?",[uid],(error,result,field) =>{
            res.json(result)
        })
    })
})

/*
const sl = require('../../test1/select')

router.get("/test1",  (req,res) =>{
    let uid = 1
    let sql = "select * from pj_user where user_ID =?"
    sql = mysql.format(sql,[uid])
    sl.Query(sql,function(result){
        res.json(result[0].email)
    })
    console.log(sl)
    
})

*/

router.post("/deleteRecipe",auth.verifyToken,(req,res) =>{
    jwt.verify(req.token,key,(err,authData) =>{
        if(err){res.json({message: err})}
        let uid = authData.user
        let rid = req.body.recipe_ID

        pool.query("select count(pj_recipe.rid) as amountMyR from pj_recipe,pj_user where pj_user.user_ID = pj_recipe.user_ID and pj_user.user_ID = ? and pj_recipe.rid = ?",[uid,rid],(error,checkRes,field) =>{
            
            if(checkRes[0].amountMyR == 1){
                pool.query("select count(bid) as amountR from pj_buy where recipe_ID = ?",[rid],(error,result,field) =>{
                    if(result[0].amountR != 0){
                        res.json({success: 0,message: "ไม่สามารถลบสูตรอาหารได้ เนื่องจากสูตรนี้ได้ทำการซื้อขายแล้ว"})
                    }else{
                        //to do delete
                        pool.query("delete from pj_comment where recipe_ID = ?",[rid])
                        pool.query("delete from pj_howto where rid = ?",[rid])
                        pool.query("delete from pj_score where recipe_ID = ?",[rid])
                        pool.query("delete from pj_ingredients where rid = ?",[rid])
                        pool.query("delete from pj_recipe where rid = ?",[rid],(error,resultReci,field) =>{
                            if(resultReci.affectedRows != 0){
                                res.json({success: 1,message: "ดำเนินการสำเร็จ!"})
                            }
                        })

                    }
        
                })
            }else{
                res.json({success:0,message: "hacker!!"})
            }
            
        })
        
       
    })
})

//random recipe
router.get("/recommendRecipe",(req,res) =>{
    //SELECT pj_recipe.rid ,pj_user.user_ID, pj_user.name_surname FROM pj_recipe,pj_user WHERE  pj_user.user_ID = pj_recipe.user_ID  ORDER BY RAND() LIMIT 5 

    pool.query("SELECT pj_recipe.rid ,pj_recipe.recipe_name,pj_recipe.image,pj_recipe.price,pj_recipe.food_category,pj_user.user_ID, pj_user.name_surname,pj_user.alias_name,pj_user.profile_image FROM pj_recipe,pj_user WHERE  pj_user.user_ID = pj_recipe.user_ID  ORDER BY RAND() LIMIT 5 ",(error,result,field) =>{
        let arr_rid = new Array()

        result.forEach(element =>{
            arr_rid.push(element.rid)
        })
        let newData = new Array()
        let countLoop = 0
        let dataRecipe = new Array()
        arr_rid.forEach(element =>{
            pool.query("SELECT AVG(`score`) as score FROM `pj_score` WHERE `recipe_ID` = ? ",[element],(error,resultAvg,field) =>{
                if(resultAvg[0].score != null){
                    newData.push(resultAvg[0].score)
                }else{
                    newData.push(0)
                }

                dataRecipe.push({
                            rid: result[countLoop].rid,
                            user_ID: result[countLoop].user_ID,
                            name_surname: result[countLoop].name_surname,
                            alias_name: result[countLoop].alias_name,
                            profile_image: result[countLoop].profile_image,
                            recipe_name: result[countLoop].recipe_name,
                            food_category: result[countLoop].food_category,
                            image: result[countLoop].image,
                            price: result[countLoop].price,
                            score: newData[countLoop]
                })
                countLoop++

                if(countLoop == result.length){
                    res.json(dataRecipe)
                }


            })
        })
        //res.json(arr_rid)
    })
})














module.exports = router