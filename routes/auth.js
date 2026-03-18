const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Product = require("../models/Product");

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { fname, email, password, cpassword } = req.body;

    if (password !== cpassword) {
      return res.status(400).json({ error: "Password and Confirm Password should match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name: fname, email, password: hashedPassword });

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error during signup" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.userId = user._id;

    // Check for expiry alerts
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const expiredProducts = await Product.find({ userId: user._id, expire: { $lt: today } });
    const expiringSoon = await Product.find({ userId: user._id, expire: { $gte: today, $lt: nextWeek } });

    const hasAlerts = expiredProducts.length > 0 || expiringSoon.length > 0;

    res.json({ message: "Login successful", hasAlerts });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logged out successfully" });
  });
});

// Check login status
router.get("/check-login-status", (req, res) => {
  res.json({ loggedIn: !!req.session.userId });
});

// Get user profile
router.get("/user/profile", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not logged in" });
    }
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ email: user.email, name: user.name });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
