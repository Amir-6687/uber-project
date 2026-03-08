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

  const user = await userService.createUser({
    firstname: fullname.firstname,
    lastname: fullname.lastname,
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

// =========================
// GOOGLE OAUTH - redirect to Google
// =========================
module.exports.googleAuth = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";
  if (!clientId) {
    return res.redirect(`${frontendUrl}/login?error=Google+sign-in+not+configured`);
  }
  const redirectUri = `${process.env.BACKEND_URL || "http://localhost:3000"}/users/auth/google/callback`;
  const scope = "openid email profile";
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  res.redirect(url);
};

// =========================
// GOOGLE OAUTH CALLBACK
// =========================
module.exports.googleAuthCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  const { code } = req.query;
  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=No+code`);
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.redirect(`${frontendUrl}/login?error=Google+not+configured`);
  }
  const redirectUri = `${backendUrl}/users/auth/google/callback`;
  try {
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    const accessToken = tokenRes.data.access_token;
    const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { email, given_name, family_name } = userRes.data;
    let user = await userModel.findOne({ email });
    if (!user) {
      const hashed = await userModel.hashPassword(require("crypto").randomBytes(16).toString("hex"));
      user = await userModel.create({
        fullname: { firstname: given_name || "User", lastname: family_name || "" },
        email,
        password: hashed,
      });
    }
    const token = user.generateAuthToken();
    res.redirect(`${frontendUrl}/login?token=${token}&email=${encodeURIComponent(user.email)}`);
  } catch (err) {
    console.error(err);
    res.redirect(`${frontendUrl}/login?error=Google+sign-in+failed`);
  }
};

// =========================
// APPLE OAUTH - placeholder (needs Apple Developer setup)
// =========================
module.exports.appleAuth = (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";
  res.redirect(`${frontendUrl}/login?error=Apple+sign-in+coming+soon`);
};

// =========================
// LOGOUT USER
// =========================
module.exports.logoutUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (token) {
    await BlacklistToken.create({ token });
  }

  res.clearCookie("token");
  res.status(200).json({ message: "Logged out" });
};
