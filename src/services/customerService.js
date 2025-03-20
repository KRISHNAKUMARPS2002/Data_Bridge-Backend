const postgresClient = require("../config/postgres");
const logger = require("../config/logger");

async function addCustomer(db_id, name, address, place, phone, providedDbId) {
  if (providedDbId && providedDbId !== db_id) {
    logger.warn(
      `⚠️ Unauthorized attempt to add a customer to db_id ${providedDbId}`
    );
    throw new Error(
      "You are not authorized to add customers to this database."
    );
  }

  try {
    const result = await postgresClient.query(
      `INSERT INTO customers (db_id, name, address, place, phone) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (db_id, name) DO NOTHING 
       RETURNING *`,
      [db_id, name, address, place, phone]
    );

    if (result.rowCount === 0) {
      logger.warn(`⚠️ Customer ${name} already exists in db_id ${db_id}.`);
      return { message: "Customer already exists" };
    }

    logger.info(`✅ Customer ${name} added to db_id ${db_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error(`❌ Error adding customer: ${error.message}`);
    throw error;
  }
}

async function addBulkCustomers(db_id, customers, providedDbId) {
  if (providedDbId && providedDbId !== db_id) {
    logger.warn(
      `⚠️ Unauthorized attempt to add customers to db_id ${providedDbId}`
    );
    throw new Error(
      "You are not authorized to add customers to this database."
    );
  }

  try {
    const values = customers
      .map(
        (customer, index) =>
          `($1, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}, $${
            index * 4 + 5
          })`
      )
      .join(", ");

    const params = [db_id].concat(
      customers.flatMap(({ name, address, place, phone }) => [
        name,
        address,
        place,
        phone,
      ])
    );

    const query = `
      INSERT INTO customers (db_id, name, address, place, phone) 
      VALUES ${values} 
      ON CONFLICT (db_id, name) DO NOTHING 
      RETURNING *;
    `;

    const result = await postgresClient.query(query, params);

    if (result.rowCount === 0) {
      logger.warn(`⚠️ Some or all customers already exist in db_id ${db_id}.`);
      return { message: "Some or all customers already exist" };
    }

    logger.info(`✅ ${result.rowCount} customers added to db_id ${db_id}`);
    return { insertedCustomers: result.rows };
  } catch (error) {
    logger.error(`❌ Error adding bulk customers: ${error.message}`);
    throw error;
  }
}

async function getCustomersByDbId(db_id) {
  try {
    const result = await postgresClient.query(
      "SELECT id, name, address, place, phone FROM customers WHERE db_id = $1",
      [db_id]
    );
    return result.rows;
  } catch (error) {
    logger.error(`❌ Error fetching customers: ${error.message}`);
    throw error;
  }
}

module.exports = { addCustomer, addBulkCustomers, getCustomersByDbId };
