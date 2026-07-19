import { createSlice } from "@reduxjs/toolkit";

const issueSlice = createSlice({
  name: "issue",
  initialState: {
    teamIssues: [],
    projectIssues: [],
    myIssues: [],
    current: null,
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
    reorderBoard: (state, action) => {
      const { board, status, orderedIds } = action.payload;
      const list = state[board];
      if (!list) return;
      orderedIds.forEach((id, i) => {
        const it = list.find((x) => x.id === id);
        if (it) {
          it.status = status;
          it.sortOrder = i;
        }
      });
      const targetItems = orderedIds.map((id) => list.find((x) => x.id === id)).filter(Boolean);
      let ti = 0;
      state[board] = list.map((it) => (it.status === status ? targetItems[ti++] || it : it));
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
  reorderBoard,
  setCurrentIssue,
  setIssueLoading,
} = issueSlice.actions;
export default issueSlice.reducer;
