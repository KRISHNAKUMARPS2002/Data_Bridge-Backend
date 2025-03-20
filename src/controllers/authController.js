const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const authService = require("../services/authService");
const tokenService = require("../services/tokenService");
const logger = require("../config/logger"); // ✅ Import logger

exports.register = async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const user = await authService.registerUser(email, username, password);
    res.json({ message: "User registered", db_id: user.db_id, user });
  } catch (error) {
    logger.error(`Registration failed: ${error.message}`); // ✅ Log error
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await authService.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn(`Login failed: Invalid credentials for email ${email}`); // ✅ Log failed login attempts
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = await tokenService.generateAccessToken({
      id: user.id,
      db_id: user.db_id,
      email: user.email,
    });

    const refreshToken = await tokenService.generateRefreshToken({
      id: user.id,
      db_id: user.db_id,
      email: user.email,
    });

    // ✅ Print tokens in console for debugging
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);

    res.json({
      accessToken,
      refreshToken,
      db_id: user.db_id,
      email: user.email,
    });
  } catch (error) {
    logger.error(`Login failed: ${error.message}`); // ✅ Log error
    res.status(500).json({ error: "Login failed" });
  }
};

exports.logout = async (req, res) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    logger.warn("Logout failed: No token provided"); // ✅ Log missing token
    return res.status(400).json({ error: "No token provided" });
  }

  try {
    await tokenService.logoutUser(token);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error(`Logout failed: ${error.message}`); // ✅ Log error
    res.status(500).json({ error: "Logout failed" });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    logger.warn("Refresh token request failed: No token provided");
    return res.status(403).json({ error: "No refresh token provided" });
  }

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, user) => {
    if (err) {
      logger.error("Invalid refresh token");
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    // ✅ Await the new access token
    const newAccessToken = await tokenService.generateAccessToken({
      id: user.id,
      db_id: user.db_id,
      email: user.email,
    });

    // ✅ Log the actual token instead of [object Promise]
    logger.info(`🔄 New Access Token Generated: ${newAccessToken}`);

    res.json({ accessToken: newAccessToken });
  });
};
