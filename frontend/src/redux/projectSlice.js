import { createSlice } from "@reduxjs/toolkit";

const projectSlice = createSlice({
  name: "project",
  initialState: {
    teamProjects: [], // projects of the current team
    workspaceProjects: [], // projects across the whole workspace
    current: null, // project being viewed
    loading: false,
  },
  reducers: {
    setTeamProjects: (state, action) => {
      state.teamProjects = action.payload;
    },
    setWorkspaceProjects: (state, action) => {
      state.workspaceProjects = action.payload;
    },
    addProject: (state, action) => {
      state.teamProjects.unshift(action.payload);
      state.workspaceProjects.unshift(action.payload);
    },
    updateProjectInStore: (state, action) => {
      const update = (list) => {
        const i = list.findIndex((p) => p.id === action.payload.id);
        if (i !== -1) list[i] = action.payload;
      };
      update(state.teamProjects);
      update(state.workspaceProjects);
      if (state.current?.id === action.payload.id) state.current = action.payload;
    },
    removeProjectFromStore: (state, action) => {
      const id = action.payload;
      state.teamProjects = state.teamProjects.filter((p) => p.id !== id);
      state.workspaceProjects = state.workspaceProjects.filter((p) => p.id !== id);
    },
    setCurrentProject: (state, action) => {
      state.current = action.payload;
    },
    setProjectLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setTeamProjects,
  setWorkspaceProjects,
  addProject,
  updateProjectInStore,
  removeProjectFromStore,
  setCurrentProject,
  setProjectLoading,
} = projectSlice.actions;
export default projectSlice.reducer;
