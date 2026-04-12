const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const protect = require("../middleware/authMiddleware");
const {
  getMemories,
  createMemory,
  updateMemory,
  deleteMemory,
} = require("../controllers/memoryController");

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "love-website-memories",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

router.get("/", getMemories);
router.post("/", protect, upload.array("images", 10), createMemory);
router.put("/:id", protect, upload.array("images", 10), updateMemory);
router.delete("/:id", protect, deleteMemory);

module.exports = router;
