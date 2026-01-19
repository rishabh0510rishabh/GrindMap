import express from "express";
import {
  initializeGoalTemplates,
  getGoalTemplates,
  getUserGoals,
  createCustomGoal,
  createGoalFromTemplate,
  updateGoalProgress,
  updateGoal,
  deleteGoal,
  getGoalStats,
  getGoalsNeedingReminders,
  markReminderSent
} from "../controllers/goal.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Initialize goal templates (admin only - should be called once)
router.post("/initialize", initializeGoalTemplates);

// Get goal templates
router.get("/templates", getGoalTemplates);

// Get goals needing reminders (for cron job)
router.get("/reminders", getGoalsNeedingReminders);

// Mark reminder as sent
router.post("/:goalId/reminder-sent", markReminderSent);

// Protected routes (require authentication)
router.use(protect);

// Get user's goals
router.get("/", getUserGoals);

// Get goal statistics
router.get("/stats", getGoalStats);

// Create custom goal
router.post("/custom", createCustomGoal);

// Create goal from template
router.post("/template", createGoalFromTemplate);

// Update goal progress
router.patch("/:goalId/progress", updateGoalProgress);

// Update goal settings
router.patch("/:goalId", updateGoal);

// Delete goal
router.delete("/:goalId", deleteGoal);

export default router;