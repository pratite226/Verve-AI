import { io } from "socket.io-client";

let socket = null;

// Lazily created, reused across every page that calls this in the same session — avoids
// opening a second websocket connection every time a page mounts.
export const getSocket = () => {
  const token = localStorage.getItem("bp_token");
  if (!token) return null;

  if (!socket) {
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    socket = io(base.replace(/\/api\/?$/, ""), {
      auth: { token },
      autoConnect: false,
    });
  }

  if (!socket.connected) socket.connect();
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
