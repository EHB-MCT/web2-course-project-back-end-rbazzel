import express from "express";
import { validateBody } from "../middleware/validateBody.js";
import { songSchema } from "../validation/songValidation.js";
import { authMiddleware } from "../middleware/bearerAuth.js";
import {
  addSongToPlaylist,
  getSongsByPlaylist,
  getSongById,
  updateSong,
  removeSongFromPlaylist,
} from "../controllers/songController.js";

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.post("/", validateBody(songSchema), addSongToPlaylist);
router.get("/", getSongsByPlaylist);
router.get("/:songId", getSongById);
router.put("/:songId", validateBody(songSchema), updateSong);
router.delete("/:songId", removeSongFromPlaylist);

export default router;
