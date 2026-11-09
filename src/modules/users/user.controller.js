import { renderWithLayout } from "#modules/renderer/renderHelper.js";

export const userController = {
  showRegister: (req, res) => {
    renderWithLayout(res, "outlets/register", {
      title: "Sign up",
      fields: {},
      error: req.query.error || null,
    });
  },

  register: (req, res, next) => {
    req.fields = req.body;

    renderWithLayout(res, "outlets/register", {
      title: "Sign up",
      fields: req.body,
      error: req.query.error || null,
    });
  },

  showUpdateForm: (req, res) => {},

  update: (req, res) => {},

  activate: (req, res) => {},

  terminate: (req, res) => {},
};
