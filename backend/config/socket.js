import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import { env } from "./env.js";

let io = null;

// Attach Socket.IO to the HTTP server and authenticate each connection via JWT.
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = verifyToken(token);
      socket.userId = decoded.sub;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    // Each user gets a private room so we can push notifications to them.
    socket.join(`user:${socket.userId}`);
    console.log(`[socket] connected user=${socket.userId} id=${socket.id}`);
    socket.on("disconnect", (reason) =>
      console.log(`[socket] disconnected user=${socket.userId} (${reason})`)
    );
  });

  io.on("connection_error", (err) => console.warn("[socket] connection_error:", err.message));

  console.log("[socket] Socket.IO ready");
  return io;
};

// Push an event to a single user across all their open tabs.
export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  const room = `user:${userId}`;
  const clients = io.sockets.adapter.rooms.get(room)?.size || 0;
  io.to(room).emit(event, payload);
  console.log(`[socket] emit "${event}" -> ${room} (online clients: ${clients})`);
};
