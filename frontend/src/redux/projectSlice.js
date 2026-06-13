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
    // Optimistic board drag — change just the status of one project.
    patchProjectStatus: (state, action) => {
      const { id, status } = action.payload;
      const apply = (list) => {
        const p = list.find((x) => x.id === id);
        if (p) p.status = status;
      };
      apply(state.teamProjects);
      apply(state.workspaceProjects);
      if (state.current?.id === id) state.current.status = status;
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
  patchProjectStatus,
  setCurrentProject,
  setProjectLoading,
} = projectSlice.actions;
export default projectSlice.reducer;
