import { pool } from "#models/pool.js";

export async function executeWithAudit(actor_id, reason, callback) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (actor_id) {
      await client.query(
        "SELECT set_config('app.current_actor_id', $1, true)",
        [actor_id.toString()],
      );
    }
    if (reason) {
      await client.query("SELECT set_config('app.change_reason', $1, true)", [
        reason,
      ]);
    }

    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
