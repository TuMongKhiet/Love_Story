const Memory = require("../models/Memory");

const getMemories = async (req, res) => {
  try {
    const memories = await Memory.find().sort({ memoryDate: -1 });
    res.status(200).json(memories);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách khoảnh khắc.",
      error: error.message,
    });
  }
};

const createMemory = async (req, res) => {
  try {
    const { title, description, memoryDate } = req.body;

    if (!title || !memoryDate) {
      return res.status(400).json({
        message: "Thiếu tiêu đề hoặc ngày kỷ niệm.",
      });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path);
    }

    const memory = await Memory.create({
      title,
      description,
      memoryDate,
      images,
    });

    res.status(201).json({
      message: "Tạo khoảnh khắc thành công.",
      memory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi tạo khoảnh khắc.",
      error: error.message,
    });
  }
};

const updateMemory = async (req, res) => {
  try {
    const { title, description, memoryDate } = req.body;
    const memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        message: "Không tìm thấy khoảnh khắc cần sửa.",
      });
    }

    memory.title = title || memory.title;
    memory.description =
      description !== undefined ? description : memory.description;
    memory.memoryDate = memoryDate || memory.memoryDate;

    if (req.files && req.files.length > 0) {
      memory.images = req.files.map((file) => file.path);
    }

    await memory.save();

    res.status(200).json({
      message: "Cập nhật khoảnh khắc thành công.",
      memory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật khoảnh khắc.",
      error: error.message,
    });
  }
};

const deleteMemory = async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        message: "Không tìm thấy khoảnh khắc.",
      });
    }

    await Memory.deleteOne({ _id: memory._id });

    res.status(200).json({
      message: "Xóa khoảnh khắc thành công.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa khoảnh khắc.",
      error: error.message,
    });
  }
};

module.exports = {
  getMemories,
  createMemory,
  updateMemory,
  deleteMemory,
};
