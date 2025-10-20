const User = require("../model/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUserController = async (req, res) => {
  const {
    fullName: { firstName, lastName },
    email,
    password,
  } = req.body;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName: {
      firstName,
      lastName,
    },
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.cookie("token", token)
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
    });
};

const loginUserController = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.cookie("token", token);

  res.status(200).json({
    message: "Login successful",
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
    },
  });
};

module.exports = {
  registerUserController,
  loginUserController,
};
