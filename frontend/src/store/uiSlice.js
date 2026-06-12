import { createSlice } from "@reduxjs/toolkit";

const CURRENT_KEY = "linear-current-workspace";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    currentWorkspaceId: localStorage.getItem(CURRENT_KEY) || null,
  },
  reducers: {
    setCurrentWorkspace(state, action) {
      state.currentWorkspaceId = action.payload;
      if (action.payload) localStorage.setItem(CURRENT_KEY, action.payload);
    },
  },
});

export const { setCurrentWorkspace } = uiSlice.actions;
export default uiSlice.reducer;
