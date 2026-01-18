import express from "express";
import { getLeaderboard, getUserRank } from "../controllers/leaderboard.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getLeaderboard);
router.get("/rank", getUserRank);

export default router;