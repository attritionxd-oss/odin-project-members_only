import { pool } from "#models/pool.js";
import { executeWithAudit } from "#utils/dbUtils.js";
import format from "pg-format";

const userService = {
  create: async ({
    username,
    first_name,
    last_name,
    hash,
    salt,
    status = "PENDING_ACTIVATION",
    role = "MEMBER",
  }) => {
    const query = format(
      /* sql */ `
      INSERT INTO users (
        username,
        first_name,
        last_name,
        hash,
        salt,
        status,
        role
      ) VALUES (%L, %L, %L, %L, %L, %L, %L)
      RETURNING *;
    `,
      username,
      first_name,
      last_name,
      hash,
      salt,
      status,
      role,
    );

    const { rows } = await pool.query(query);
    return rows[0];
  },

  getAll: async ({
    includeDeleted = false,
    orderByField = "username",
    isOrderAscBool = true,
  } = {}) => {
    const isOrderAsc = isOrderAscBool ? "ASC" : "DESC";

    const query = format(
      includeDeleted
        ? /* sql */ `
          SELECT * FROM users ORDER BY username ASC;
        `
        : /* sql */ `
          SELECT * FROM users WHERE deleted_at IS NULL ORDER BY %s %s;
        `,
      orderByField,
      isOrderAsc,
    );

    const { rows } = await pool.query(query);
    return rows;
  },

  getById: async (id) => {
    if (!id || id === "") throw new Error("`id` must be specified");

    const query = format(
      /* sql */ `
      SELECT * FROM users WHERE id = %L
    `,
      id,
    );

    const { rows } = await pool.query(query);
    return rows[0] || null;
  },

  getByUsername: async (username) => {
    if (!username || username === "") {
      throw new Error("`username` must be specified");
    }

    const query = format(
      /* sql */ `
      SELECT * FROM users WHERE username = %L
    `,
      username,
    );

    const { rows } = await pool.query(query);
    return rows[0] || null;
  },

  /*
   * Generic `update` method not exposed but kept here for reference
   */
  // update: async (
  //   id,
  //   {
  //     first_name = null,
  //     last_name = null,
  //     hash = null,
  //     salt = null,
  //     status = null,
  //     role = null,
  //   } = {},
  // ) => {
  //   if (!id || id === "") throw new Error("`id` must be specified");
  //   const updates = [];
  //   const params = [];

  //   if (first_name !== null) {
  //     params.push(first_name);
  //     updates.push(`first_name = $${params.length}`);
  //   }
  //   if (last_name !== null) {
  //     params.push(last_name);
  //     updates.push(`last_name = $${params.length}`);
  //   }
  //   if (hash !== null) {
  //     params.push(hash);
  //     updates.push(`hash = $${params.length}`);
  //   }
  //   if (salt !== null) {
  //     params.push(salt);
  //     updates.push(`salt = $${params.length}`);
  //   }
  //   if (status !== null) {
  //     params.push(status);
  //     updates.push(`status = $${params.length}`);
  //   }
  //   if (role !== null) {
  //     params.push(role);
  //     updates.push(`role = $${params.length}`);
  //   }

  //   if (updates.length === 0) {
  //     const existing = await pool.query(
  //       /* sql */ `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL;`,
  //       [id],
  //     );
  //     return existing.rows[0] || null;
  //   }

  //   params.push(id);
  //   const query = /* sql */ `
  //     UPDATE users
  //     SET ${updates.join(", ")}
  //     WHERE
  //       id = $${params.length}
  //       AND deleted_at IS NULL
  //     RETURNING *;
  //   `;

  //   const result = await pool.query(query, params);
  //   return result.rows[0] || null;
  // },

  adminActivate: (
    target_user_id = null,
    admin_id = null,
    reason = "User activation",
  ) => {
    if (!target_user_id || target_user_id === "") {
      throw new Error("`target_user_id` must be specified");
    }
    if (!admin_id || admin_id === "") {
      throw new Error("`admin_id` must be specified");
    }

    return executeWithAudit(admin_id, reason, async (client) => {
      const { rows } = await client.query(
        /* sql */ `
          UPDATE users 
          SET
            status = 'ACTIVATED', 
            deleted_at = NULL,
            updated_at = CURRENT_TIMESTAMP 
          WHERE id = $1
          RETURNING *`,
        [target_user_id],
      );
      return rows[0] || null;
    });
  },

  adminUpdateRole: async (
    target_user_id = null,
    admin_id = null,
    { reason = "User role modification", role = "MEMBER" },
  ) => {
    if (!target_user_id || target_user_id === "") {
      throw new Error("`target_user_id` must be specified");
    }
    if (!admin_id || admin_id === "") {
      throw new Error("`admin_id` must be specified");
    }

    const result = await executeWithAudit(admin_id, reason, async (client) => {
      const { rows } = await client.query(
        /* sql */ `
          UPDATE users
          SET
            role = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *`,
        [role, target_user_id],
      );
      return rows[0] || null;
    });
    return result;
  },

  adminTerminate: (
    target_user_id = null,
    admin_id = null,
    reason = "User termination",
  ) => {
    if (!target_user_id || target_user_id === "") {
      throw new Error("`target_user_id` must be specified");
    }
    if (!admin_id || admin_id === "") {
      throw new Error("`admin_id` must be specified");
    }

    return executeWithAudit(admin_id, reason, async (client) => {
      const { rows } = await client.query(
        /* sql */ `
          UPDATE users 
          SET
            status = 'TERMINATED', 
            deleted_at = CURRENT_TIMESTAMP, 
            updated_at = CURRENT_TIMESTAMP 
          WHERE id = $1 
          RETURNING *`,
        [target_user_id],
      );
      return rows[0] || null;
    });
  },

  updateProfile: (id, { first_name = null, last_name = null } = {}) => {
    if (!id || id === "") throw new Error("`id` must be specified");

    const user_id = id;

    return executeWithAudit(user_id, "User profile update", async (pool) => {
      const updates = [];
      const params = [];

      if (first_name !== null) {
        params.push(first_name);
        updates.push(`first_name = $${params.length}`);
      }
      if (last_name !== null) {
        params.push(last_name);
        updates.push(`last_name = $${params.length}`);
      }

      if (updates.length === 0) {
        const { rows: existing } = await pool.query(
          /* sql */ `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL;`,
          [id],
        );
        return existing[0];
      }

      params.push(id);
      const query = /* sql */ `
        UPDATE users SET ${updates.join(", ")}
        WHERE 
          id = $${params.length} 
          AND deleted_at IS NULL 
          AND status = 'ACTIVATED'
        RETURNING *;
      `;

      const { rows } = await pool.query(query, params);
      return rows[0] || null;
    });
  },

  changePassword: (id, { hash = null, salt = null }) => {
    if (!id || id === "") {
      throw new Error("`id` must be specified");
    }

    const user_id = id;

    return executeWithAudit(user_id, "Password change", async (pool) => {
      const { rows } = await pool.query(
        /* sql */ `
        UPDATE users
        SET hash = $1, salt = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND status = 'ACTIVATED'
        RETURNING *;
        `,
        [hash, salt, user_id],
      );
      return rows[0] || null;
    });
  },
};

export default userService;
