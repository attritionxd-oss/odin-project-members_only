import { renderWithLayout } from "#modules/renderer/renderHelper.js";
import passport from "passport";

export const authenticateLogin = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("error", info.message);
      return renderWithLayout(res, "outlets/login", {
        title: "Login",
        redirectTo: req.originalUrl || "/",
        formData: req.body || {},
        error: [],
        errorMessage: req.flash("error") || null,
      });
    }

    req.login(user, (err) => {
      if (err) return next(err);

      if (req.session.flash) {
        delete req.session.flash.error;
      }

      return res.redirect(res.locals.targetRedirect);
    });
  })(req, res, next);
};

export const attachCurrentUser = (req, res, next) => {
  res.locals.currentUser = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.isActivated = req.user?.status === "ACTIVATED";
  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.redirect(
      `/login?redirectTo=${encodeURIComponent(req.originalUrl)}`,
    );
  }

  next();
};

export const requireActive = (req, res, next) => {
  if (req.user.status === "PENDING_ACTIVATION") {
    return res.redirect(
      `/users/activate?redirectTo=${encodeURIComponent(req.originalUrl)}`,
    );
  }
  next();
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect(
        `/login?redirectTo=${encodeURIComponent(req.originalUrl)}`,
      );
    }

    const hasRole =
      allowedRoles.includes(req.user.role) || req.user.role === "ADMIN";

    if (!hasRole) {
      const error = new Error(
        `Your role (${req.user.role.toLowerCase()}) does not have permission to access this resource.`,
      );
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

export const guestsOnly = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }

  next();
};
