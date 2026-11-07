import crypto from "node:crypto";
import { promisify } from "node:util";

const scriptAsync = promisify(crypto.scrypt);
const randomBytesAsync = promisify(crypto.randomBytes);

const KEYLEN = 64;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
};

export async function hashPassword(password) {
  const saltBuffer = await randomBytesAsync(16);
  const salt = saltBuffer.toString("hex");

  const derivedKey = await scriptAsync(password, salt, KEYLEN, SCRYPT_OPTIONS);
  const hash = derivedKey.toString("hex");

  return { hash, salt };
}

export async function verifyPassword(userPassword, storedHash, storedSalt) {
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  const derivedKey = await scriptAsync(
    userPassword,
    storedSalt,
    KEYLEN,
    SCRYPT_OPTIONS,
  );

  if (derivedKey.length !== storedHashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKey, storedHashBuffer);
}
