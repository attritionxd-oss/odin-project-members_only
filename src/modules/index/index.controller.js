import { renderWithLayout } from "#modules/renderer/renderHelper.js";
import { formatTimestamp } from "#utils/formatTimestamp.js";

export const indexController = {
  index: (req, res) => {
    res.locals.currentUser = {
      id: 1,
      full_name: "full name",
      created_at: formatTimestamp(Date.now(), { variant: "dateOnly" }),
      role: "test-role",
    };
    res.locals.isAuthenticated = false;
    renderWithLayout(res, "outlets/index", {
      title: "All Messages",
      error: req.query.error || null,
    });
  },
};
