import { matchedData } from "express-validator";
import messageService from "./message.service.js";
import { renderWithLayout } from "#modules/renderer/renderHelper.js";
import { formatTimestamp } from "#utils/formatTimestamp.js";

export const messageController = {
  showEditPage: async (req, res, next) => {
    try {
      const message_id = req.params[0];
      if (!message_id) {
        const error = new Error(`Message #${message_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      const message = await messageService.getById(message_id);
      if (!message) {
        const error = new Error(`Message #${message_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      const messageWithFormatting = {
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

      const sessionUser = req.session.passport.user;
      if (!sessionUser) {
        const error = new Error(`User #${sessionUser} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      renderWithLayout(res, "outlets/messages/user-edit-message", {
        title: "Compose new message",
        message: messageWithFormatting,
        targetRedirect: req.query.redirect || "/",
        error: req.query.error || null,
      });
    } catch (error) {
      next(error);
    }
  },

  updateMessage: async (req, res, next) => {
    const validationErrors = req.validationErrors;

    try {
      const message_id = req.params[0];
      if (!message_id) {
        const error = new Error(`Message #${message_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      const message = await messageService.getById(message_id);
      if (!message) {
        const error = new Error(`Message #${message_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      const messageWithFormatting = {
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

      const sessionUser = req.session.passport.user;
      if (!sessionUser) {
        const error = new Error(`User #${sessionUser} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      const { message: message_body } = matchedData(req);

      if (validationErrors?.length > 0) {
        return renderWithLayout(res, "outlets/messages/user-edit-message", {
          title: "Compose new message",
          message: { ...messageWithFormatting, message_body: req.body.message },
          targetRedirect: req.query.redirect || "/",
          error: validationErrors || [],
        });
      }

      const updatedMessage = await messageService.update(message_id, {
        message_body: message_body,
      });
      if (!updatedMessage) {
        const error = new Error(
          `Message #${message_id} does not exist or was deleted.`,
        );
        error.statusCode = 404;
        return next(error);
      }

      res.redirect("/");
    } catch (error) {
      next(error);
    }
  },

  showOwnMessages: async (req, res, next) => {
    try {
      const user_id = req.session.passport.user;
      if (!user_id) {
        const error = new Error(
          "User ID not found or you do not have permission to access this \
          resource. Try logging in and out to fix this issue.",
        );
        error.statusCode = 404;
        return next(error);
      }

      const messagesRaw = await messageService.getByUserId(user_id, {
        includeDeleted: true,
        isOrderAscBool: true,
      });
      if (!messagesRaw) {
        const error = new Error(`Messages could not be retrieved.`);
        error.statusCode = 404;
        return next(error);
      }
      const messages = messagesRaw.map((message) => ({
        ...message,
        created_at__formatted: !message.created_at
          ? ""
          : formatTimestamp(message.created_at, { variant: "medium" }),
        updated_at__formatted: !message.updated_at
          ? ""
          : formatTimestamp(message.updated_at, { variant: "medium" }),
        deleted_at__formatted: !message.deleted_at
          ? ""
          : formatTimestamp(message.deleted_at, { variant: "medium" }),
      }));

      return renderWithLayout(res, "outlets/messages/user-message-history", {
        title: "Message history",
        messages: messages,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteMessage: async (req, res, next) => {
    try {
      const message_id = req.params[0];
      if (!message_id) {
        const error = new Error(`Message #${message_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      const message = await messageService.getById(message_id);
      if (!message) {
        const error = new Error(`Message #${message_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      // validate message ID ownership, if not owned by req.session.passport.user, fail silently
      const sessionUser = req.session.passport.user;
      if (!sessionUser) {
        const error = new Error(`User #${sessionUser} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      if (sessionUser !== message.created_by) {
        console.warn(
          "[DELETE MESSAGE] Failed\n\t",
          `Path: ${req.path};\n\t`,
          `Body ${JSON.stringify(req.body, null, 2)};\n\t`,
          `Error: Message #${message_id} is not owned by user #${sessionUser}`,
        );
        const error = new Error(
          "You do not have permission to access this resource.",
        );
        error.statusCode = 403;
        return next(error);
      } else {
        const deletedMessage = await messageService.softDelete(message_id);

        if (!deletedMessage) {
          const error = new Error(
            `Message #${message_id} could not be deleted.`,
          );
          error.statusCode = 404;
          return next(error);
        }
      }

      const targetRedirect = req.query.redirect || "/";
      res.redirect(targetRedirect);
    } catch (error) {
      next(error);
    }
  },

  restoreMessage: async (req, res, next) => {
    try {
      const message_id = req.params[0];
      if (!message_id) {
        const error = new Error(`Message #${message_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      const message = await messageService.getById(message_id);
      if (!message) {
        const error = new Error(`Message #${message_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      // validate message ID ownership, if not owned by req.session.passport.user, fail silently
      const sessionUser = req.session.passport.user;
      if (!sessionUser) {
        const error = new Error(`User #${sessionUser} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      if (sessionUser !== message.created_by) {
        console.warn(
          "[DELETE MESSAGE] Failed\n\t",
          `Path: ${req.path};\n\t`,
          `Body ${JSON.stringify(req.body, null, 2)};\n\t`,
          `Error: Message #${message_id} is not owned by user #${sessionUser}`,
        );
        const error = new Error(
          "You do not have permission to access this resource.",
        );
        error.statusCode = 403;
        return next(error);
      } else {
        const restoredMessage = await messageService.restore(message_id);

        if (!restoredMessage) {
          const error = new Error(
            `Message #${message_id} could not be restored.`,
          );
          error.statusCode = 404;
          return next(error);
        }
      }

      res.redirect("/messages/user");
    } catch (error) {
      next(error);
    }
  },
};
