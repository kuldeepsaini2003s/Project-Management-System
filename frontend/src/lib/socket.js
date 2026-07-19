import { io } from "socket.io-client";
import { SOCKET_URL, TOKEN_KEY } from "../utils/constants.js";

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }
  socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
