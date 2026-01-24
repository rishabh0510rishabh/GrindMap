import express from "express";
import GrindRoomController from "../controllers/grindRoom.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/rooms/create
 * @desc    Create a new Grind Room
 */
router.post("/create", GrindRoomController.createRoom);

/**
 * @route   POST /api/rooms/join/:code
 * @desc    Join a room via invite code
 */
router.post("/join/:code", GrindRoomController.joinRoom);

/**
 * @route   GET /api/rooms/:id/stats
 * @desc    Get real-time room session stats
 */
router.get("/:id/stats", GrindRoomController.getRoomStats);

/**
 * @route   POST /api/rooms/:id/leave
 * @desc    Leave a Grind Room
 */
router.post("/:id/leave", GrindRoomController.leaveRoom);

export default router;
