import { Router } from "express";
import { userController } from "./user.controller.js";
import {
  guestsOnly,
  requireActive,
  requireAuth,
  requireRole,
} from "#modules/auth/auth.middleware.js";
import { validate } from "#modules/formValidation/validate.js";
import {
  validatePassword,
  validateProfile,
  validateSecretCode,
  validateSignup,
} from "./user.validation.js";

const router = Router();

router.get("/register", guestsOnly, userController.showRegister);

router.post(
  "/register",
  guestsOnly,
  validate(validateSignup),
  userController.register,
);

router.get("/activate", requireAuth, userController.showSelfActivation);

router.post(
  "/activate",
  validate(validateSecretCode),
  requireAuth,
  userController.selfActivation,
);

router.get(
  "/profile",
  requireAuth,
  requireActive,
  userController.showOwnProfile,
);

router.post(
  "/profile",
  requireAuth,
  requireActive,
  validate(validateProfile),
  userController.updateOwnProfile,
);

router.get(
  "/password",
  requireAuth,
  requireActive,
  userController.showPasswordChange,
);

router.post(
  "/password",
  requireAuth,
  requireActive,
  validate(validatePassword),
  userController.passwordChange,
);

router.get(
  "/manage",
  requireActive,
  requireRole("ADMIN", "MODERATOR"),
  userController.manageUsers,
);

router.post(
  /^\/(\d+)\/activate$/,
  requireActive,
  requireRole("ADMIN", "MODERATOR"),
  userController.activateUser,
);

router.post(
  /^\/(\d+)\/terminate$/,
  requireActive,
  requireRole("ADMIN"),
  userController.terminateUser,
);

router.post(
  /^\/(\d+)\/restore$/,
  requireActive,
  requireRole("ADMIN", "MODERATOR"),
  userController.restoreUser,
);

router.get(
  /^\/(\d+)$/,
  requireActive,
  requireRole("ADMIN", "MODERATOR"),
  userController.showUserLogs,
);

export default router;
