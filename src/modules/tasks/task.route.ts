import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  create,
  getOne,
  remove,
  update,
} from "./task.controller.js";

const router = Router();

router.post("/", authenticate, create);
router.get("/:id", authenticate, getOne);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, remove);
router.delete("/:id", authenticate, remove);

export default router;