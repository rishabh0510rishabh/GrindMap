import express from "express";
import { addFriend, removeFriend, getFriends } from "../controllers/friends.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/add", addFriend);
router.delete("/:friendId", removeFriend);
router.get("/", getFriends);

export default router;