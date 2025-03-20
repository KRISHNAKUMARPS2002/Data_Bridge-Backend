const jwt = require("jsonwebtoken");
const pool = require("../config/postgres");

// Generate Access Token
exports.generateAccessToken = async (user) => {
  const payload = { id: user.id, db_id: user.db_id, email: user.email };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });

  // Store or Update token in the sessions table
  await pool.query(
    `INSERT INTO sessions (user_id, db_id, token, token_type, expires_at) 
     VALUES ($1, $2, $3, 'access', NOW() + INTERVAL '15 minutes') 
     ON CONFLICT (user_id, token_type) 
     DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`,
    [user.id, user.db_id, token]
  );

  return token;
};

// Generate Refresh Token
exports.generateRefreshToken = async (user) => {
  const payload = { id: user.id, db_id: user.db_id, email: user.email };
  const token = jwt.sign(payload, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });

  // Store or Update refresh token in the sessions table
  await pool.query(
    `INSERT INTO sessions (user_id, db_id, token, token_type, expires_at) 
     VALUES ($1, $2, $3, 'refresh', NOW() + INTERVAL '7 days') 
     ON CONFLICT (user_id, token_type) 
     DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`,
    [user.id, user.db_id, token]
  );

  return token;
};

// Logout User from One Device
exports.logoutUser = async (token) => {
  try {
    // 🛠 Decode the token to get user_id
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.id; // Extract user ID

    console.log("Decoded User ID:", user_id);
    console.log("Token to be deleted:", token);

    // 🛠 Delete the session entry with matching user_id and token
    await pool.query("DELETE FROM sessions WHERE user_id = $1 AND token = $2", [
      user_id,
      token,
    ]);

    console.log("Logout successful");
  } catch (error) {
    console.error("Logout Error:", error.message); // Log error
    throw error;
  }
};

// Logout User from All Devices
exports.logoutUserFromAllDevices = async (user_id) => {
  await pool.query("DELETE FROM sessions WHERE user_id = $1", [user_id]);
};
