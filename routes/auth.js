const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/Product");
const { requireAuth } = require("../middleware/auth");

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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Check for expiry alerts
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const expiredProducts = await Product.find({ userId: user._id, expire: { $lt: today } });
    const expiringSoon = await Product.find({ userId: user._id, expire: { $gte: today, $lt: nextWeek } });

    const hasAlerts = expiredProducts.length > 0 || expiringSoon.length > 0;

    res.json({
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email },
      hasAlerts,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Logout (client-side only now — just an acknowledgement endpoint)
router.get("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Verify token (replaces check-login-status)
router.get("/verify", requireAuth, (req, res) => {
  res.json({ loggedIn: true });
});

// Get user profile
router.get("/user/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
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
