require("dotenv").config();
const express = require("express");
const cors = require("cors");
const logger = require("./config/logger");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

// ✅ Force HTTPS when behind Nginx
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

// In your Express app.js file
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://sysmac.co.in",
    "https://data-bridge-frontend.vercel.app/",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Explicitly handle preflight OPTIONS requests
app.options("*", cors(corsOptions));

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
