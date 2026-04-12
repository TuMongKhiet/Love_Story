const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

router.get("/", getProfile);
router.put("/", protect, updateProfile);

module.exports = router;
