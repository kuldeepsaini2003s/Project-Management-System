import { createSlice } from "@reduxjs/toolkit";

const teamSlice = createSlice({
  name: "team",
  initialState: {
    items: [], // teams in the sidebar (current workspace)
    current: null, // team being viewed
    members: [], // members of the current team
    labels: [], // labels of the current team
    requests: [], // pending join requests of the current team
    loading: false,
  },
  reducers: {
    setTeams: (state, action) => {
      state.items = action.payload;
    },
    addTeam: (state, action) => {
      state.items.push(action.payload);
    },
    setCurrentTeam: (state, action) => {
      state.current = action.payload;
    },
    setTeamMembers: (state, action) => {
      state.members = action.payload;
    },
    setTeamLabels: (state, action) => {
      state.labels = action.payload;
    },
    addTeamLabel: (state, action) => {
      if (!state.labels.some((l) => l.id === action.payload.id)) {
        state.labels.push(action.payload);
      }
    },
    setTeamRequests: (state, action) => {
      state.requests = action.payload;
    },
    setTeamLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setTeams,
  addTeam,
  setCurrentTeam,
  setTeamMembers,
  setTeamLabels,
  addTeamLabel,
  setTeamRequests,
  setTeamLoading,
} = teamSlice.actions;
export default teamSlice.reducer;
