import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { create, getAll } from "./project.controller.js";

const router = Router();

router.post("/", authenticate, create);
router.get("/", authenticate, getAll);

export default router;

