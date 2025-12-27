const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const formRoutes = require("./routes/formRoutes");
const { initializeDatabase } = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   Security
====================== */
app.use(helmet());

/* ======================
   Rate Limiting (API only)
====================== */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api", limiter);

/* ======================
   Body Parsers
====================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ======================
   Static Frontend
====================== */
app.use(express.static(path.join(__dirname, "public")));

/* ======================
   API Routes
====================== */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", formRoutes);

/* ======================
   Error Handler
====================== */
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

/* ======================
   Start Server
====================== */
initializeDatabase()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🌐 Early access page: http://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to initialize database:", err);
    process.exit(1);
  });
