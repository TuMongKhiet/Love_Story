const mongoose = require("mongoose");

const coupleProfileSchema = new mongoose.Schema(
  {
    siteKey: {
      type: String,
      default: "main",
      unique: true,
    },
    maleName: {
      type: String,
      default: "Cao Đoàn Phước Nhật",
      immutable: true,
    },
    femaleName: {
      type: String,
      default: "Quan Bội Bình",
      immutable: true,
    },
    loveStartDate: {
      type: Date,
      default: new Date("2026-03-08T00:00:00"),
    },
    quote: {
      type: String,
      default: "Mọi khoảnh khắc bên em đều là phép màu.",
    },
    maleBirthDate: {
      type: String,
      default: "01/11/2005",
      immutable: true,
    },
    femaleBirthDate: {
      type: String,
      default: "08/02/2004",
      immutable: true,
    },
    maleHobbies: {
      type: String,
      default: "",
    },
    femaleHobbies: {
      type: String,
      default: "",
    },
    maleMessage: {
      type: String,
      default: "",
    },
    femaleMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("CoupleProfile", coupleProfileSchema);
