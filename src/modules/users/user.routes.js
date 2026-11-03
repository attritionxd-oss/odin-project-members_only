import { Router } from "express";
import { userController } from "./user.controller.js";

const router = Router();

router.get("/register", userController.showRegister);

router.post("/register", userController.register);

export default router;
