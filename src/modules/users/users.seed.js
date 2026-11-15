/* eslint-disable no-console */
import { fileURLToPath } from "node:url";
import { pool } from "#models/pool.js";
import { getSeededUsers } from "#utils/scripts/getSeededUsers.js";

export async function seedUsers() {
  const usersToInsert = await getSeededUsers();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(/* sql */ `
      TRUNCATE TABLE users RESTART IDENTITY CASCADE;
    `);

    console.log("Table preparation complete.");

    for (const user of usersToInsert) {
      const query = /* sql */ `
        INSERT INTO users (username, first_name, last_name, role, status, hash, salt, deleted_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (username) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          hash = EXCLUDED.hash,
          salt = EXCLUDED.salt,
          deleted_at = EXCLUDED.deleted_at,
          updated_at = CURRENT_TIMESTAMP;
      `;

      const params = [
        user.username,
        user.first_name,
        user.last_name,
        user.role,
        user.status,
        user.hash,
        user.salt,
        user.deleted_at,
      ];

      await client.query(query, params);
    }

    await client.query("COMMIT");

    console.log(`Successfully seeded ${usersToInsert.length} users.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed users:", error);
    throw error;
  } finally {
    client.release();
  }
}

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  console.log("users.seed.js direct execution");
  seedUsers()
    .then(() => pool.end())
    // eslint-disable-next-line no-process-exit
    .catch(() => process.exit(1));
}
