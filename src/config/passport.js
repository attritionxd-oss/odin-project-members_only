import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import userService from "#modules/users/user.service.js";
import { verifyPassword } from "#utils/passwordUtils.js";

const verifyCallback = async (username, password, done) => {
  try {
    const user = await userService.getByUsername(username);
    if (!user) {
      return done(null, false, { message: "Incorrect username or password." });
    }

    const match = await verifyPassword(password, user.hash, user.salt);

    if (!match) {
      return done(null, false, { message: "Incorrect username or password." });
    }

    if (user.status === "TERMINATED") {
      return done(null, false, {
        message:
          "Account has been terminated. Contact a support to have your account reinstated.",
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
};

const strategy = new LocalStrategy(verifyCallback);

passport.use(strategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await userService.getById(id);

    if (user) {
      delete user.hash;
      delete user.salt;
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
});

export const passportSession = passport.session();
