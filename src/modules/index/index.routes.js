import { Router } from "express";
import { indexController } from "./index.controller.js";
import { validate } from "#modules/formValidation/validate.js";
import { validateMessage } from "#modules/messages/message.validation.js";
import { requireActive, requireAuth } from "#modules/auth/auth.middleware.js";

const router = Router();

router.get("/", indexController.showAllMessages);

router.get(
  "/new",
  requireActive,
  requireAuth,
  indexController.showNewMessageForm,
);

router.post(
  "/new",
  requireActive,
  requireAuth,
  validate(validateMessage),
  indexController.submitNewMessage,
);

export default router;
