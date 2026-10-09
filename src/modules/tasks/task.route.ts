import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  create,
  getAll,
  getOne,
  remove,
  update,
} from "./task.controller.js";

const router = Router();

router.post("/", authenticate, create);
router.get("/:id", authenticate, getOne);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, remove);

export default router;