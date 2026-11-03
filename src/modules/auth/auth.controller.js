import { renderWithLayout } from "#modules/renderer/renderHelper.js";

export const authController = {
  showLogin: (req, res) => {
    if (res.locals.isAuthenticated) {
      res.redirect("/");
    }
    renderWithLayout(res, "outlets/login", {
      title: "Login",
      error: req.query.error || null,
    });
  },

  login: (req, res) => {
    res.redirect("/");
  },

  logout: (req, res) => {
    res.redirect("/");
  },
};
