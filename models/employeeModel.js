const mongoose = require('mongoose');


const employeeShema = new mongoose.Schema({
   name:{
    type:String
   },
    photo: {
        type: String,
    },
    fonction: {
        type: String,
        validate: {
            validator: function(v){
                return /^[A-Za-zÀ-ÖØ-öø-ÿ '-]{2,}$/.test(v);
            }
        }
    },
    blames: {
        type: Number,
        validate: {
            validator: function(v){
                return /^\d+$/.test(v);
            }
        },
        default: 0,
    },
    index: {
        type: Number,
    }
})

const employeeModel = mongoose.model("employees", employeeShema);
module.exports= employeeModel