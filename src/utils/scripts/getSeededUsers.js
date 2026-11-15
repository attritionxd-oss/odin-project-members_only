import { rawUsers } from "./rawUsers.js";
import { hashPassword } from "#utils/passwordUtils.js";

/**
 * Important: `rawUsers` needs to be implemented.
 *
 * Example implementation below:
 *  export const rawUsers = [
 *    {
 *      username: "admin",
 *      first_name: "adminFirstName",
 *      last_name: "adminLastName",
 *      status: "ACTIVATED",
 *      role: "ADMIN",
 *    },
 *    {
 *      username: "test_user",
 *      first_name: "user_first_name",
 *      last_name: "user_last_name",
 *      status: "ACTIVATED",
 *      role: "MEMBER",
 *    },
 *  ];
 */

export async function getSeededUsers() {
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn(
      "⚠️ Warning: SEED_ADMIN_PASSWORD not set in env. Using default dev credentials.",
    );
  }

  const PASSWORD = {
    ADMIN: process.env.SEED_ADMIN_PASSWORD || "admin123",
    MODERATOR: process.env.SEED_MOD_PASSWORD || "mod123",
    MEMBER: process.env.SEED_USER_PASSOWRD || "member123",
  };

  const seedUsers = await Promise.all(
    rawUsers.map(async (user) => {
      const { hash, salt } = await hashPassword(PASSWORD[user.role]);

      const deleted_at = user.status === "TERMINATED" ? new Date() : null;

      return {
        ...user,
        hash,
        salt,
        deleted_at,
      };
    }),
  );

  return seedUsers;
}
