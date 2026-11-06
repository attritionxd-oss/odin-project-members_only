import { describe, beforeEach, afterAll, it } from "@jest/globals";
import { pool } from "#models/pool.js";
import userService from "./user.service";

describe("User Service Integration", () => {
  beforeEach(async () => {
    await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
  });

  afterAll(async () => {
    await pool.end();
  });

  const adminPayload = {
    username: "test_admin",
    first_name: "test",
    last_name: "admin",
    hash: "some long hash",
    salt: "some random salt",
    status: "ACTIVATED",
    role: "ADMIN",
  };
  const userPayload1 = {
    username: "test_user1",
    first_name: "test",
    last_name: "user1",
    hash: "some long hash",
    salt: "some random salt",
  };
  const userPayload2 = {
    username: "test_user2",
    first_name: "test",
    last_name: "user2",
    hash: "some long hash",
    salt: "some random salt",
  };

  describe("create()", () => {
    it("should insert a user", async () => {
      const inserted = await userService.create(userPayload1);

      expect(inserted).toHaveProperty("id");
      expect(inserted.status).toBe("PENDING_ACTIVATION");
    });
  });

  describe("getAll()", () => {
    it("should return data from a seeded table", async () => {
      await userService.create(userPayload1);
      await userService.create(adminPayload);

      const data = await userService.getAll();

      expect(data).toMatchObject([adminPayload, userPayload1]);

      // expect results to be sorted by username
      expect(data.map((record) => record.username)).toMatchObject([
        "test_admin",
        "test_user1",
      ]);
    });

    it("should return all records including deleted ones", async () => {
      await userService.create(userPayload1);
      await userService.create(adminPayload);
      await userService.create({ ...userPayload2, status: "TERMINATED" });

      const data = await userService.getAll({
        includeDeleted: true,
        isOrderAscBool: false,
      });

      expect(
        data.map((record) => ({
          username: record.username,
          status: record.status,
        })),
      ).toMatchObject([
        { username: adminPayload.username, status: "ACTIVATED" },
        { username: userPayload1.username, status: "PENDING_ACTIVATION" },
        { username: userPayload2.username, status: "TERMINATED" },
      ]);
    });
  });

  describe("getById()", () => {
    it("should return data when table is seeded", async () => {
      await userService.create(userPayload1);

      expect(await userService.getById(1)).toMatchObject(userPayload1);
    });

    it("should return null when specified ID is not found", async () => {
      expect(await userService.getById(99)).toBeNull();
    });

    it("should throw an error if no ID is passed", async () => {
      await expect(userService.getById(null)).rejects.toThrow(
        "`id` must be specified",
      );
    });
  });

  describe("getByUsername()", () => {
    it("should return data when table is seeded", async () => {
      await userService.create(userPayload1);

      expect(
        await userService.getByUsername(userPayload1.username),
      ).toMatchObject(userPayload1);
    });

    it("should return null when specified ID is not found", async () => {
      expect(await userService.getByUsername(99)).toBeNull();
    });

    it("should throw an error if no username is passed", async () => {
      await expect(userService.getByUsername(null)).rejects.toThrow(
        "`username` must be specified",
      );
    });
  });

  describe("adminActivate()", () => {
    it("should update a record, setting it to 'ACTIVATED'", async () => {
      const user = await userService.create(userPayload1);
      const admin = await userService.create(adminPayload);

      const activated = await userService.adminActivate(user.id, admin.id);

      expect(activated).toBeDefined();
      expect(activated.status).toBe("ACTIVATED");
    });

    it("should reactivate by setting status='ACTIVATED' deleted_at=null", async () => {
      const user = await userService.create(userPayload1);
      const admin = await userService.create(adminPayload);

      await userService.adminTerminate(user.id, admin.id);

      const reactivated = await userService.adminActivate(user.id, admin.id);

      expect(reactivated.status).toBe("ACTIVATED");
      expect(reactivated.deleted_at).toBeNull();
    });

    it("should return null when specified ID is not found", async () => {
      expect(await userService.adminActivate(99, 100)).toBeNull();
    });

    it("should throw an error if no target user ID is passed", async () => {
      expect.assertions(2);

      try {
        await userService.adminActivate(null, 99);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(await error.message).toBe("`target_user_id` must be specified");
      }
    });

    it("should throw an error if no admin ID is passed", async () => {
      expect.assertions(2);

      try {
        await userService.adminActivate(99, null);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(await error.message).toBe("`admin_id` must be specified");
      }
    });
  });

  describe("adminUpdateRole()", () => {
    it("should change the role", async () => {
      const user = await userService.create(userPayload1);
      const admin = await userService.create(adminPayload);
      await userService.adminActivate(user.id, admin.id);

      const reRoled = await userService.adminUpdateRole(user.id, admin.id, {
        role: "MODERATOR",
      });

      expect(reRoled).toMatchObject({
        role: "MODERATOR",
        status: "ACTIVATED",
      });
    });

    it("should return null when specified ID is not found", async () => {
      expect(
        await userService.adminUpdateRole(99, 100, { role: "MODERATOR" }),
      ).toBeNull();
    });

    it("should throw an error if no target user ID is passed", async () => {
      expect.assertions(2);

      try {
        await userService.adminUpdateRole(null, 99, { role: "MODERATOR" });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(await error.message).toBe("`target_user_id` must be specified");
      }
    });

    it("should throw an error if no admin ID is passed", async () => {
      expect.assertions(2);

      try {
        await userService.adminUpdateRole(99, null, { role: "MODERATOR" });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(await error.message).toBe("`admin_id` must be specified");
      }
    });
  });

  describe("adminTerminate()", () => {
    it("should fill deleted_at with current timestamp", async () => {
      const user = await userService.create(userPayload1);
      const admin = await userService.create(adminPayload);

      const terminated = await userService.adminTerminate(user.id, admin.id);

      expect(terminated).toMatchObject({
        status: "TERMINATED",
      });
      expect(terminated.deleted_at).not.toBeNull();
    });

    it("should return null when specified ID is not found", async () => {
      expect(await userService.adminTerminate(99, 100)).toBeNull();
    });

    it("should throw an error if no target user ID is passed", async () => {
      expect.assertions(2);

      try {
        await userService.adminTerminate(null, 99);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(await error.message).toBe("`target_user_id` must be specified");
      }
    });

    it("should throw an error if no admin ID is passed", async () => {
      expect.assertions(2);

      try {
        await userService.adminTerminate(99, null);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(await error.message).toBe("`admin_id` must be specified");
      }
    });
  });

  describe("updateProfile()", () => {
    it("should update the first_name and last_name", async () => {
      const user = await userService.create(userPayload1);
      const admin = await userService.create(adminPayload);
      await userService.adminActivate(user.id, admin.id);

      const updated = await userService.updateProfile(user.id, {
        first_name: "new first name",
        last_name: "new last_name",
      });

      expect(updated).toMatchObject({
        first_name: "new first name",
        last_name: "new last_name",
        status: "ACTIVATED",
      });
    });

    it("should update the first_name only", async () => {
      const user = await userService.create(userPayload1);
      const admin = await userService.create(adminPayload);
      await userService.adminActivate(user.id, admin.id);

      const updated = await userService.updateProfile(user.id, {
        first_name: "new first name",
      });

      expect(updated).toMatchObject({
        first_name: "new first name",
        last_name: userPayload1.last_name,
        status: "ACTIVATED",
      });
    });

    it("should update the last_name only", async () => {
      const user = await userService.create(userPayload1);
      const admin = await userService.create(adminPayload);
      await userService.adminActivate(user.id, admin.id);

      const updated = await userService.updateProfile(user.id, {
        last_name: "new last name",
      });

      expect(updated).toMatchObject({
        first_name: userPayload1.first_name,
        last_name: "new last name",
        status: "ACTIVATED",
      });
    });

    it("should return the record when there is nothing to update", async () => {
      const user = await userService.create(userPayload1);
      const admin = await userService.create(adminPayload);
      await userService.adminActivate(user.id, admin.id);

      const updated = await userService.updateProfile(user.id);

      expect(updated).toMatchObject(userPayload1);
    });

    it("should return null when specified ID is not found", async () => {
      expect(
        await userService.updateProfile(99, { first_name: "new" }),
      ).toBeNull();
    });

    it("should return null when user is not activated", async () => {
      const user = await userService.create(userPayload1);

      expect(
        await userService.updateProfile(user.id, { first_name: "new" }),
      ).toBeNull();
    });

    it("should throw an error if no ID is passed", async () => {
      try {
        userService.updateProfile(null);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(await error.message).toBe("`id` must be specified");
      }
    });
  });

  describe("changePassword()", () => {
    it("should update the password", async () => {
      const user = await userService.create(userPayload1);
      const admin = await userService.create(adminPayload);
      await userService.adminActivate(user.id, admin.id);

      const updated = await userService.changePassword(user.id, {
        hash: "new long hash",
        salt: "new random salt",
      });

      expect(updated).toMatchObject({
        hash: "new long hash",
        salt: "new random salt",
        status: "ACTIVATED",
      });
    });

    it("should return null when specified ID is not found", async () => {
      expect(
        await userService.changePassword(99, {
          hash: "new long hash",
          salt: "new random salt",
        }),
      ).toBeNull();
    });

    it("should return null when user is not activated", async () => {
      const user = await userService.create(userPayload1);

      expect(
        await userService.changePassword(user.id, {
          hash: "new long hash",
          salt: "new random salt",
        }),
      ).toBeNull();
    });

    it("should throw an error if no ID is passed", async () => {
      expect.assertions(2);

      try {
        await userService.changePassword(null, { hash: "h", salt: "s" });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(await error.message).toBe("`id` must be specified");
      }
    });
  });
});
