import { pool } from "#models/pool.js";
import format from "pg-format";

const messageService = {
  create: async ({ message_body = null, created_by = null } = {}) => {
    if (!created_by || created_by === "") {
      throw new Error("`created_by` must be specified");
    }
    const query = /* sql */ `
      INSERT INTO messages (message_body, created_by)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [message_body, created_by]);
    return rows[0];
  },

  getAll: async ({
    includeDeleted = false,
    isOrderAscBool = true,
    orderByField = "created_at",
  } = {}) => {
    const isOrderAsc = isOrderAscBool ? "ASC" : "DESC";

    const query = format(
      includeDeleted
        ? /* sql */ `
      SELECT 
        m.*,
        u.username,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        CONCAT(LEFT(u.first_name, 1), LEFT(u.last_name,1)) AS initials,
        u.role,
        u.status
      FROM messages m
      LEFT JOIN users u
        ON m.created_by = u.id
      ORDER BY %s %s;
    `
        : /* sql */ `
      SELECT 
        m.*,
        u.username,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        CONCAT(LEFT(u.first_name, 1), LEFT(u.last_name,1)) AS initials,
        u.role,
        u.status
      FROM messages m
      LEFT JOIN users u
        ON m.created_by = u.id
      WHERE 
        m.deleted_at IS NULL
        AND u.status != 'TERMINATED'
      ORDER BY %s %s;
    `,
      `m.${orderByField}`,
      isOrderAsc,
    );

    const { rows } = await pool.query(query);
    return rows;
  },

  getById: async (id) => {
    if (!id || id === "") throw new Error("`id` must be specified");

    const query = /* sql */ `
      SELECT 
        m.*,
        u.username,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        CONCAT(LEFT(u.first_name, 1), LEFT(u.last_name,1)) AS initials,
        u.role,
        u.status
      FROM messages m
      LEFT JOIN users u
        ON m.created_by = u.id
      WHERE m.id = $1
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  getByUserId: async (
    created_by,
    {
      includeDeleted = false,
      isOrderAscBool = false,
      orderByField = "created_at",
    } = {},
  ) => {
    if (!created_by || created_by === "") {
      throw new Error("`id` must be specified");
    }

    const isOrderAsc = isOrderAscBool ? "ASC" : "DESC";

    const query = format(
      includeDeleted
        ? /* sql */ `
          SELECT * FROM messages
          WHERE created_by = $1
          ORDER BY %s %s;
        `
        : /* sql */ `
          SELECT * FROM messages
          WHERE created_by = $1
            AND deleted_at IS NULL
          ORDER BY %s %s;
        `,
      orderByField,
      isOrderAsc,
    );

    const { rows } = await pool.query(query, [created_by]);
    return rows;
  },

  update: async (id, { message_body = "" } = {}) => {
    if (!id || id === "") throw new Error("`id` must be specified");
    if (message_body === "") {
      const query = /* sql */ `SELECT * FROM messages WHERE id = $1;`;
      const { rows } = await pool.query(query, [id]);
      return rows[0];
    }

    const query = /* sql */ `
      UPDATE messages
      SET message_body = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [message_body, id]);
    return rows[0] || null;
  },

  softDelete: async (id) => {
    if (!id || id === "") throw new Error("`id` must be specified");

    const query = /* sql */ `
      UPDATE messages SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  restore: async (id) => {
    if (!id || id === "") throw new Error("`id` must be specified");

    const query = /* sql */ `
      UPDATE messages SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NOT NULL
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },
};

export default messageService;
