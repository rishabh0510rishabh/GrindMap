import express from "express";
import { updateUserProfile, getUserProfile } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);

export default router;
