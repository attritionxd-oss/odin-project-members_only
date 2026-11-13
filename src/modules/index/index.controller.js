import { matchedData } from "express-validator";
import messageService from "#modules/messages/message.service.js";
import { renderWithLayout } from "#modules/renderer/renderHelper.js";
import { formatTimestamp } from "#utils/formatTimestamp.js";

export const indexController = {
  showAllMessages: async (req, res, next) => {
    try {
      const messages = await messageService.getAll();

      if (!messages) {
        console.warn(
          "[SHOW ALL MESSAGES] Failed\n",
          `Path: ${req.path}; Body ${req.body}`,
        );
      }

      const messagesWithFormatting = messages.map((message) => {
        return {
          ...message,
          created_at__formatted: !message.created_at
            ? null
            : formatTimestamp(message.created_at, { variant: "medium" }),
          updated_at__formatted: !message.updated_at
            ? null
            : formatTimestamp(message.updated_at, { variant: "medium" }),
          deleted_at__formatted: !message.deleted_at
            ? null
            : formatTimestamp(message.deleted_at, { variant: "medium" }),
        };
      });

      renderWithLayout(res, "outlets/index-page", {
        title: "All Messages",
        messages: messagesWithFormatting,
        currentUser: req.user,
        isActivated: res.locals.isActivated,
        error: req.query.error || null,
      });
    } catch (error) {
      next(error);
    }
  },

  showNewMessageForm: (req, res) => {
    renderWithLayout(res, "outlets/new-message", {
      title: "Compose new message",
      formData: req.body || {},
      error: req.query.error || null,
    });
  },

  submitNewMessage: async (req, res, next) => {
    const created_by = req.user.id;

    const validationErrors = req.validationErrors;

    if (validationErrors?.length > 0) {
      return renderWithLayout(res, "outlets/new-message", {
        title: "Compose new message",
        formData: req.body,
        error: validationErrors || null,
      });
    }

    const { message: message_body } = matchedData(req);

    try {
      const message = await messageService.create({ message_body, created_by });

      if (!message) {
        console.warn(
          "[CREATE MESSAGE] Failed\n",
          `Path: ${req.path}; Body ${req.body}`,
        );
      }

      res.redirect("/");
    } catch (error) {
      next(error);
    }
  },
};
