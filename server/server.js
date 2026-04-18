const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for this origin."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.status(200).send("Love Website API is running...");
});

function safeMount(routePath, mountPath) {
  const absoluteRoutePath = path.join(__dirname, routePath);
  if (!fs.existsSync(`${absoluteRoutePath}.js`) && !fs.existsSync(absoluteRoutePath)) {
    console.warn(`Skip missing route: ${routePath}`);
    return;
  }
  app.use(mountPath, require(routePath));
}

safeMount("./routes/authRoutes", "/api/auth");
safeMount("./routes/profileRoutes", "/api/profile");
safeMount("./routes/playlistRoutes", "/api/playlists");
safeMount("./routes/memoryRoutes", "/api/memories");
safeMount("./routes/timelineRoutes", "/api/timeline");
safeMount("./routes/commentRoutes", "/api/comments");

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(err.status || 500).json({
    message: err.message || "Loi server.",
    error: err.name || "UnknownError",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
