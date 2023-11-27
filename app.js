const express = require('express');
const mongoose = require("mongoose");
const session = require('express-session')
require('dotenv').config()
const userRouter = require('./routes/userRouter')
const dashboardRouter = require('./routes/dashboardRouter')

const app = express()

app.use(express.json())
app.use(express.static("./views/assets"))
app.use(session({
    secret: process.env.SECRET_SESSION,
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({ extended: true }))
app.use(userRouter);;
app.use(dashboardRouter)


app.listen(process.env.PORT, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`\x1b[1m[APP] connected at localhost PORT : ${process.env.PORT}\x1b[0m`);
    }
});

//connexion a la base de donnée
try {
    mongoose.connect(process.env.DB_URI);
    console.log('\x1b[35m[APP] Connected to DB');
} catch (error) {
    console.log(error);
}
