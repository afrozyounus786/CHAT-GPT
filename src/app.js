const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

//Routes
const chatRoute = require('./route/chat.route');
const authRoute = require('./route/auth.route');

//Using Middlewares
app.use(cors({
    origin:'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

//Using Routes
app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoute);


module.exports = app;