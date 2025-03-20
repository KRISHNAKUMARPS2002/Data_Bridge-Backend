const express = require("express");
const {
  addUser,
  addBulkUsers,
  getUsersByDbId,
} = require("../services/userService");
const { authenticateToken } = require("../middleware/authMiddleware");
const logger = require("../config/logger");

const router = express.Router();

// ➕ Add Single User (POST /api/users/single)
router.post("/users/single", authenticateToken, async (req, res) => {
  if (!req.user) {
    logger.warn("⚠️ Unauthorized request: req.user is missing.");
    return res.status(401).json({ error: "Unauthorized: No user data" });
  }

  const { username, password } = req.body;
  const { db_id } = req.user;

  if (!username || !password) {
    logger.warn("⚠️ Missing required user details.");
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const result = await addUser(db_id, username, password);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`❌ Failed to add user: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ➕ Add Bulk Users (POST /api/users/bulk)
router.post("/users/bulk", authenticateToken, async (req, res) => {
  if (!req.user) {
    logger.warn("⚠️ Unauthorized request: req.user is missing.");
    return res.status(401).json({ error: "Unauthorized: No user data" });
  }

  const { users } = req.body;
  const { db_id } = req.user;

  if (!Array.isArray(users) || users.length === 0) {
    logger.warn("⚠️ Invalid or empty user list.");
    return res.status(400).json({ error: "Users array is required" });
  }

  try {
    const result = await addBulkUsers(db_id, users);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`❌ Failed to add bulk users: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🔍 Get Users by db_id (GET /api/users/list)
router.get("/users/list", authenticateToken, async (req, res) => {
  if (!req.user) {
    logger.warn("⚠️ Unauthorized request: req.user is missing.");
    return res.status(401).json({ error: "Unauthorized: No user data" });
  }

  const { db_id } = req.user;

  try {
    const users = await getUsersByDbId(db_id);
    res.status(200).json(users);
  } catch (error) {
    logger.error(`❌ Failed to fetch users: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
