import { createSlice } from "@reduxjs/toolkit";

const workspaceSlice = createSlice({
  name: "workspace",
  initialState: {
    items: [],
    members: [],
    labels: [],
    loading: false,
  },
  reducers: {
    setWorkspaces: (state, action) => {
      state.items = action.payload;
    },
    addWorkspace: (state, action) => {
      state.items.push(action.payload);
    },
    setWorkspaceMembers: (state, action) => {
      state.members = action.payload;
    },
    setWorkspaceLabels: (state, action) => {
      state.labels = action.payload;
    },
    addWorkspaceLabel: (state, action) => {
      if (!state.labels.some((l) => l.id === action.payload.id)) {
        state.labels.push(action.payload);
      }
    },
    setWorkspaceLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setWorkspaces,
  addWorkspace,
  setWorkspaceMembers,
  setWorkspaceLabels,
  addWorkspaceLabel,
  setWorkspaceLoading,
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
