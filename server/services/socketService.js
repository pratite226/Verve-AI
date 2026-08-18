const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

// Authenticates the socket handshake with the same JWT used for REST requests (reuses
// jsonwebtoken.verify — no separate auth system for sockets), then joins a per-user room
// so events can be addressed to "this user, on any open tab" without tracking socket ids.
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  return io;
};

// Called from controllers after a mutation (contentController, billingController) — a
// no-op before initSocket runs or if sockets are never initialized (e.g. in tests).
const emitToUser = (userId, event, payload) => {
  io?.to(`user:${userId}`).emit(event, payload);
};

module.exports = { initSocket, emitToUser };
