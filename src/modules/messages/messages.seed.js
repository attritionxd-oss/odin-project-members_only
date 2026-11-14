/* eslint-disable no-console */
import { fileURLToPath } from "node:url";
import { pool } from "#models/pool.js";

const TABLES = {
  truncate: /* sql */ `
    TRUNCATE TABLE messages RESTART IDENTITY CASCADE;
  `,

  messages: /* sql */ `
    INSERT INTO messages (message_body, created_by)
    VALUES
      (
        'Welcome to the Clubhouse!', 
        (SELECT id FROM users WHERE username = 'cedarspice_beetleglow')
      ),
      (
        'Glad you are here! Please read the rules, introduce yourself, and make yourself at home!',
        (SELECT id FROM users WHERE username = 'cedarspice_beetleglow')
      ),
      (
        'Hi! I''m Starsheen Oakmoon! I''m from the Sundrop Isles, 8 years old and I have purple wings!',
        (SELECT id FROM users WHERE username = 'starsheen_oakmoon')
      ),
      (
        'Welcome Starsheen! Cedarspice and I are your moderators, let us know if you have questions or need help!',
        (SELECT id FROM users WHERE username = 'quickring_fluttertouch')
      ),
      (
        'Hi guys! I really like pink! PRETTY PRETTY PIIINNNK!!!!',
        (SELECT id FROM users WHERE username = 'giggleflower_sugardust')
      ),
      (
        'It''s a pleasure to meet you Giggleflower! I also like pink!',
        (SELECT id FROM users WHERE username = 'starsheen_oakmoon')
      ),
      (
        'Hi ya''ll, I hope we get along well!',
        (SELECT id FROM users WHERE username = 'cedarberry_sugarflower')
      ),
      (
        'Samesies! I like it here!',
        (SELECT id FROM users WHERE username = 'giggleflower_sugardust')
      ),
      (
        'People, I swear if you do something bad, I will kick you out of the club and something really, really bad will happen to you the next day...',
        (SELECT id FROM users WHERE username = 'jellycloud_moonshy')
      ),
      (
        'For those wondering, Jellycloud is NOT serious! She''s actually a very nice person who loves to joke around.', 
        (SELECT id FROM users WHERE username = 'cedarspice_beetleglow')
      ),
      (
        'Jellycloud, please use some emoji like 🙃 to say that you''re joking.',
        (SELECT id FROM users WHERE username = 'cedarspice_beetleglow')
      ),
      (
        'Great idea, Cedarspice! Hi all! I wasn''t serious, I hope you have a great time here.',
        (SELECT id FROM users WHERE username = 'jellycloud_moonshy')
      );
  `,
};

export async function seedSchema() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

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
