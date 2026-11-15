/* eslint-disable no-console */
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";
import { seedUsers } from "#modules/users/users.seed.js";
import { seedMessages } from "#modules/messages/messages.seed.js";

export async function seedAll() {
  console.log("Starting full database seed...");

  await seedUsers();
  await seedMessages();

  console.log("All tables seeded successfully!");
}

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  console.log("all.seed.js direct execution");
  seedAll()
    .then(() => pool.end())
    .catch((error) => {
      console.log("Combined seeding failed", error);
      pool.end();
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    });
}
