import { createSlice } from "@reduxjs/toolkit";

const projectSlice = createSlice({
  name: "project",
  initialState: {
    teamProjects: [],
    workspaceProjects: [],
    current: null,
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
    reorderBoard: (state, action) => {
      const { board, status, orderedIds } = action.payload;
      const list = state[board];
      if (!list) return;
      orderedIds.forEach((id, i) => {
        const p = list.find((x) => x.id === id);
        if (p) {
          p.status = status;
          p.sortOrder = i;
        }
      });
      const targetItems = orderedIds.map((id) => list.find((x) => x.id === id)).filter(Boolean);
      let ti = 0;
      state[board] = list.map((p) => (p.status === status ? targetItems[ti++] || p : p));
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
  reorderBoard,
  setCurrentProject,
  setProjectLoading,
} = projectSlice.actions;
export default projectSlice.reducer;
