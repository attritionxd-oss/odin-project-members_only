import { matchedData } from "express-validator";
import { renderWithLayout } from "#modules/renderer/renderHelper.js";

export const authController = {
  showLogin(req, res) {
    if (res.locals.isAuthenticated) {
      res.redirect("/");
    }

    renderWithLayout(res, "outlets/login", {
      title: "Login",
      redirectTo: req.query.redirectTo || "/",
      formData: { username: "" },
      error: req.query.error || null,
      errorMessage: req.flash("error") || null,
    });
  },

  handleValidation(req, res, next) {
    try {
      const validationErrors = req.validationErrors;

      const { redirectTo } = matchedData(req);

      let targetRedirect = redirectTo || "/";

      if (!targetRedirect.startsWith("/") || targetRedirect.startsWith("//")) {
        targetRedirect = "/";
      }

      res.locals.targetRedirect = targetRedirect;

      if (validationErrors?.length > 0) {
        return renderWithLayout(res, "outlets/login", {
          title: "Login",
          redirectTo: targetRedirect || "/",
          formData: req.body || { username: "" },
          error: validationErrors || [],
          errorMessage: req.flash("error") || null,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  logout(req, res, next) {
    req.logout((err) => {
      if (err) {
        return next(err);
      }

      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }

        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        return res.redirect("/");
      });
    });
  },
};
