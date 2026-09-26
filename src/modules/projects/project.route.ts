import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { create, getAll, getOne } from "./project.controller.js";

const router = Router();

router.post("/", authenticate, create);
router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);

export default router;

