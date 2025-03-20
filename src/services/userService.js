const postgresClient = require("../config/postgres");
const logger = require("../config/logger");

async function addUser(db_id, username, password, providedDbId) {
  if (providedDbId && providedDbId !== db_id) {
    logger.warn(
      `⚠️ Unauthorized attempt to add a user to db_id ${providedDbId}`
    );
    throw new Error("You are not authorized to add users to this database.");
  }

  try {
    const result = await postgresClient.query(
      `INSERT INTO users (db_id, username, password, license_status) 
       VALUES ($1, $2, $3, 'pending') 
       ON CONFLICT (username, db_id) DO NOTHING RETURNING *`,
      [db_id, username, password]
    );

    if (result.rowCount === 0) {
      logger.warn(`⚠️ User ${username} already exists in db_id ${db_id}.`);
      return { message: "User already exists" };
    }

    logger.info(
      `✅ User ${username} added to db_id ${db_id} with pending license`
    );
    return result.rows[0];
  } catch (error) {
    logger.error(`❌ Error adding user: ${error.message}`);
    throw error;
  }
}

async function addBulkUsers(db_id, users) {
  const insertedUsers = [];
  const existingUsers = [];

  for (const user of users) {
    const { username, password } = user;
    try {
      const result = await addUser(db_id, username, password);
      if (result.message === "User already exists") {
        existingUsers.push(username);
      } else {
        insertedUsers.push(result);
      }
    } catch (error) {
      logger.error(`❌ Error adding user ${username}: ${error.message}`);
    }
  }

  return { insertedUsers, existingUsers };
}

async function getUsersByDbId(db_id) {
  try {
    const result = await postgresClient.query(
      "SELECT id, username, license_status, password FROM users WHERE db_id = $1",
      [db_id]
    );
    return result.rows;
  } catch (error) {
    logger.error(`❌ Error fetching users: ${error.message}`);
    throw error;
  }
}

module.exports = { addUser, addBulkUsers, getUsersByDbId };
