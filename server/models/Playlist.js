const mongoose = require("mongoose");

const playlistSongSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      default: "Local audio",
      trim: true,
    },
    album: {
      type: String,
      default: "Unbooked",
      trim: true,
    },
    duration: {
      type: String,
      default: "--:--",
      trim: true,
    },
    filename: {
      type: String,
      default: "",
      trim: true,
    },
    src: {
      type: String,
      default: "",
      trim: true,
    },
    cover: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const playlistSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    coverImage: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    songs: {
      type: [playlistSongSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

playlistSchema.index({ owner: 1, favorite: -1, updatedAt: -1 });

module.exports = mongoose.model("Playlist", playlistSchema);
