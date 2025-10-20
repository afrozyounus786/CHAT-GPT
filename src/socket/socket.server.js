const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const User  = require("../model/user.model");

function initSocketServer(httpServer) {
  const io = new Server(httpServer,{});

  // Middleware to parse cookies from the handshake headers
  // For Authentication process of the socket connection
  io.use(async (socket, next)=>{
    const cookies = cookie.parse(socket.handshake.headers?.cookie || ""); 

    if(!cookies.token){
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id);
      socket.user = user;

      next();

    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  })

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.user);
    console.log("New client connected:", socket.id);
  });
}

module.exports = initSocketServer