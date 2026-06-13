import { createSlice } from "@reduxjs/toolkit";
import { CURRENT_WORKSPACE_KEY } from "../utils/constants.js";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    currentWorkspaceId: localStorage.getItem(CURRENT_WORKSPACE_KEY) || null,
  },
  reducers: {
    setCurrentWorkspace(state, action) {
      state.currentWorkspaceId = action.payload;
      if (action.payload) localStorage.setItem(CURRENT_WORKSPACE_KEY, action.payload);
    },
  },
});

export const { setCurrentWorkspace } = uiSlice.actions;
export default uiSlice.reducer;
