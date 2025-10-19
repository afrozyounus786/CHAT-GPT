const Chat = require('../model/chat.model');

const createChat = async (req, res) => {
    
    const { title } = req.body;
    const userId = req.user;

    const chat = await Chat.create({
        user: userId,
        title,
    })

    res.status(201).json({
        message: "Chat created successfully",
        chat: {
            _id: chat._id,
            title: chat.title,
            user: chat.user,
            lastActivity: chat.lastActivity,
        }
    })
}


module.exports = {
    createChat,
}