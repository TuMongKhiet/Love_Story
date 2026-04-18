const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

const register = async (req, res) => {
  return res.status(403).json({
    message: "Website nay khong cho phep tu dang ky tai khoan.",
  });
};

const login = async (req, res) => {
  try {
    const editorUsername = (process.env.EDITOR_USERNAME || "").trim();
    const editorPassword = process.env.EDITOR_PASSWORD || "";
    const jwtSecret = process.env.JWT_SECRET || "";

    if (!editorUsername || !editorPassword || !jwtSecret) {
      return res.status(500).json({
        message: "Thieu cau hinh dang nhap hoac JWT_SECRET trong bien moi truong.",
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Vui long nhap day du tai khoan va mat khau.",
      });
    }

    if (username !== editorUsername || password !== editorPassword) {
      return res.status(401).json({
        message: "Sai tai khoan hoac mat khau.",
      });
    }

    let user = await User.findOne({ username: editorUsername });

    if (!user) {
      const hashedPassword = await bcrypt.hash(`${editorPassword}|${jwtSecret}`, 10);
      user = await User.create({
        username: editorUsername,
        password: hashedPassword,
        role: "admin",
      });
    } else if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Dang nhap thanh cong.",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Loi server khi dang nhap.",
      error: error.message,
    });
  }
};

const me = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(200).json({ loggedIn: false, user: null });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return res.status(200).json({
      loggedIn: true,
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      },
    });
  } catch (error) {
    return res.status(401).json({
      loggedIn: false,
      user: null,
      message: "Token không hợp lệ.",
    });
  }
};

module.exports = {
  register,
  login,
  me,
};
