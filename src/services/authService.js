const bcrypt = require("bcryptjs");
const pool = require("../config/postgres");
const logger = require("../config/logger"); // Import logger

const generateDbId = async () => {
  try {
    // Get the latest db_id from the database
    const { rows } = await pool.query(
      "SELECT db_id FROM api_users ORDER BY id DESC LIMIT 1"
    );

    let newDbId = "DB001"; // Default for first user

    if (rows.length > 0) {
      const lastDbId = rows[0].db_id; // e.g., "DB005"
      const lastNumber = parseInt(lastDbId.replace("DB", ""), 10); // Extract number
      newDbId = `DB${String(lastNumber + 1).padStart(3, "0")}`; // Increment db_id
    }

    return newDbId;
  } catch (error) {
    logger.error(
      `❌ Error generating db_id: ${error.message} - ${error.stack}`
    );
    throw new Error("Error generating db_id");
  }
};

// ✅ Register User
exports.registerUser = async (email, username, password) => {
  try {
    // Generate db_id automatically
    const db_id = await generateDbId();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user with email
    const { rows } = await pool.query(
      "INSERT INTO api_users (email, name, password, db_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [email, username, hashedPassword, db_id]
    );

    return rows[0]; // Return user details
  } catch (error) {
    logger.error(
      `❌ User registration failed: ${error.message} - ${error.stack}`
    );
    throw new Error("User registration failed");
  }
};

// ✅ Get User by Email
exports.getUserByEmail = async (email) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM api_users WHERE email = $1",
      [email]
    );
    return rows[0];
  } catch (error) {
    logger.error(`❌ Error fetching user: ${error.message} - ${error.stack}`);
    throw new Error("Error fetching user");
  }
};
