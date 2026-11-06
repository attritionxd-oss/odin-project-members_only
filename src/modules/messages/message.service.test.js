import { pool } from "#models/pool.js";
import messageService from "./message.service";

describe("Message Service Integration", () => {
  beforeEach(async () => {
    await pool.query("TRUNCATE TABLE messages, users RESTART IDENTITY CASCADE");
  });

  afterAll(async () => {
    await pool.end();
  });

  async function createSeedData1() {
    const userRes = await pool.query(/* sql */ `
    INSERT INTO users (username, first_name, last_name, hash, salt)
    VALUES ('test_user1', 'test', 'user1', 'some long hash', 'some random salt')
    RETURNING id;
  `);

    return {
      user_id: userRes.rows[0].id,
    };
  }

  async function createSeedData2() {
    const userRes = await pool.query(/* sql */ `
    INSERT INTO users (username, first_name, last_name, hash, salt)
    VALUES ('test_user2', 'test', 'user2', 'some long hash', 'some random salt')
    RETURNING id;
  `);

    return {
      user_id: userRes.rows[0].id,
    };
  }

  describe("create()", () => {
    it("should create a message referencing a user_id", async () => {
      const seeds = await createSeedData1();
      const inserted = await messageService.create({
        message_body: "test message",
        created_by: seeds.user_id,
      });

      expect(inserted).toBeDefined();
      expect(inserted).toMatchObject({
        message_body: "test message",
        created_by: seeds.user_id,
      });
    });

    it("should throw an error created_by is not passed", async () => {
      await expect(
        messageService.create({
          message_body: "test message",
        }),
      ).rejects.toThrow("`created_by` must be specified");
    });
  });

  describe("getAll()", () => {
    it("should return data from a seeded table", async () => {
      const seeds = await createSeedData1();
      await messageService.create({
        message_body: "test message 1",
        created_by: seeds.user_id,
      });
      await messageService.create({
        message_body: "test message 2",
        created_by: seeds.user_id,
      });

      expect(await messageService.getAll()).toBeDefined();
    });

    it.todo("should return all non-deleted records");

    it.todo("should return all records in descending order");
  });

  describe("getById()", () => {
    it("should return data when table is seeded", async () => {
      const seeds = await createSeedData1();
      const msg1 = await messageService.create({
        message_body: "test message 1",
        created_by: seeds.user_id,
      });

      const fetched = await messageService.getById(msg1.id);

      expect(fetched).toBeDefined();
      expect(fetched.message_body).toBe("test message 1");
    });

    it("should return null when ID is not found", async () => {
      expect(await messageService.getById(99)).toBeNull();
    });

    it("should throw an error if no ID is passed", async () => {
      await expect(messageService.getById(null)).rejects.toThrow(
        "`id` must be specified",
      );
    });
  });

  describe("getByUserId", () => {
    it("should return only the relevant messaged from a user", async () => {
      const seed1 = await createSeedData1();
      const seed2 = await createSeedData2();

      await messageService.create({
        message_body: "irrelevant message",
        created_by: seed1.user_id,
      });
      await messageService.create({
        message_body: "relevant message 1",
        created_by: seed2.user_id,
      });
      await messageService.create({
        message_body: "relevant message 2",
        created_by: seed2.user_id,
      });

      const relevantMessages = await messageService.getByUserId(seed2.user_id);

      expect(relevantMessages).toBeDefined();
      expect(relevantMessages).toMatchObject([
        { message_body: "relevant message 1", created_by: seed2.user_id },
        { message_body: "relevant message 2", created_by: seed2.user_id },
      ]);
    });

    it("should return an empty array when user ID not found", async () => {
      const fetched = await messageService.getByUserId(99);
      expect(fetched).toHaveLength(0);
      expect(fetched).toEqual([]);
    });

    it("should throw an error if no ID is passed", async () => {
      await expect(messageService.getByUserId(null)).rejects.toThrow(
        "`id` must be specified",
      );
    });
  });

  describe("update()", () => {
    it("should update only the specified record", async () => {
      const seed1 = await createSeedData1();
      const fixed = await messageService.create({
        message_body: "fixed message",
        created_by: seed1.user_id,
      });
      const toUpdate = await messageService.create({
        message_body: "message to update",
        created_by: seed1.user_id,
      });

      const updated = await messageService.update(toUpdate.id, {
        message_body: "message updated",
      });

      expect(updated).toBeDefined();
      expect(updated.message_body).toBe("message updated");
      expect(await messageService.getAll()).toMatchObject([
        { id: fixed.id, message_body: "fixed message" },
        { id: toUpdate.id, message_body: "message updated" },
      ]);
    });

    it("should throw an error if no ID is passed", async () => {
      await expect(messageService.update(null)).rejects.toThrow(
        "`id` must be specified",
      );
    });

    it("should return existing record if message is empty", async () => {
      const seed = await createSeedData1();
      const toUpdate = await messageService.create({
        message_body: "some message",
        created_by: seed.user_id,
      });

      expect(
        await messageService.update(toUpdate.id, {
          message_body: "",
        }),
      ).toMatchObject(toUpdate);
    });

    it("should return null when specified ID is not found", async () => {
      expect(
        await messageService.update(99, { message_body: "some message" }),
      ).toBeNull();
    });
  });

  describe("softDelete()", () => {
    it("should mark the specified record with deleted_at", async () => {
      const seed1 = await createSeedData1();
      const msg1 = await messageService.create({
        message_body: "some message",
        created_by: seed1.user_id,
      });

      const deleted = await messageService.softDelete(msg1.id);

      expect(deleted).toBeDefined();
      expect(deleted.deleted_at).toBeDefined();
      expect(deleted.deleted_at).not.toBe("");
    });

    it("should return 0 length when specified ID is not found", async () => {
      expect(await messageService.softDelete(99)).toBeNull();
    });

    it("should mark the record only if it has not previously been marked", async () => {
      const seed1 = await createSeedData1();
      const msg1 = await messageService.create({
        message_body: "some message",
        created_by: seed1.user_id,
      });

      await messageService.softDelete(msg1.id);

      expect(await messageService.softDelete(msg1.id)).toBeNull();
    });

    it("should throw an error if no ID is passed", async () => {
      await expect(messageService.softDelete(null)).rejects.toThrow(
        "`id` must be specified",
      );
    });
  });

  describe("restore()", () => {
    it("should nullify deleted_at for the corresponding record", async () => {
      const seed1 = await createSeedData1();
      const msg1 = await messageService.create({
        message_body: "some message",
        created_by: seed1.user_id,
      });

      await messageService.softDelete(msg1.id);

      const restored = await messageService.restore(msg1.id);
      expect(restored).toBeDefined();
      expect(restored.deleted_at).toBeNull();
    });

    it("should return 0 length when specified ID is not found", async () => {
      expect(await messageService.restore(99)).toBeNull();
    });

    it("should throw an error if no ID is passed", async () => {
      await expect(messageService.restore(null)).rejects.toThrow(
        "`id` must be specified",
      );
    });
  });
});
