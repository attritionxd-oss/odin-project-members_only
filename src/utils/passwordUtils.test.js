import { describe, it, expect } from "@jest/globals";

import { hashPassword, verifyPassword } from "./passwordUtils.js";

describe("Password Utility Unit tests", () => {
  const testPassword = "SomeSecretPassword123!";

  describe("hashPassword()", () => {
    it("should return an object with hash and salt as hex strings", async () => {
      const result = await hashPassword(testPassword);

      expect(result).toHaveProperty("hash");
      expect(result).toHaveProperty("salt");
      expect(typeof result.hash).toBe("string");
      expect(typeof result.salt).toBe("string");

      expect(result.salt).toHaveLength(32);
      expect(result.hash).toHaveLength(128);
    });

    it("should generate unique salts and hashes for the same password", async () => {
      const set1 = await hashPassword(testPassword);
      const set2 = await hashPassword(testPassword);

      expect(set1.salt).not.toBe(set2.salt);
      expect(set1.hash).not.toBe(set2.hash);
    });
  });

  describe("verifyPassword()", () => {
    it("should return true for a correct password", async () => {
      const { hash, salt } = await hashPassword(testPassword);

      const isValid = await verifyPassword(testPassword, hash, salt);
      expect(isValid).toBe(true);
    });

    it("should return false if the stored hash length does not match derived key length", async () => {
      const { salt } = await hashPassword(testPassword);
      const invalidShortHash = "abcd1234";

      const isValid = await verifyPassword(
        testPassword,
        invalidShortHash,
        salt,
      );
      expect(isValid).toBe(false);
    });

    it("should return false if the salt has been tampered with", async () => {
      const { hash } = await hashPassword(testPassword);
      const corruptedSalt = "0".repeat(32);

      const isValid = await verifyPassword(testPassword, hash, corruptedSalt);
      expect(isValid).toBe(false);
    });
  });
});
