const CoupleProfile = require("../models/CoupleProfile");

const ALLOWED_PROFILE_FIELDS = [
  "quote",
  "loveStartDate",
  "maleHobbies",
  "femaleHobbies",
  "maleMessage",
  "femaleMessage",
];

const getProfile = async (req, res) => {
  try {
    const profile = await CoupleProfile.findOneAndUpdate(
      { siteKey: "main" },
      {
        $setOnInsert: {
          siteKey: "main",
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi lấy hồ sơ.",
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const payload = {};

    for (const key of ALLOWED_PROFILE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        payload[key] = req.body[key];
      }
    }

    const updated = await CoupleProfile.findOneAndUpdate(
      { siteKey: "main" },
      payload,
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json({
      message: "Cập nhật hồ sơ thành công.",
      profile: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi cập nhật hồ sơ.",
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
