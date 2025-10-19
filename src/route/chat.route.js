const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const chatController = require("../controller/chat.controller");

//post /api/chat/
router.post("/", authMiddleware.authUser , chatController.createChat);

module.exports = router;
