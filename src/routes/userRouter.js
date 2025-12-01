import express from "express";
import {
  signup,
  login,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateBody.js";
import { loginSchema, signupSchema } from "../validation/userValidation.js";

const router = express.Router();

router.post("/signup", validateBody(signupSchema), signup);
router.post("/login", validateBody(loginSchema), login);
router.get("/:id", authMiddleware, getUser);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, deleteUser);

export default router;
