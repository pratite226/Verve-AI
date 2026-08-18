const bcrypt = require("bcrypt");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { isValidEmail } = require("../utils/validators");

const PASSWORD_RULE = /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
const PASSWORD_RULE_MESSAGE =
  "Password must be at least 8 characters and include a number and a special character";

// @route POST /signup
const signup = async (req, res) => {
  try {
    const { name, email, password, industry, careerStage, goals } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (!PASSWORD_RULE.test(password)) {
      return res.status(400).json({
        success: false,
        message: PASSWORD_RULE_MESSAGE,
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      name,
      email,
      password: hashedPassword,
      industry,
      careerStage,
      goals,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email) || typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "A valid email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        industry: user.industry,
        careerStage: user.careerStage,
        goals: user.goals,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /me
const getMe = async (req, res) => {
  // req.user is already attached by the protect middleware — no DB call needed
  return res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      industry: req.user.industry,
      careerStage: req.user.careerStage,
      goals: req.user.goals,
    },
  });
};

module.exports = { signup, login, getMe };