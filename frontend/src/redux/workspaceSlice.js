import { createSlice } from "@reduxjs/toolkit";

const workspaceSlice = createSlice({
  name: "workspace",
  initialState: {
    items: [],
    members: [],
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
    setWorkspaceLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setWorkspaces,
  addWorkspace,
  setWorkspaceMembers,
  setWorkspaceLoading,
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
