/* eslint-disable no-console */
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const SCHEMA_TABLES = {
  enums: /* sql */ `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('PENDING_ACTIVATION', 'ACTIVATED', 'TERMINATED');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('MEMBER', 'MODERATOR', 'ADMIN');
      END IF;
    END $$;
  `,

  users: /* sql */ `
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      status user_status NOT NULL DEFAULT 'PENDING_ACTIVATION',
      role user_role NOT NULL DEFAULT 'MEMBER',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ DEFAULT NULL
    );
  `,

  user_history: /* sql */ `
    CREATE TABLE IF NOT EXISTS user_history (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action VARCHAR(50) NOT NULL,
      reason TEXT,
      actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      snapshot JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,

  messages: /* sql */ `
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      message_body TEXT NOT NULL,
      created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMPTZ DEFAULT NULL
    );
  `,

  idx_users_username: /* sql */ `
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `,

  idx_messages_created_by: /* sql */ `
    CREATE INDEX IF NOT EXISTS idx_messages_created_by 
      ON messages(created_by) WHERE deleted_at IS NULL;
  `,

  idx_user_history_user_id: /* sql */ `
    CREATE INDEX IF NOT EXISTS idx_user_history_user_id 
      ON user_history(user_id);
  `,

  idx_user_history_user_time: /* sql */ `
    CREATE INDEX IF NOT EXISTS idx_user_history_user_time
      ON user_history(user_id, created_at DESC);
  `,

  idx_user_history_actor_time: /* sql */ `
    CREATE INDEX IF NOT EXISTS idx_user_history_actor_time
      ON user_history(actor_id, created_at DESC)
      WHERE actor_id IS NOT NULL;
  `,

  log_user_changes: /* sql */ `
    CREATE OR REPLACE FUNCTION log_user_changes()
    RETURNS TRIGGER AS $$
    DECLARE
      current_user_id BIGINT;
      current_actor_id BIGINT;
      action_type VARCHAR(50);
      snapshot_data JSONB;
      change_reason TEXT;
    BEGIN
      current_actor_id := NULLIF(current_setting('app.current_actor_id', true), '')::BIGINT;
      change_reason := NULLIF(current_setting('app.change_reason', true), '');

      IF (TG_OP = 'DELETE') THEN
        action_type := 'DELETED';
        snapshot_data := to_jsonb(OLD);
        current_user_id := OLD.id;
      ELSEIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'TERMINATED') THEN
          action_type := 'TERMINATED';
        ELSEIF (OLD.hash IS DISTINCT FROM NEW.hash) THEN
          action_type := 'PASSWORD_CHANGED';
        ELSE
          action_type := 'UPDATED';
        END IF;

        snapshot_data := to_jsonb(NEW);
        current_user_id := NEW.id;
      END IF;

      IF (current_actor_id IS NULL AND TG_OP = 'UPDATE') THEN
        current_actor_id := current_user_id;
      END IF;

      INSERT INTO user_history (
        user_id,
        actor_id,
        action,
        reason,
        snapshot,
        created_at
      ) VALUES (
        current_user_id,
        current_actor_id,
        action_type,
        change_reason,
        snapshot_data,
        CURRENT_TIMESTAMP
      );

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `,

  trg_user_history: /* sql */ `
    DROP TRIGGER IF EXISTS trg_user_history ON users;

    CREATE TRIGGER trg_user_history
    AFTER UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_changes();
  `,

  session: /* sql */ `
    DROP TABLE IF EXISTS session;

    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL
    )
    WITH (OIDS=FALSE);

    ALTER TABLE "session" ADD CONSTRAINT "session_pkey" 
      PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

    CREATE INDEX "IDX_session_expire" ON "session" ("expire");
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
