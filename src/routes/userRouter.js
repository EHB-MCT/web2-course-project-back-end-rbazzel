import express from "express";
import * as userRouter from "../controllers/userController.js";
import { authMiddleware } from "../middleware/bearerAuth.js";
import { validateBody } from "../middleware/validateBody.js";
import { loginSchema, signupSchema } from "../validation/userValidation.js";

const router = express.Router();

router.post("/signup", validateBody(signupSchema), userRouter.signup);
router.post("/login", validateBody(loginSchema), userRouter.login);
router.get("/:id", authMiddleware, userRouter.getUser);
router.put("/:id", authMiddleware, userRouter.updateUser);
router.delete("/:id", authMiddleware, userRouter.deleteUser);

export default router;
