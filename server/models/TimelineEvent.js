const mongoose = require("mongoose");

const timelineEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    eventDate: {
      type: Date,
      default: null,
    },
    icon: {
      type: String,
      trim: true,
      default: "💖",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("TimelineEvent", timelineEventSchema);
