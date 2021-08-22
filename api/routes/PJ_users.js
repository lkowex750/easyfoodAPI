const express = require('express')
const router = express.Router()
const pool = require('../../database/database')
const passwordHash = require('password-hash')
const mergeJSON = require('merge-json')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const admin = require('firebase-admin')
const nodemailer = require('nodemailer')


var auth = require('../../check-auth/auth')
var key = "easycook"
let pathHttp = "https://apifood.comsciproject.com" + '/'
let pathLocal = "http://localhost:3000" + '/'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploadProfilePj/')
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
        fileSize: 2048 * 2048 * 10
    },
    fileFilter: fileFilter
})



router.post("/signup", (req, res) => {
    let body = req.body
    //console.log()
    body.password = passwordHash.generate(body.password)
    //let img = "http://apifood.comsciproject.com/uploadProfile/img_avatar.png"
    let path = "http://apifood.comsciproject.com/uploadProfile/img_avatar.png"
    let alias = "ท่านสมาชิก"

    pool.query("INSERT INTO `pj_user` (`email`,`facebookID`, `password`, `name_surname`, `alias_name`, `user_status`, `access_status`, `balance`, `profile_image`) VALUES (?,NULL, ?, ?, ?, 1, 1, 0.00, ?)", [body.email, body.password, body.name_surname, alias, path], (err, results, fields) => {
        if (err) {
            if (err.errno == 1062) {
                return res.json({
                    success: 0,
                    message: "อีเมล " + body.email + " ถูกใช้งานแล้ว"
                })
            }
            return res.json({
                success: 0,
                message: err
            })
        }
        pool.query("select `user_ID` from `pj_user` where email = ? and password = ?", [body.email, body.password], (err, results1, field) => {
            if (err) {
                res.json({
                    message: err,
                    success: 0

                })
            }

            jwt.sign({ user: results1[0].user_ID }, key, (err, token) => {
                return res.json({
                    success: 1,
                    token
                })
            })
        })
    })



})

router.post("/signupNewStep1", (req, res) => {
    let body = req.body
    //console.log()
    body.password = passwordHash.generate(body.password)
    //let img = "http://apifood.comsciproject.com/uploadProfile/img_avatar.png"
    let path = "http://apifood.comsciproject.com/uploadProfile/img_avatar.png"
    let alias = "ท่านสมาชิก"

    pool.query("INSERT INTO `pj_user` (`email`,`facebookID`, `password`, `name_surname`, `alias_name`, `user_status`, `access_status`, `balance`, `profile_image`) VALUES (?,NULL, ?, ?, ?, 1, 1, 0.00, ?)", [body.email, body.password, body.email, alias, path], (err, results, fields) => {
        if (err) {
            if (err.errno == 1062) {
                return res.json({
                    success: 0,
                    message: "อีเมล " + body.email + " ถูกใช้งานแล้ว"
                })
            }
            return res.json({
                success: 0,
                message: err
            })
        }
        pool.query("select `user_ID` from `pj_user` where email = ? and password = ?", [body.email, body.password], (err, results1, field) => {
            if (err) {
                res.json({
                    message: err,
                    success: 0

                })
            }

            jwt.sign({ user: results1[0].user_ID }, key, (err, token) => {
                return res.json({
                    success: 1,
                    token
                })
            })
        })
    })
})

router.post("/signupNewStep2", upload.single("profile_image"), (req, res) => {
    let body = req.body
    let path = pathHttp + req.file.path
    jwt.verify(body.token, key, (err, authData) => {
        if (err) { res.json({ success: 0, message: err }) }
        let uid = authData.user

        pool.query("update `pj_user` set `profile_image`=? where user_ID = ?", [path, uid], (err, results, field) => {
            if (err) {
                res.json({
                    message: err,
                    success: 0
                })
            }
            if (results.affectedRows == 1) {
                return res.json({
                    success: 1
                })
            } else {
                return res.json({
                    success: 0
                })
            }
        })
    })
})

router.post("/signupNewStep3", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) { res.json({ success: 0, message: err }) }
        let uid = authData.user
        let body = req.body
        pool.query("select * from pj_user where user_ID = ?", [uid], (err, results, field) => {

            let oldData = results[0]
            if (results == "") {
                return res.json({
                    success: 0,
                    message: "nodata"
                })
            }

            let jsonOldData = JSON.parse(JSON.stringify(oldData))
            let newData = mergeJSON.merge(jsonOldData, body)

            pool.query("update `pj_user` set `name_surname`=?, `alias_name` = ? where user_ID = ?", [newData.name_surname, newData.alias_name, uid], (err, results1, field) => {
                if (err) {
                    res.json({
                        message: err,
                        success: 0
                    })
                }
                else {
                    return res.json({
                        success: 1
                    })
                }
            })
        })

    })
})

router.post("/signin", (req, res) => {
    let body = req.body

    pool.query("SELECT `password` FROM `pj_user` WHERE `email` = ?", [body.email], (err, results, fields) => {
        if (err) {
            return res.json({
                success: 0,
                message: err
            })
        }
        if (results[0] == null) {
            return res.json({
                success: 0,
                message: "อีเมล หรือ รหัสผ่าน ไม่ถูกต้อง"
            })
        }
        let check = passwordHash.verify(body.password, results[0].password)
        if (check == false) {
            return res.json({
                success: 0,
                message: "รหัสผ่านไม่ถูกต้อง"
            })
        }
        pool.query("SELECT  * FROM `pj_user` WHERE `email` = ? and `password` = ?", [body.email, results[0].password], (err, results, field) => {
            if (results[0].access_status != 0) {
                jwt.sign({ user: results[0].user_ID }, key, (err, token) => {
                    return res.json({
                        success: 1,
                        token
                    })
                })
            } else {
                res.json({
                    success: 0,
                    token: "ผู้ใช้ถูก แบน!!"
                })
            }



        })
    })



})

router.get("/myAccount", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (error, authData) => {
        if (error) {
            res.json({
                message: "something this wrong!"

            })
        }
        let id = authData.user

        pool.query("SELECT `user_ID`,`email`,`facebookID`,`name_surname`,`alias_name`,`user_status`,`access_status`,`balance`,`profile_image` FROM `pj_user` WHERE `user_ID` =? ", [id], (error, results, fields) => {
            res.json({
                success: 1,
                data: results
            })
        })

    })



})

//login with facebook

router.post('/loginFacebook', (req, res) => {
    let body = req.body

    pool.query("SELECT COUNT(`user_ID`) as checkID FROM `pj_user` WHERE `facebookID` = ?", [body.userID], (err, results, fields) => {

        if (results[0]['checkID'] == 0) {

            pool.query("INSERT INTO `pj_user` (`user_ID`, `facebookID`, `password`, `name_surname`, `alias_name`, `user_status`,`access_status`,`balance`, `profile_image`) VALUES (NULL, ?, 'facebook', ?, ?, 1, 1,0.00,?)", [body.userID, body.name_surname, body.alias_name, body.profile_image], (error, resultsIn, fields) => {
                if (error) {
                    if (error.errno == 1062) {
                        return res.json({
                            success: 0,
                            message: "facebookID must be unique"
                        })
                    }
                    return res.json({
                        success: 0,
                        message: error
                    })
                }
                pool.query("SELECT * FROM `pj_user` WHERE `facebookID` = ?", [body.userID], (err, results1, fields) => {
                    jwt.sign({ user: results1[0].user_ID }, key, (err, token) => {
                        return res.json({
                            success: 1,
                            token
                        })
                    })
                })

            })
        }

        else {
            pool.query("SELECT * FROM `pj_user` WHERE `facebookID` = ?", [body.userID], (err, results1, fields) => {
                jwt.sign({ user: results1[0].user_ID }, key, (err, token) => {
                    return res.json({
                        success: 1,
                        token
                    })
                })
            })
        }

    })
})

//update profile 
//return path

router.post("/uploadProfile", upload.single("profile_image"), (req, res) => {
    let path = pathHttp + req.file.path
    let body = req.body

    jwt.verify(body.token, key, (error, authData) => {

        if (error) {
            res.json({
                message: "something this wrong!"

            })
        }

        pool.query("UPDATE `pj_user` SET `profile_image`= ?  WHERE `user_ID` = ?", [path, authData.user], (err, results, fields) => {
            if (err) {
                res.json({ success: 0, message: err })
            }

            else {
                pool.query("SELECT `profile_image` FROM `pj_user` WHERE `user_ID` = ?", [authData.user], (err, results, fields) => {
                    res.json({
                        success: 1,
                        profile_image: results[0]
                    })
                })
            }
        })

    })
})

//edit 
router.post("/editProfileName", auth.verifyToken, (req, res) => {
    let body = req.body
    jwt.verify(req.token, key, (error, authData) => {
        if (error) {
            res.json({
                message: error
            })
        }

        let id = authData.user
        pool.query("SELECT * FROM `pj_user` WHERE `user_ID` = ?", [id], (err, results, fields) => {
            let oldData = results[0]
            if (results == "") {
                return res.json({
                    success: 0,
                    message: "nodata"
                })
            }

            let jsonOldData = JSON.parse(JSON.stringify(oldData))
            let newData = mergeJSON.merge(jsonOldData, body)
            pool.query("UPDATE `pj_user` SET `name_surname`= ?,`alias_name`=? WHERE `user_ID` = ?", [newData.name_surname, newData.alias_name, id], (err, results, fields) => {
                if (err) {
                    return res.json({
                        success: 0,
                        message: err
                    })
                }
                if (results.affectedRows == 1) {
                    pool.query("SELECT `name_surname`,`alias_name` FROM `pj_user` WHERE `user_ID` = ?", [id], (err, results, fileds) => {
                        return res.json({
                            success: 1,
                            name_surname: results[0].name_surname,
                            alias_name: results[0].alias_name
                        })
                    })
                } else {
                    return res.json({
                        success: 0
                    })
                }

            })
        })
    })
})

//cancleAccout

router.post("/cancleAccout", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (error, authData) => {
        if (error) {
            res.json({
                message: error
            })
        }
        let id = authData.user
        pool.query("UPDATE `pj_user` SET `access_status`= 0 WHERE `user_ID` = ?", [id], (err, results, fields) => {
            if (err) {
                res.json({
                    message: err
                })
            }
            if (results.affectedRows == 1) {
                return res.json({
                    success: 1,
                    access_status: 0
                })
            }
        })
    })
})

//searchUser
router.get("/searchUser/:data", (req, res) => {

    //jwt.verify(req.token, key, (err, authData) => {

    // if (err) {
    //     return res.json({
    //         message: err
    //     })
    // }

    let data = req.params.data
    console.log(data)
    pool.query("SELECT `user_ID`,`name_surname`,`alias_name`,`profile_image`,`access_status` FROM `pj_user` WHERE `name_surname` LIKE concat(?,'%') OR `alias_name` LIKE concat(?,'%') ORDER BY `name_surname`,`alias_name` ASC", [data, data], (error, results, field) => {
        res.json({
            data: results
        })
    })


    //})*
})

//Ban accout

router.post("/banUser", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) {
            return res.json({
                message: err
            })
        }
        let id = authData.user
        let body = req.body

        pool.query("UPDATE `pj_user` SET `access_status` = 0 WHERE `user_ID` = ?", [body.user_ID], (err, results, fields) => {
            if (err) {
                res.json({
                    message: err
                })
            }
            if (results.affectedRows == 1) {
                pool.query("SELECT `name_surname` FROM `pj_user` WHERE `user_ID` = ?", [body.user_ID], (err, results, fields) => {
                    return res.json({
                        success: 1,
                        message: "Admin ได้ทำการแบน " + results[0].name_surname + " แล้วจ้า"
                    })
                })

            }


        })

    })
})


router.get("/profileUser/:uid", (req, res) => {
    //jwt.verify(req.token, key, (err, authData) => {
    // if (err) {
    //     return res.json({
    //         message: err
    //     })
    // }

    let id = req.params.uid
    pool.query("SELECT pj_user.user_ID,pj_user.name_surname,pj_user.alias_name,pj_user.user_status,pj_user.profile_image FROM `pj_user` WHERE user_ID = ?", [id], (error, results, field) => {
        if (error) {
            res.json({
                message: error
            })
        }
        else {

            pool.query("SELECT `rid`,`recipe_name`, `image`, `date`, `price` FROM `pj_recipe` WHERE `user_ID` = ?", [id], (error, result1, field) => {
                if (error) {
                    res.json({
                        message: error
                    })
                } else {
                    //console.log(result1.length)

                    if (result1.length != 0) {
                        let countLoop = 0
                        let score = []
                        let data = []
                        let recipe = []
                        recipe.push(JSON.stringify(result1))

                        for (var i = 0; i < result1.length; i++) {
                            //console.log(result1[i].rid)

                            pool.query("SELECT AVG(`score`) as score FROM `pj_score` WHERE `recipe_ID` = ?", [result1[i].rid], (error, resultScore, field) => {
                                if (error) {
                                    res.json({
                                        message: err
                                    })
                                }
                                //console.log(resultScore[0].score)
                                countLoop += 1
                                if (resultScore[0].score != null) {
                                    score.push(resultScore[0].score)
                                } else {
                                    score.push(0)
                                }
                                let s = JSON.parse(recipe[0])
                                //console.log("asdasd  " + i)
                                //console.log(s[countLoop-1].rid)
                                //console.log("count "+countLoop+"  res1 "+result1.length)
                                //console.log("Score "+score[countLoop-1])
                                let newdata = {
                                    rid: s[countLoop - 1].rid,
                                    recipe_name: s[countLoop - 1].recipe_name,
                                    image: s[countLoop - 1].image,
                                    date: s[countLoop - 1].date,
                                    price: s[countLoop - 1].price,
                                    score: score[countLoop - 1]
                                }
                                data.push(newdata)
                                if (countLoop == result1.length) {
                                    res.json({
                                        profile: results[0],
                                        recipePost: data
                                    })
                                }
                            })
                        }

                    } else {
                        res.json({
                            profile: results[0],
                            recipePost: []
                        })
                    }

                }


            })
        }

    })

    //})*
})


// router.post("/topup", auth.verifyToken, (req, res) => {
//     jwt.verify(req.token, key, async (err, authData) => {
//         try {
//             if (err) { res.json({ message: err }) }
//             let uid = authData.user
//             let status = await omiseTopup()
//             if (status.status == "successful") {
//                 res.json(status)


//             } else {
//                 res.json({ message: "err" })
//             }
//         } catch (error) {
//             console.log(error)
//         }

//     })
// })

var omise = require('omise')({
    'publicKey': 'pkey_test_5ltiefp7q301c9jjyuo',
    'secretKey': 'skey_test_5ltiefp7zi000pp3fso',
});

const axios = require('axios').default;

async function omiseTopup() {
    /*
    call omise API
    create Source 
    create Charge 
    */
    let status = await {
        status: "successful",
        urlQrcode: "http://apifood.comsciproject.com/uploadPost/qr.PNG"
    } //return omise
    return status
}

async function omiseWithdraw(req) {
    /*
    call omise API
    create Source 
    create Charge 
    */
    let body = req
    let status = await {
        status: "successful",
        bank: body
    } //return omise
    return status
}
//tokn_test_5ow4zm8tloykpgp4w38
//4242424242424242
router.post("/topup", async (req, res) => {
    let tokenUser = req.body.token
    await jwt.verify(tokenUser, key, async (err, authData) => {
        if (err) {
            return res.json({
                message: err
            })
        }

        try {
            let body = req.body
            let user_ID = authData.user
            let moneyC = req.body.amount * 100
            var cardDetails = {
                card: {
                    'name': body.name,

                    'number': body.number,
                    'expiration_month': body.month,
                    'expiration_year': body.year,
                },
            };

            const token = await omise.tokens.create(cardDetails).then(function (token) {
                console.log(token)
                return omise.customers.create({
                    'email': 'john.doe@example.com',
                    'description': 'John Doe (id: 30)',
                    'card': token.id,
                })
            })
                .then(function (customer) {
                    console.log(customer)
                    return omise.charges.create({
                        'amount': moneyC,
                        'currency': 'thb',
                        'customer': customer.id,
                    })
                }).then(function (charge) {
                    console.log(charge.status)
                    if (charge.status == "successful") {


                        axios.post(pathHttp + 'pjUsers/updateMoney', {
                            state: 'topup',
                            money: moneyC / 100
                        }, {
                            headers: {
                                'Authorization': 'Bearer ' + tokenUser
                            }

                        })
                            .then(function (response) {
                                // handle success
                                console.log(response.data.balance);
                                res.json({
                                    success: 1,
                                    balance: response.data.balance
                                })
                            })

                        // res.json({
                        //     success: 1
                        // })
                    } else {
                        res.json({
                            success: 0
                        })
                    }

                }).error(function (err) {
                    console.log(err)
                    //   res.json({
                    //       success: 0
                    //   })
                }).done()
        } catch (error) {
            console.log(error)
        }

    })



})
// curl https://api.omise.co/transfers/trsf_test_5owfia4pppx2la82v4c/mark_as_sent \
//   -X POST \
//   -u skey_test_5ltiefp7zi000pp3fso:


router.post("/withdraw", (req, res) => {
    try {
        let body = req.body
        let tokenUser = req.body.token
        jwt.verify(tokenUser, key, async (err, authData) => {
            if (err) { res.json({ message: err }) }

            let uid = authData.user
            pool.query("SELECT * FROM `pj_transaction` WHERE `user_ID` = ?", [uid], (error, resultT, field) => {
                if (error) { res.json({ message: err }) }
                else {
                    //console.log(resultT.length)
                    let countLoop = 0
                    let moneyTrans = 0
                    if (resultT.length != 0) {
                        resultT.forEach(element => {
                            if (element.state == "topup") {
                                moneyTrans += element.money
                            } else if (element.state == "withdraw") {
                                moneyTrans -= element.money
                            } else if (element.state == "buy_recipe") {
                                moneyTrans -= element.money
                            } else if (element.state == "sell_recipe") {
                                moneyTrans += element.money
                            }

                            countLoop++
                            if (countLoop == resultT.length) {
                                pool.query("SELECT balance FROM `pj_user` WHERE `user_ID` = ?", [uid], async (error, resultBal, field) => {
                                    if (error) { res.json({ message: error }) }
                                    else {
                                        if (resultBal[0].balance == moneyTrans) {
                                            //
                                            //
                                            const recipient = await omise.recipients.create({
                                                'name': body.name,
                                                'email': body.email,
                                                'type': 'individual',
                                                'bank_account': {
                                                    'brand': body.bankBand,
                                                    'number': body.banknumber,
                                                    'name': body.bankname
                                                }
                                            }).then(function (recipient) {

                                                return omise.transfers.create({ 'amount': body.amount * 100, 'recipient': recipient.id }
                                                ).then(function (transfers) {
                                                    console.log(transfers)
                                                    let statusT = "request"
                                                    pool.query("INSERT INTO pj_his_withdraw (w_token,status,amount,user_ID) VALUES(?,?,?,?)", [transfers.id, statusT, body.amount, uid], (error, result, field) => {
                                                        if (result.affectedRows == 1) {
                                                            res.json({
                                                                success: 1,
                                                                message: "คุณได้ทำการส่งคำขอการถอนเงินสำเร็จ โปรดรอระบบทำการตรวจสอบข้อมูลของท่าน"
                                                            })
                                                        } else {
                                                            res.json({
                                                                success: 0,
                                                                message: "มีบางอย่างผิดพลาด"
                                                            })
                                                        }
                                                    })


                                                })
                                            })
                                        } else {
                                            res.json({ message: "failed", balance: resultBal[0].balance, monetTrans: moneyTrans })

                                        }
                                    }
                                })
                            }
                        });
                    } else {
                        res.json({ status: "failed", message: "you don't have transaction!" })
                    }
                }
            })


        })


    } catch (error) {

    }
})


//const pathFile = require("./jsonData/transferData.json")
const fs = require("fs")
router.post("/webhooks", async (req, res) => {
    try {
        const { data, key } = req.body

        //const charge = {};
        if (key === 'transfer.pay' || key === 'transfer.send') {

            if (data.paid == true && data.sent == true) {

                // console.log(data.id)
                // console.log(data.amount/100)
                let status = "successful"
                pool.query("UPDATE `pj_his_withdraw` SET `status` = ? where `w_token` = ?", [status, data.id])
                pool.query("select  user_ID from pj_his_withdraw where w_token = ?", [data.id], (err, result1, field) => {

                    axios.post(pathHttp + 'pjUsers/createTokenUser', {
                        user_ID: result1[0].user_ID
                    }).then(function (response) {
                        console.log(response.data.token);
                        axios.post(pathHttp + 'pjUsers/updateMoney', {
                            state: 'withdraw',
                            money: data.amount / 100
                        }, {
                            headers: {
                                'Authorization': 'Bearer ' + response.data.token
                            }

                        })
                    })

                })



            } else {
                // console.log(data.id)
                // console.log(data.amount/100)
                let status = "pending"
                pool.query("UPDATE `pj_his_withdraw` SET `status` = ? where `w_token` = ?", [status, data.id])

            }
        }

    } catch (error) {

    }
})



router.post("/updateMoney", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) { res.json({ message: err }) }
        let uid = authData.user
        let body = req.body
        pool.query("INSERT INTO `pj_transaction`(`user_ID`, `state`, `money`, `datetime`) VALUES (?,?,?,CURRENT_TIMESTAMP)", [uid, body.state, body.money], (error, result, field) => {
            if (error) { res.json({ message: error }) }
            else {
                if (result.affectedRows == 1) {
                    pool.query("SELECT balance FROM `pj_user` WHERE `user_ID` = ?", [uid], (error, resultfirst, field) => {
                        if (error) { res.json({ message: error }) }
                        else {
                            try {
                                let totalMoney = 0
                                if (body.state == "topup" || body.state == "sell_recipe") {
                                    totalMoney = resultfirst[0].balance + body.money
                                } else if (body.state == "withdraw" || body.state == "buy_recipe") {
                                    totalMoney = resultfirst[0].balance - body.money
                                }

                                pool.query("UPDATE `pj_user` SET balance = ? WHERE `user_ID` = ?", [totalMoney, uid], (error, resultTop, filed) => {
                                    if (error) { res.json({ message: error }) }
                                    else {
                                        pool.query("SELECT balance FROM `pj_user` WHERE `user_ID` = ?", [uid], (error, resultfi, field) => {
                                            if (error) { res.json({ message: error }) }
                                            else {
                                                res.json({
                                                    balance: resultfi[0].balance
                                                })
                                            }
                                        })
                                    }
                                })

                            } catch (error) {
                                res.json({ message: "catch : " + error })
                            }
                        }
                    })

                } else {
                    res.json({
                        message: "something insert error!"
                    })
                }
            }
        })
    })
})

router.get("/my_his_withdraw", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        let uid = authData.user

        pool.query("SELECT `wid`, `w_token`, `status`, `amount`, `user_ID` FROM `pj_his_withdraw` WHERE `user_ID` = ? ORDER BY `wid` DESC", [uid], (err, results, field) => {
            if (results != "" || results != null) {
                res.json(results)
            } else {
                res.json([])
            }
        })
    })
})

router.post("/withdrawOld", auth.verifyToken, (req, res) => {
    jwt.verify(req.token, key, (err, authData) => {
        if (err) { res.json({ message: err }) }

        let uid = authData.user
        let body = req.body
        //check transaction
        pool.query("SELECT * FROM `pj_transaction` WHERE `user_ID` = ?", [uid], (error, resultT, field) => {
            if (error) { res.json({ message: err }) }
            else {
                //console.log(resultT.length)
                let countLoop = 0
                let moneyTrans = 0
                if (resultT.length != 0) {
                    resultT.forEach(element => {
                        if (element.state == "topup") {
                            moneyTrans += element.money
                        } else if (element.state == "withdraw") {
                            moneyTrans -= element.money
                        } else if (element.state == "buy") {
                            moneyTrans -= element.money
                        } else if (element.state == "sell") {
                            moneyTrans += element.money
                        }

                        countLoop++
                        if (countLoop == resultT.length) {
                            pool.query("SELECT balance FROM `pj_user` WHERE `user_ID` = ?", [uid], async (error, resultBal, field) => {
                                if (error) { res.json({ message: error }) }
                                else {
                                    if (resultBal[0].balance == moneyTrans) {
                                        //
                                        let status = await omiseWithdraw(body)
                                        res.json(status)
                                    } else {
                                        res.json({ message: "failed" })
                                    }
                                }
                            })
                        }
                    });
                } else {
                    res.json({ status: "failed", message: "you don't have transaction!" })
                }
            }
        })
    })
})

router.get("/recommendUser", (req, res) => {
    //select pj_user.user_ID,pj_user.name_surname,pj_user.alias_name,pj_user.profile_image ,COUNT(*) as amount FROM pj_follow,pj_user GROUP BY pj_follow.following_ID ORDER BY amount DESC LIMIT 5
    //select pj_follow.following_ID ,COUNT(*) as amount FROM pj_follow GROUP BY pj_follow.following_ID ORDER BY amont DESC LIMIT 5
    pool.query("select pj_follow.following_ID ,COUNT(*) as amount FROM pj_follow GROUP BY pj_follow.following_ID ORDER BY amount DESC LIMIT 5", (error, result, field) => {
        let data = new Array()
        result.forEach(element => {
            data.push(element.following_ID)
        })
        let newData = []
        let countLoop = 0

        //มีสองแบบ แบบแรกจะเหมือนฟิกเอาคนที่มีผู้ติดตามเยอะมาโชว์ แบบสองจะเป็นสุ่ม
        if (data.length == 5) {
            data.forEach(element => {
                pool.query("select pj_user.user_ID,pj_user.name_surname,pj_user.alias_name,pj_user.profile_image from pj_user where pj_user.user_ID = ?", [element], (error, resultData, field) => {
                    newData[countLoop] = {
                        user_ID: resultData[0].user_ID,
                        name_surname: resultData[0].name_surname,
                        alias_name: resultData[0].alias_name,
                        profile_image: resultData[0].profile_image,
                        amountFollower: result[countLoop].amount
                    }
                    countLoop++

                    if (countLoop == data.length) {
                        res.json(newData)
                    }
                })
            })
        } else {
            pool.query("select pj_user.user_ID,pj_user.name_surname,pj_user.alias_name,pj_user.profile_image from pj_user ORDER BY RAND() LIMIT 5", (error, resultData, field) => {
                data = new Array()
                resultData.forEach(element => {
                    data.push(element.user_ID)
                })

                data.forEach(element => {
                    pool.query("select count(follow_ID) as amountFollower from pj_follow where following_ID = ?", [element], (error, resultFol, filed) => {
                        newData[countLoop] = {
                            user_ID: resultData[countLoop].user_ID,
                            name_surname: resultData[countLoop].name_surname,
                            alias_name: resultData[countLoop].alias_name,
                            profile_image: resultData[countLoop].profile_image,
                            amountFollower: resultFol[0].amountFollower
                        }
                        countLoop++

                        if (countLoop == data.length) {
                            newData.sort(function (a, b) {
                                return b.amountFollower - a.amountFollower
                            })
                            res.json(newData)
                        }
                    })
                })
            })
        }
    })
})

router.post("/createTokenUser", (req, res) => {
    let uid = req.body.user_ID

    jwt.sign({ user: uid }, key, (err, token) => {
        return res.json({

            token: token
        })
    })
})

const transporter = nodemailer.createTransport({
    service: 'gmail',
    // secure: false,
    // port: 25,
    auth: {
        user: "troj4n.52@gmail.com",
        pass: "lxew8235qsl"
    },
    tls: {
        rejectUnauthorized: false
    }
})

//https://accounts.google.com/DisplayUnlockCaptcha

router.post("/reset_password", (req, res) => {
    let body = req.body
    var mailOption = {
        from: 'EasyCook 🍔<no-reply@easycook.co.th>',
        to: body.email,
        subject: 'แจ้งเตือนการขอรีเซ็ตรหัสผ่านในแอปพลิชัน Easy Cook 🍔',

        html: '<h1> Reset Password </h1><a href="https://easyfood.comsciproject.com">Click here for reset password</a>'
    }

    transporter.sendMail(mailOption, function (error, info) {
        if (error) {
            res.json({
                success: 0,
                message: error
            })
        } else {
            //console.log('email sent: '+ info.response)
            res.json({
                success: 1,
                message: "sent email successs"
            })
        }
    })
})






module.exports = router