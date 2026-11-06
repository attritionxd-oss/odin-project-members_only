import { describe, beforeEach, afterAll, it, expect } from "@jest/globals";
import { pool } from "#models/pool.js";
import userService from "#modules/users/user.service.js";
import userHistoryService from "./userHistory.service";

describe("User History Service Integration", () => {
  beforeEach(async () => {
    await pool.query(
      "TRUNCATE TABLE users, user_history RESTART IDENTITY CASCADE",
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  const testPayloadAdmin = {
    username: "test_user0",
    first_name: "test",
    last_name: "user0",
    hash: "some long hash",
    salt: "some random salt",
    status: "ACTIVATED",
    role: "ADMIN",
  };

  const testPayloadMember1 = {
    username: "test_user1",
    first_name: "test",
    last_name: "user1",
    hash: "some long hash",
    salt: "some random salt",
  };

  const testPayloadMember2 = {
    username: "test_user2",
    first_name: "test",
    last_name: "user2",
    hash: "some long hash",
    salt: "some random salt",
  };

  async function createSeedData() {
    const adminRes = await userService.create(testPayloadAdmin);
    const memberRes1 = await userService.create(testPayloadMember1);
    const memberRes2 = await userService.create(testPayloadMember2);

    await userService.adminActivate(memberRes1.id, adminRes.id);
    await userService.adminActivate(memberRes2.id, adminRes.id);

    await userService.changePassword(memberRes1.id, {
      hash: "new long hash",
      salt: "new long salt",
    });

    await userService.updateProfile(memberRes2.id, {
      first_name: "new first name",
      last_name: "new last name",
    });

    await userService.adminUpdateRole(memberRes2.id, adminRes.id, {
      role: "MODERATOR",
    });

    return {
      admin_id: adminRes.id,
      member1_id: memberRes1.id,
      member2_id: memberRes2.id,
    };
  }

  describe("getAll()", () => {
    it("should fetch all timeline for each user and actor", async () => {
      await createSeedData();

      const appHistory = await userHistoryService.getAll();

      expect(appHistory).toBeDefined();
      expect(appHistory).toBeInstanceOf(Array);
      expect(appHistory).toHaveLength(5);
    });
  });

  describe("getHistoryByUserId()", () => {
    it("should fetch timeline for a given user", async () => {
      const seeds = await createSeedData();

      const userHistory = await userHistoryService.getHistoryByUserId(
        seeds.member1_id,
      );

      expect(userHistory).toBeDefined();
      expect(userHistory).toBeInstanceOf(Array);
    });

    it("should return an empty array when specified ID is not found", async () => {
      const unknownHistory = await userHistoryService.getHistoryByUserId(99);
      expect(unknownHistory).toHaveLength(0);
      expect(unknownHistory).toMatchObject([]);
    });

    it("should throw an error if no ID is passed", async () => {
      await expect(userHistoryService.getHistoryByUserId(null)).rejects.toThrow(
        "`user_id` must be specified",
      );
    });
  });

  describe("getHistoryByActorId()", () => {
    it("should fetch timeline for a given actor", async () => {
      const seeds = await createSeedData();

      const actorHistory = await userHistoryService.getHistoryByActorId(
        seeds.admin_id,
      );

      expect(actorHistory).toBeDefined();
      expect(actorHistory).toBeInstanceOf(Array);
      expect(actorHistory).toHaveLength(3);
    });

    it("should return an empty array when specified ID is not found", async () => {
      const unknownHistory = await userHistoryService.getHistoryByActorId(99);
      expect(unknownHistory).toHaveLength(0);
      expect(unknownHistory).toMatchObject([]);
    });

    it("should throw an error if no ID is passed", async () => {
      await expect(
        userHistoryService.getHistoryByActorId(null),
      ).rejects.toThrow("`actor_id` must be specified");
    });
  });

  describe("getHistoryEntryById()", () => {
    it("should fetch a single record", async () => {
      const seeds = await createSeedData();

      const record = await userHistoryService.getHistoryEntryById(1);

      expect(record).toBeDefined();
      expect(record).toBeInstanceOf(Object);
      expect(record).toMatchObject({
        user_id: seeds.member1_id,
        actor_id: seeds.admin_id,
        action: "UPDATED",
        reason: "User activation",
      });
    });

    it("should return null when specified ID is not found", async () => {
      expect(await userHistoryService.getHistoryEntryById(99)).toBeNull();
    });

    it("should throw an error if no ID is passed", async () => {
      await expect(
        userHistoryService.getHistoryEntryById(null),
      ).rejects.toThrow("`id` must be specified");
    });
  });
});
