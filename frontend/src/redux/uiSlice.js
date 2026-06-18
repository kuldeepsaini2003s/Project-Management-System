import { createSlice } from "@reduxjs/toolkit";
import { CURRENT_WORKSPACE_KEY, SIDEBAR_PREFS_KEY } from "../utils/constants.js";

const DEFAULT_PREFS = {
  inbox: true,
  myIssues: true,
  projects: true,
  members: false,
  teams: false,
};

const loadPrefs = () => {
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem(SIDEBAR_PREFS_KEY)) || {}) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    currentWorkspaceId: localStorage.getItem(CURRENT_WORKSPACE_KEY) || null,
    sidebarPrefs: loadPrefs(),
  },
  reducers: {
    setCurrentWorkspace(state, action) {
      state.currentWorkspaceId = action.payload;
      if (action.payload) localStorage.setItem(CURRENT_WORKSPACE_KEY, action.payload);
    },
    setSidebarPref(state, action) {
      const { key, value } = action.payload;
      state.sidebarPrefs[key] = value;
      localStorage.setItem(SIDEBAR_PREFS_KEY, JSON.stringify(state.sidebarPrefs));
    },
  },
});

export const { setCurrentWorkspace, setSidebarPref } = uiSlice.actions;
export default uiSlice.reducer;
