const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Import routes
const authRoutes = require("./routes/auth");
const inventoryRoutes = require("./routes/inventory");
const billingRoutes = require("./routes/billing");
const alertsRoutes = require("./routes/alerts");
require('dotenv').config()

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS - allow frontend origins
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all for now — tighten later if needed
    },
    credentials: true,
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/alerts", alertsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server is running at http://localhost:${PORT}`);
});
