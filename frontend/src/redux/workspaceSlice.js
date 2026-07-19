import { createSlice } from "@reduxjs/toolkit";

// Guard against malformed API payloads (error bodies, HTML fallbacks, wrapped objects).
const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

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
      state.items = toArray(action.payload);
    },
    addWorkspace: (state, action) => {
      if (!Array.isArray(state.items)) state.items = [];
      if (action.payload) state.items.push(action.payload);
    },
    setWorkspaceMembers: (state, action) => {
      state.members = toArray(action.payload);
    },
    setWorkspaceLabels: (state, action) => {
      state.labels = toArray(action.payload);
    },
    addWorkspaceLabel: (state, action) => {
      if (!Array.isArray(state.labels)) state.labels = [];
      if (!state.labels.some((l) => l.id === action.payload?.id)) {
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
