import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  create,
  getAll,
  getOne,
} from "./task.controller.js";

const router = Router();

router.post("/", authenticate, create);
router.get("/:id", authenticate, getOne);

export default router;