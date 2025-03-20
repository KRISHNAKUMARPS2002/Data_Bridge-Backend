const express = require("express");
const {
  addCustomer,
  addBulkCustomers,
  getCustomersByDbId,
} = require("../services/customerService");
const { authenticateToken } = require("../middleware/authMiddleware");
const logger = require("../config/logger");

const router = express.Router();

// ➕ Add Single Customer (POST /api/customers/single)
router.post("/customers/single", authenticateToken, async (req, res) => {
  if (!req.user) {
    logger.warn("⚠️ Unauthorized request: req.user is missing.");
    return res.status(401).json({ error: "Unauthorized: No user data" });
  }

  const { name, address, place, phone } = req.body;
  const { db_id } = req.user;

  if (!name || !address || !place || !phone) {
    logger.warn("⚠️ Missing required customer details.");
    return res
      .status(400)
      .json({ error: "All fields (name, address, place, phone) are required" });
  }

  try {
    const result = await addCustomer(db_id, name, address, place, phone);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`❌ Failed to add customer: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ➕ Add Bulk Customers (POST /api/customers/bulk)
router.post("/customers/bulk", authenticateToken, async (req, res) => {
  if (!req.user) {
    logger.warn("⚠️ Unauthorized request: req.user is missing.");
    return res.status(401).json({ error: "Unauthorized: No user data" });
  }

  const { customers } = req.body;
  const { db_id } = req.user;

  if (!Array.isArray(customers) || customers.length === 0) {
    logger.warn("⚠️ Invalid or empty customer list.");
    return res
      .status(400)
      .json({ error: "A non-empty array of customers is required" });
  }

  try {
    const result = await addBulkCustomers(db_id, customers);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`❌ Failed to add bulk customers: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🔍 Get Customers by db_id (GET /api/customers/list)
router.get("/customers/list", authenticateToken, async (req, res) => {
  if (!req.user) {
    logger.warn("⚠️ Unauthorized request: req.user is missing.");
    return res.status(401).json({ error: "Unauthorized: No user data" });
  }

  const { db_id } = req.user;

  try {
    const customers = await getCustomersByDbId(db_id);
    res.status(200).json(customers);
  } catch (error) {
    logger.error(`❌ Failed to fetch customers: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
