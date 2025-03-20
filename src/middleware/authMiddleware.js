const jwt = require("jsonwebtoken");
const pool = require("../config/postgres"); // PostgreSQL DB connection

const authenticateToken = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    console.log("🚨 No Authorization header");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  if (!token) {
    console.log("🚨 Token missing in Authorization header");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    console.log("🛠 Received Token:", token);

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Decoded Token:", decoded);

    // Check if token exists in sessions table
    const sessionResult = await pool.query(
      "SELECT user_id, db_id FROM sessions WHERE token = $1",
      [token]
    );

    if (sessionResult.rows.length === 0) {
      console.log("🚨 Token not found in sessions table");
      return res.status(403).json({ error: "Token invalid or expired" });
    }

    const sessionData = sessionResult.rows[0];
    console.log("📌 Session Data from DB:", sessionData);

    // Attach user details, including db_id
    req.user = {
      id: sessionData.user_id,
      db_id: sessionData.db_id,
    };

    console.log("✅ req.user set:", req.user);
    next();
  } catch (err) {
    console.error("❌ Authentication error:", err);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = { authenticateToken };
