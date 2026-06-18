import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    items: [],
    unread: 0,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload;
    },
    setUnread: (state, action) => {
      state.unread = action.payload;
    },
    addNotification: (state, action) => {
      // Avoid duplicates if the REST fetch and socket race.
      if (!state.items.some((n) => n.id === action.payload.id)) {
        state.items.unshift(action.payload);
        if (!action.payload.read) state.unread += 1;
      }
    },
    markOneRead: (state, action) => {
      const n = state.items.find((x) => x.id === action.payload);
      if (n && !n.read) {
        n.read = true;
        state.unread = Math.max(0, state.unread - 1);
      }
    },
    markAllRead: (state) => {
      state.items.forEach((n) => (n.read = true));
      state.unread = 0;
    },
    resetNotifications: (state) => {
      state.items = [];
      state.unread = 0;
    },
  },
});

export const {
  setNotifications,
  setUnread,
  addNotification,
  markOneRead,
  markAllRead,
  resetNotifications,
} = notificationSlice.actions;
export default notificationSlice.reducer;
