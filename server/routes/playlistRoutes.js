const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
} = require("../controllers/playlistController");

const router = express.Router();

router.get("/", getPlaylists);
router.post("/", protect, protect.requireAdmin, createPlaylist);
router.patch("/:id", protect, protect.requireAdmin, updatePlaylist);
router.delete("/:id", protect, protect.requireAdmin, deletePlaylist);

module.exports = router;
