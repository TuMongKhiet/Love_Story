const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://127.0.0.1:5500",
  "http://localhost:5500",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS blocked for this origin."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.status(200).send("Love Website V2 API is running...");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/memories", require("./routes/memoryRoutes"));
app.use("/api/timeline", require("./routes/timelineRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));

// Khong mount passwordRoutes vi login dang duoc quan ly bang bien moi truong.
// Neu ban mount route reset password cu, no vua khong an toan vua khong doi duoc mat khau dang nhap that.

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
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
