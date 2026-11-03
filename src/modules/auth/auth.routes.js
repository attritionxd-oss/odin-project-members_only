import { Router } from "express";
import { authController } from "./auth.controller.js";

const router = Router();

router.get("/login", authController.showLogin);
router.post("/login", authController.logout);
router.post("/logout", authController.logout);

export default router;
