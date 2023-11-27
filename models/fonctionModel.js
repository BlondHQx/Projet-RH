const mongoose = require('mongoose');

const fonctionSchema = new mongoose.Schema({
    fonction:{
        type: String,
        validate: {
            validator: function(v){
                return /^[A-Za-zÀ-ÖØ-öø-ÿ '-]{2,}$/.test(v);
            }
        }
    }
})

const fonctionModel = mongoose.model("fonctions", fonctionSchema);
module.exports= fonctionModel