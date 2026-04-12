const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getCommentsByMemory,
  createComment,
  deleteComment,
} = require("../controllers/commentController");

router.get("/:memoryId", protect, getCommentsByMemory);
router.post("/:memoryId", protect, createComment);
router.delete("/:commentId", protect, deleteComment);

module.exports = router;
