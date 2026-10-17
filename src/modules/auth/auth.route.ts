import { Router } from "express";
import { getMe, login, logoutController, refreshTokenController, register } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/authorize.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.get(
  "/admin-test",
  authenticate,
  authorize("ADMIN"),
  (_req, res) => {
    res.json({
      success: true,
      message: "Admin access granted",
    });
  }
);
router.post("/refresh", refreshTokenController);
router.post("/logout", logoutController);
export default router;
