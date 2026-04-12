const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getTimelineEvents,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
} = require("../controllers/timelineController");

router.get("/", getTimelineEvents);
router.post("/", protect, createTimelineEvent);
router.put("/:id", protect, updateTimelineEvent);
router.patch("/:id", protect, updateTimelineEvent);
router.delete("/:id", protect, deleteTimelineEvent);

module.exports = router;
