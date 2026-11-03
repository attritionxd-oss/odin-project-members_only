import crypto from "node:crypto";

const ITERATIONS = 600000;
const KEYLEN = 64;
const DIGEST = "sha256";

export function hashPassword(password, callback) {
  crypto.randomBytes(16, (err, saltBuffer) => {
    if (err) return callback(err);

    const salt = saltBuffer.toString("hex");

    crypto.pbkdf2(
      password,
      salt,
      ITERATIONS,
      KEYLEN,
      DIGEST,
      (err, derivedKey) => {
        if (err) throw err;

        const hash = derivedKey.toString("hex");

        callback(null, { hash, salt });
      },
    );
  });
}

export function verifyPassword(userPassword, storedHash, storedSalt, done) {
  crypto.pbkdf2(
    userPassword,
    storedSalt,
    ITERATIONS,
    KEYLEN,
    DIGEST,
    (err, derivedKey) => {
      if (err) return done(err);

      const hashToTestBuffer = Buffer.from(derivedKey.toString("hex"), "hex");
      const storedHashBuffer = Buffer.from(storedHash, "hex");

      if (hashToTestBuffer.length !== storedHashBuffer.length) {
        return done(null, false);
      }

      const isMatch = crypto.timingSafeEqual(
        hashToTestBuffer,
        storedHashBuffer,
      );

      done(null, isMatch);
    },
  );
}
