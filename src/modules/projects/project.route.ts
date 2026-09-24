import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { create } from "./project.controller.js";

const router = Router();

router.post("/", authenticate, create);

export default router;

