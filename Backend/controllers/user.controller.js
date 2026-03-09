const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const { validationResult } = require("express-validator");
const BlacklistToken = require("../models/blacklistToken.model");
const axios = require("axios");

// =========================
// REGISTER USER
// =========================
module.exports.registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullname, email, password } = req.body;

  const isUserAlready = await userModel.findOne({ email });
  if (isUserAlready) {
    return res.status(400).json({ message: "User already exist" });
  }

  const hashedPassword = await userModel.hashPassword(password);

  // 🔥 اصلاح اصلی اینجاست
  const user = await userService.createUser({
    fullname: {
      firstname: fullname.firstname,
      lastname: fullname.lastname,
    },
    email,
    password: hashedPassword,
  });

  const token = user.generateAuthToken();

  res.status(201).json({ token, user });
};

// =========================
// LOGIN USER
// =========================
module.exports.loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = user.generateAuthToken();
  res.cookie("token", token);

  res.status(200).json({ token, user });
};

// =========================
// GET USER PROFILE
// =========================
module.exports.getUserProfile = async (req, res, next) => {
  res.status(200).json(req.user);
};

// =========================
// UPDATE USER PROFILE
// =========================
module.exports.updateUserProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array().map(e => e.msg).join(' '), errors: errors.array() });
  }
  const { fullname, email } = req.body;
  const userId = req.user._id;

  try {
    if (email && email !== req.user.email) {
      const existing = await userModel.findOne({ email });
      if (existing) return res.status(400).json({ message: "Email already in use" });
    }
    const update = {};
    if (fullname) {
      if (fullname.firstname) update["fullname.firstname"] = fullname.firstname;
      if (fullname.lastname !== undefined) update["fullname.lastname"] = fullname.lastname;
    }
    if (email) update.email = email;
    const user = await userModel.findByIdAndUpdate(userId, { $set: update }, { new: true });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// CHANGE PASSWORD
// =========================
module.exports.changePassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array().map(e => e.msg).join(' '), errors: errors.array() });
  }
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  try {
    const user = await userModel.findById(userId).select("+password");
    if (!user || !user.password) return res.status(400).json({ message: "Cannot change password for this account" });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: "Current password is wrong" });
    const hashed = await userModel.hashPassword(newPassword);
    await userModel.findByIdAndUpdate(userId, { $set: { password: hashed } });
    res.status(200).json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =========================
// DELETE ACCOUNT
// =========================
module.exports.deleteUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Password required to delete account" });
  }
  const { password } = req.body;
  const userId = req.user._id;

  try {
    const user = await userModel.findById(userId).select("+password");
    if (!user || !user.password) return res.status(400).json({ message: "Cannot delete this account" });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Wrong password" });
    await userModel.findByIdAndDelete(userId);
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (token) await BlacklistToken.create({ token });
    res.clearCookie("token");
    res.status(200).json({ message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
