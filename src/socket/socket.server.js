require("dotenv").config();

const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const User = require("../model/user.model");
const { generateResponse, generateVector } = require("../service/ai.service");
const Message = require("../model/message.model");
const { createMemory, queryMemory } = require("../service/vector.service");
const {
  chat,
} = require("@pinecone-database/pinecone/dist/assistant/data/chat");
const { text } = require("express");

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

  io.on("connection", async (socket) => {
    //The message send by the AI will be received here
    socket.on("ai-message", async (data) => {

      //store user message , generate vector and Store the user message vector in Pinecone concurrently
      const [message, vectors] = await Promise.all([
        Message.create({
          user: socket.user._id,
          chat: data.chat,
          content: data.content,
          role: "user",
        }),
        generateVector(data.content),
      ]);


      await createMemory({
        vectors,
        messageId: message._id,
        metadata: {
          chat: data.chat,
          user: socket.user._id,
          text: data.content,
        },
      });


      const [memory , chatHistory] = await Promise.all([
        queryMemory({
           queryVectors: vectors,
             limit: 3,
             metadata: {
               user: socket.user._id,
             },
           }),

           Message.find({
            chat: data.chat,
            }).sort({ createdAt: -1 }).limit(20).lean().then(messages => messages.reverse())
      ])


      const stm = chatHistory.map((item) => {
        return {
          role: item.role,
          parts: [
            {
              text: item.content,
            },
          ],
        };
      });

      const ltm = [
        {
          role: "user",
          parts: [
            {
              text: `This is the relevant context from previous conversations:\n\n${memory
                .map((item) => item.metadata.text)
                .join("\n")}`,
            },
          ],
        },
      ];

      const response = await generateResponse([...ltm, ...stm]);

      // Send AI response back to the client
      socket.emit("ai-response", {
        content: response,
        chat: data.chat,
      });

      const [responseMessage , responseVector] = await Promise.all([
        Message.create({
          user: socket.user._id,
          chat: data.chat,
          content: response,
          role: "model",
        }),
        generateVector(response),
      ]);

      // Store the AI response vector in Pinecone
      await createMemory({
        vectors: responseVector,
        messageId: responseMessage._id,
        metadata: {
          chat: data.chat,
          user: socket.user._id,
          text: response,
        },
      });


    });
  });
}

module.exports = initSocketServer;
