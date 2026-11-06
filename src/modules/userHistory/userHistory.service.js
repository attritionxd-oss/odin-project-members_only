import { pool } from "#models/pool.js";

const userHistoryService = {
  getAll: async (limit = 20) => {
    const { rows } = await pool.query(
      /* sql */ `
      SELECT * FROM user_history
      ORDER BY created_at DESC
      LIMIT $1;
    `,
      [limit],
    );
    return rows;
  },

  getHistoryByUserId: async (user_id) => {
    if (!user_id || user_id === "") {
      throw new Error("`user_id` must be specified");
    }

    const query = /* sql */ `
      SELECT * FROM user_history
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query, [user_id]);
    return rows;
  },

  getHistoryByActorId: async (actor_id) => {
    if (!actor_id || actor_id === "") {
      throw new Error("`actor_id` must be specified");
    }

    const query = /* sql */ `
      SELECT * FROM user_history
      WHERE actor_id = $1
      ORDER BY created_at DESC;
    `;

    const { rows } = await pool.query(query, [actor_id]);
    return rows;
  },

  getHistoryEntryById: async (id) => {
    if (!id || id === "") {
      throw new Error("`id` must be specified");
    }

    const query = /* sql */ `
      SELECT * FROM user_history
      WHERE id = $1;
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },
};

export default userHistoryService;
