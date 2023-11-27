const companyModel = require('../models/companyModel')

let authguard = async(req,res,next) =>{
        let user = await companyModel.findById(req.session.userId)
        if(user){
            req.session.owner = true
            res.locals.user = user;
            req.session.user = user
            next()
        }else{
            req.session.owner = false
            console.log("vous n'etes pas connecté");
            res.redirect('/login')
        }
}

module.exports = authguard