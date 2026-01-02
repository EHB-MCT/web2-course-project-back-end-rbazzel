import express from "express";
import { validateBody } from "../middleware/validateBody.js";
import { playlistSchema } from "../validation/playlistValidation.js";
import { authMiddleware } from "../middleware/bearerAuth.js";
import {
  createPlaylist,
  getPlaylistById,
  getPlaylistsByUser,
  updatePlaylist,
  deletePlaylist,
} from "../controllers/playlistController.js";

const router = express.Router();

router.post("/", authMiddleware, validateBody(playlistSchema), createPlaylist);
router.get("/", authMiddleware, getPlaylistsByUser);
router.get("/:id", authMiddleware, getPlaylistById);
router.put(
  "/:id",
  authMiddleware,
  validateBody(playlistSchema),
  updatePlaylist
);
router.delete("/:id", authMiddleware, deletePlaylist);

export default router;
