const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    memory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Memory",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Comment", commentSchema);
