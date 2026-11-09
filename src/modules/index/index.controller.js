import { renderWithLayout } from "#modules/renderer/renderHelper.js";

export const indexController = {
  index: (req, res) => {
    renderWithLayout(res, "outlets/index", {
      title: "All Messages",
      error: req.query.error || null,
    });
  },
};
