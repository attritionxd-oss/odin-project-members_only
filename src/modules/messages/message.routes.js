import { Router } from "express";
import { messageController } from "./message.controllers.js";
import { validate } from "#modules/formValidation/validate.js";
import { validateMessage } from "./message.validation.js";

const router = Router();

// prettier-ignore
router.get(
  /^\/(\d+)\/edit$/,
  messageController.showEditPage,
);

// prettier-ignore
router.post(
  /^\/(\d+)\/edit$/,
  validate(validateMessage),
  messageController.updateMessage,
);

router.get("/user", messageController.showOwnMessages);

// prettier-ignore
router.post(
  /^\/(\d+)\/delete$/,
  messageController.deleteMessage,
);

// prettier-ignore
router.post(
  /^\/(\d+)\/restore$/,
  messageController.restoreMessage,
);

export default router;
