const mongoose = require("mongoose");
const TimelineEvent = require("../models/TimelineEvent");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizeTimelinePayload(body = {}, { partial = false } = {}) {
  const payload = {};

  if (!partial || Object.prototype.hasOwnProperty.call(body, "title")) {
    payload.title = typeof body.title === "string" ? body.title.trim() : "";
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "description")) {
    payload.description =
      typeof body.description === "string" ? body.description.trim() : "";
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "icon")) {
    payload.icon =
      typeof body.icon === "string" && body.icon.trim()
        ? body.icon.trim()
        : "💖";
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "eventDate")) {
    if (
      body.eventDate === "" ||
      body.eventDate === null ||
      typeof body.eventDate === "undefined"
    ) {
      payload.eventDate = null;
    } else {
      const parsedDate = new Date(body.eventDate);
      if (Number.isNaN(parsedDate.getTime())) {
        const error = new Error("Ngày của timeline không hợp lệ.");
        error.status = 400;
        throw error;
      }
      payload.eventDate = parsedDate;
    }
  }

  return payload;
}

function sortTimelineEvents(events = []) {
  return [...events].sort((a, b) => {
    const aHasDate = !!a.eventDate;
    const bHasDate = !!b.eventDate;

    if (aHasDate && bHasDate) {
      const diff = new Date(a.eventDate) - new Date(b.eventDate);
      if (diff !== 0) return diff;
      return new Date(a.createdAt) - new Date(b.createdAt);
    }

    if (aHasDate !== bHasDate) {
      return aHasDate ? -1 : 1;
    }

    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

const getTimelineEvents = async (req, res) => {
  try {
    const events = await TimelineEvent.find().lean();
    const sortedEvents = sortTimelineEvents(events);

    res.status(200).json(sortedEvents);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy timeline.",
      error: error.message,
    });
  }
};

const createTimelineEvent = async (req, res) => {
  try {
    const payload = normalizeTimelinePayload(req.body);

    const event = await TimelineEvent.create(payload);

    res.status(201).json({
      message: "Thêm mốc thời gian thành công.",
      event,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.status ? error.message : "Lỗi khi tạo timeline.",
      error: error.name || "UnknownError",
    });
  }
};

const updateTimelineEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID timeline không hợp lệ.",
      });
    }

    const payload = normalizeTimelinePayload(req.body, { partial: true });

    if (!Object.keys(payload).length) {
      return res.status(400).json({
        message: "Không có dữ liệu hợp lệ để cập nhật timeline.",
      });
    }

    const updatedEvent = await TimelineEvent.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent) {
      return res.status(404).json({
        message: "Không tìm thấy mốc thời gian cần cập nhật.",
      });
    }

    res.status(200).json({
      message: "Cập nhật mốc thời gian thành công.",
      event: updatedEvent,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.status ? error.message : "Lỗi khi cập nhật timeline.",
      error: error.name || "UnknownError",
    });
  }
};

const deleteTimelineEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "ID timeline không hợp lệ.",
      });
    }

    const deletedEvent = await TimelineEvent.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({
        message: "Không tìm thấy mốc thời gian để xóa.",
      });
    }

    res.status(200).json({
      message: "Xóa mốc thời gian thành công.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa timeline.",
      error: error.message,
    });
  }
};

module.exports = {
  getTimelineEvents,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
};
