const mongoose = require('mongoose');



const companyShema = new mongoose.Schema({
    name: {
        type: String,
        required:[true, "nom requis"],
        validate: {
            validator: function(v){
                return /^[A-Za-zÀ-ÖØ-öø-ÿ '0-9-]{2,}$/.test(v);
            },
            message: "Veuillez entrer un nom valide"
        }
    },
    siret: {
        type: Number,
        required:[true, "siret requis"],
        validate: {
            validator: function(v){
                return /^\d{14}$/.test(v);
            },
            message: "Veuillez entrer un siret valide"
        }
    },
    ceoName: {
        type: String,
        validate: {
            validator: function(v){
                return /^[A-Za-zÀ-ÖØ-öø-ÿ '-]{2,}$/.test(v);
            },
            message: "Veuillez entrer un nom valide"
        }
    },
    mail :{
        type : String,
        required:[true, "email requis"],
        validate: {
            validator: function(v){
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: "Veuillez entrer une adresse mail valide"
        }
    },
    password : {
        type : String,
        required:[true, "password requis"],
        validate: {
            validator: function(v){
                return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(v);
            },
            message: "Veuillez entrer un mot de passe valide"
        }
    },
    //employees: [ employeeModel.schema],
    employees:  [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'employees' 
        },
    ],
    fonctions: [
        {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'fonctions' 
        }
    ]
})

const companyModel = mongoose.model("companys", companyShema);
module.exports= companyModel