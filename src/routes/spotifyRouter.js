import express from "express";
import { authMiddleware } from "../middleware/bearerAuth.js";
import * as spotifyController from "../controllers/spotifyController.js";

const router = express.Router();

router.get("/connect", spotifyController.connect);
router.get("/callback", spotifyController.callback);
// router.get("/playlists", authMiddleware, spotifyController.getPlaylists);
router.post("/refresh", authMiddleware, spotifyController.refreshToken);

export default router;
