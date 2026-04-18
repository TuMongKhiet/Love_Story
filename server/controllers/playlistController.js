const Playlist = require("../models/Playlist");

function sanitizeSongs(songs = []) {
  if (!Array.isArray(songs)) return [];

  return songs
    .map((song) => ({
      id: String(song.id || "").trim(),
      title: String(song.title || "").trim(),
      artist: String(song.artist || "Local audio").trim(),
      album: String(song.album || "Unbooked").trim(),
      duration: String(song.duration || "--:--").trim(),
      filename: String(song.filename || "").trim(),
      src: String(song.src || "").trim(),
      cover: String(song.cover || "").trim(),
    }))
    .filter((song) => song.title)
    .slice(0, 500);
}

async function getPlaylists(req, res) {
  try {
    const playlists = await Playlist.find().sort({
      favorite: -1,
      updatedAt: -1,
    });

    return res.status(200).json({ playlists });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách playlist.",
      error: error.message,
    });
  }
}

async function createPlaylist(req, res) {
  try {
    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Tên playlist không được để trống." });
    }

    const playlist = await Playlist.create({
      owner: req.user.id,
      name,
      description: String(req.body.description || "").trim(),
      favorite: Boolean(req.body.favorite),
      coverImage: String(req.body.coverImage || "").trim(),
      songs: sanitizeSongs(req.body.songs),
    });

    return res.status(201).json({ message: "Tạo playlist thành công.", playlist });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi tạo playlist.",
      error: error.message,
    });
  }
}

async function updatePlaylist(req, res) {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: "Không tìm thấy playlist." });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
      const name = String(req.body.name || "").trim();
      if (!name) {
        return res.status(400).json({ message: "Tên playlist không hợp lệ." });
      }
      playlist.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
      playlist.description = String(req.body.description || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "favorite")) {
      playlist.favorite = Boolean(req.body.favorite);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "coverImage")) {
      playlist.coverImage = String(req.body.coverImage || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "songs")) {
      playlist.songs = sanitizeSongs(req.body.songs);
    }

    await playlist.save();

    return res.status(200).json({
      message: "Cập nhật playlist thành công.",
      playlist,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi cập nhật playlist.",
      error: error.message,
    });
  }
}

async function deletePlaylist(req, res) {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: "Không tìm thấy playlist để xóa." });
    }

    return res.status(200).json({ message: "Đã xóa playlist thành công." });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi xóa playlist.",
      error: error.message,
    });
  }
}

module.exports = {
  getPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
};
