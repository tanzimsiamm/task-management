import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  create,
  getAll,
} from "./task.controller.js";

const router = Router();

router.post("/", authenticate, create);

export default router;