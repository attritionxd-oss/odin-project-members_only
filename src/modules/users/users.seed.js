import { pool } from "#models/pool.js";
import { getSeededUsers } from "#utils/scripts/getSeededUsers.js";

export async function seedUsers() {
  const usersToInsert = await getSeededUsers();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const user of usersToInsert) {
      const query = /* sql */ `
        INSERT INTO users (username, first_name, last_name, role, status, hash, salt)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (username) DO UPDATE SET
          hash = EXCLUDED.hash,
          salt = EXCLUDED.salt,
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
      ];

      await client.query(query, params);
    }

    await client.query("COMMIT");
    // eslint-disable-next-line no-console
    console.log(`Successfully seeded ${usersToInsert.length} users.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to seed users:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedUsers().then(() => pool.end());
}
