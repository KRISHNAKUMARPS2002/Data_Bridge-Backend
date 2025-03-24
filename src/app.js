require("dotenv").config();
const express = require("express");
const cors = require("cors");
const logger = require("./config/logger");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

// ✅ Dynamic CORS setup
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://sysmac.co.in",
  "https://data-bridge-frontend.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// ✅ Use CORS Middleware
app.use(cors(corsOptions));
app.use(express.json());

// ✅ Explicitly Handle Preflight Requests for CORS
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://data-bridge-frontend.vercel.app"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).end(); // ✅ Respond to OPTIONS preflight request immediately
  }

  next();
});

// ✅ Log all requests
app.use((req, res, next) => {
  logger.info(`📥 ${req.method} ${req.url}`);
  next();
});

// ✅ Attach Routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", customerRoutes);

// ✅ Global Error Handling
app.use((err, req, res, next) => {
  logger.error(`❌ API Error: ${err.message}`);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
