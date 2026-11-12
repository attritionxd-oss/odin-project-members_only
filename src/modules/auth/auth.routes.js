import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validate } from "#modules/formValidation/validate.js";
import { validateLogin } from "./auth.validation.js";
import { authenticateLogin, guestsOnly } from "./auth.middleware.js";

const router = Router();

router.get("/login", guestsOnly, authController.showLogin);

router.post(
  "/login",
  guestsOnly,
  validate(validateLogin),
  authController.handleValidation,
  authenticateLogin,
);

router.post("/logout", authController.logout);

export default router;
