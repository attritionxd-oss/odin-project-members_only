/* eslint-disable no-console */
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const TABLES = {
  truncate: /* sql */ `
    TRUNCATE TABLE table_name RESTART IDENTITY CASCADE;
  `,

  table_name: /* sql */ `
    INSERT INTO table_name (name_field)
    VALUES
      ('Name placeholder 1'),
      ('Name placeholder 2'),
      ('Name placeholder 3');
  `,
};

export async function seedSchema() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    await client.query(/* sql */ `
      TRUNCATE TABLE 
        brands, 
        suppliers, 
        categories, 
        products, 
        product_variations, 
        line_items, 
        stock_movements 
        RESTART IDENTITY CASCADE;
    `);
    console.log("Table preparation complete.");

    for (const tableName in TABLES) {
      const sqlQuery = TABLES[tableName];
      await client.query(sqlQuery);
      console.log(`Verified table: ${tableName}`);
    }

    await client.query("COMMIT;");
    console.log("Table seeding complete.");
  } catch (error) {
    console.error("Failed to seed tables:", error);
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
