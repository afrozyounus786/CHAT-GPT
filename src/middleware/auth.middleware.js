const User = require('../model/user.model');
const jwt = require('jsonwebtoken');


const authUser = async (req, res, next) => {

    const token = req.cookies;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        
        const decoded = jwt.verify(token.token , process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        req.user = user;
        next();

    } catch (error) {
        res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
}

module.exports = {
    authUser,
}