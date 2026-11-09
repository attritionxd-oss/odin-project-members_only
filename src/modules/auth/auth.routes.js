import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validate } from "#modules/formValidation/validate.js";
import { validateLogin } from "./auth.validation.js";
import { authenticateLogin } from "./auth.middleware.js";

const router = Router();

router.get("/login", authController.showLogin);

router.post(
  "/login",
  validate(validateLogin),
  authController.handleValidation,
  authenticateLogin,
);

router.post("/logout", authController.logout);

export default router;
