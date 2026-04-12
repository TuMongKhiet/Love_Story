const Comment = require("../models/Comment");
const Memory = require("../models/Memory");
const User = require("../models/User");

const getCommentsByMemory = async (req, res) => {
  try {
    const { memoryId } = req.params;

    const comments = await Comment.find({ memory: memoryId })
      .populate("user", "username role")
      .sort({ createdAt: -1 });

    return res.status(200).json(comments);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi lấy bình luận.",
      error: error.message,
    });
  }
};

const createComment = async (req, res) => {
  try {
    const { memoryId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        message: "Nội dung bình luận không được để trống.",
      });
    }

    const memory = await Memory.findById(memoryId);
    if (!memory) {
      return res.status(404).json({
        message: "Không tìm thấy khoảnh khắc để bình luận.",
      });
    }

    let userId = req.user?.id;

    if (!userId && req.user?.username) {
      const foundUser = await User.findOne({ username: req.user.username });
      if (foundUser) {
        userId = foundUser._id;
      }
    }

    if (!userId) {
      return res.status(401).json({
        message: "Không xác định được người dùng bình luận.",
      });
    }

    const comment = await Comment.create({
      memory: memoryId,
      user: userId,
      content: content.trim(),
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "user",
      "username role",
    );

    return res.status(201).json({
      message: "Tạo bình luận thành công.",
      comment: populatedComment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi tạo bình luận.",
      error: error.message,
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId).populate(
      "user",
      "username role",
    );

    if (!comment) {
      return res.status(404).json({
        message: "Không tìm thấy bình luận.",
      });
    }

    const currentUserId = req.user?.id ? String(req.user.id) : null;
    const currentUsername = req.user?.username || null;
    const currentRole = req.user?.role || null;

    const isOwner =
      (comment.user?._id && String(comment.user._id) === currentUserId) ||
      (comment.user?.username && comment.user.username === currentUsername);

    const isAdmin = currentRole === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa bình luận này.",
      });
    }

    await Comment.deleteOne({ _id: comment._id });

    return res.status(200).json({
      message: "Xóa bình luận thành công.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi xóa bình luận.",
      error: error.message,
    });
  }
};

module.exports = {
  getCommentsByMemory,
  createComment,
  deleteComment,
};
