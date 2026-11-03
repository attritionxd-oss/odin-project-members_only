/* eslint-disable no-console */
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const SCHEMA_TABLES = {
  table_name: /* sql */ `
    CREATE TABLE IF NOT EXISTS table_name (
      id SERIAL PRIMARY KEY,
      name_field VARCHAR(255) NOT NULL,
    );
  `,
};

export async function seedSchema() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    for (const tableName in SCHEMA_TABLES) {
      const sqlQuery = SCHEMA_TABLES[tableName];
      await client.query(sqlQuery);
      console.log(`Verified table: ${tableName}`);
    }

    await client.query("COMMIT;");
    console.log("Schema creation complete.");
  } catch (error) {
    console.error("Failed to seed database schema:", error);
    throw error;
  } finally {
    client.release();
  }
}

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  seedSchema()
    .then(() => pool.end())
    // eslint-disable-next-line no-process-exit
    .catch(() => process.exit(1));
}

export default SCHEMA_TABLES;
