
module.exports ={
    verifyToken : function (req,res,next){
        //get auth header value
    
        const bearerHeader = req.headers['authorization']
        //check if bearer is undifined
        if(typeof bearerHeader !== 'undefined'){
            //split at the space
            const bearer = bearerHeader.split(' ')
            //get token from array
            const bearerToken = bearer[1]
            //set the token
    
           
            req.token = bearerToken 
            next()
        }else {
            //forbidden
            res.sendStatus(403)
        }
    }
}