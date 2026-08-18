const multer = require("multer");

// Centralized error handler — the last middleware in the chain (server.js), catches
// anything a route handler passes to next(err) instead of each controller needing its own
// fallback. Controllers that already send their own try/catch response never reach this.
module.exports = (err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof multer.MulterError || /^Only .* images are allowed$/.test(err.message)) {
    return res.status(400).json({ success: false, message: err.message });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
};
