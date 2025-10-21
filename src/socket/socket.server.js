const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const User = require("../model/user.model");
const { generateResponse } = require("../service/ai.service");
const Message = require("../model/message.model");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  // Middleware to parse cookies from the handshake headers
  // For Authentication process of the socket connection
  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

    if (!cookies.token) {
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
  });

  io.on("connection", (socket) => {
    //The message send by the AI will be received here
    socket.on("ai-message", async (data) => {

      await Message.create({
        user: socket.user._id,
        chat: data.chat,
        content: data.content,
        role: "user",
      })

      const chatHistory = await Message.find({
        chat: data.chat,
      })

      //Short Term memory implementation
      const response = await generateResponse(chatHistory.map((item)=>{
        return {
          role: item.role,
          parts: [{
            text: item.content,
          }]
        }
      }));

      await Message.create({
        user: socket.user._id,
        chat: data.chat,
        content: response,
        role: "model",
      })

      socket.emit("ai-response", {
        content: response,
        chat: data.chat,
      });
    });
  });
}

module.exports = initSocketServer;
