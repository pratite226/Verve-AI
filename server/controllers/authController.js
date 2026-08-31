const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { isValidEmail, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } = require("../utils/validators");
const { sendPasswordResetEmail } = require("../services/mailerService");

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

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

// @route POST /forgot-password
// Body: { email }
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Same response whether or not the account exists — a different response for "no
    // account" would let this endpoint be used to check which emails are registered.
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      user.resetPasswordExpires = Date.now() + RESET_TOKEN_TTL_MS;
      await user.save();

      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const resetLink = `${clientUrl}/reset-password/${rawToken}`;
      await sendPasswordResetEmail(user.email, resetLink);
    }

    return res.status(200).json({
      success: true,
      message: "If an account exists for that email, we've sent a password reset link.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /reset-password
// Body: { token, password }
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, message: "Reset token is required" });
    }

    if (!PASSWORD_RULE.test(password)) {
      return res.status(400).json({ success: false, message: PASSWORD_RULE_MESSAGE });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordTokenHash +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "That reset link is invalid or has expired. Please request a new one.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated — you can now log in.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { signup, login, getMe, forgotPassword, resetPassword };