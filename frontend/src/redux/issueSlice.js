import { createSlice } from "@reduxjs/toolkit";

const issueSlice = createSlice({
  name: "issue",
  initialState: {
    teamIssues: [], // board issues for the current team
    projectIssues: [], // board issues for the current project
    myIssues: [], // issues created by the current user
    current: null, // issue being viewed (detail)
    loading: false,
  },
  reducers: {
    setTeamIssues: (state, action) => {
      state.teamIssues = action.payload;
    },
    setProjectIssues: (state, action) => {
      state.projectIssues = action.payload;
    },
    setMyIssues: (state, action) => {
      state.myIssues = action.payload;
    },
    addIssue: (state, action) => {
      state.teamIssues.unshift(action.payload);
      if (action.payload.project) state.projectIssues.unshift(action.payload);
    },
    // Optimistic status change while dragging on the board.
    patchIssueStatus: (state, action) => {
      const { id, status } = action.payload;
      const apply = (list) => {
        const it = list.find((i) => i.id === id);
        if (it) it.status = status;
      };
      apply(state.teamIssues);
      apply(state.projectIssues);
      apply(state.myIssues);
    },
    setCurrentIssue: (state, action) => {
      state.current = action.payload;
    },
    setIssueLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setTeamIssues,
  setProjectIssues,
  setMyIssues,
  addIssue,
  patchIssueStatus,
  setCurrentIssue,
  setIssueLoading,
} = issueSlice.actions;
export default issueSlice.reducer;
