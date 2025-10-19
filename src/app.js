const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

//Routes
const chatRoute = require('./route/chat.route');
const authRoute = require('./route/auth.route');

//Using Middlewares
app.use(express.json());
app.use(cookieParser());

//Using Routes
app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoute);


module.exports = app;