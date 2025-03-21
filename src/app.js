require("dotenv").config();
const express = require("express");
const cors = require("cors");
const logger = require("./config/logger");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "https://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  logger.info(`📥 ${req.method} ${req.url}`);
  next();
});

// Attach Routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", customerRoutes);

app.use((err, req, res, next) => {
  logger.error(`❌ API Error: ${err.message}`);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
