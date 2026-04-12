const express = require("express");
const router = express.Router();

router.all("*", (req, res) => {
  return res.status(403).json({
    message:
      "Route reset mat khau da bi tat. Tai khoan editor duoc quan ly bang bien moi truong.",
  });
});

module.exports = router;
