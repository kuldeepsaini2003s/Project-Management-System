import { createSlice } from "@reduxjs/toolkit";

const teamSlice = createSlice({
  name: "team",
  initialState: {
    items: [],
    current: null,
    members: [],
    requests: [],
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
  setTeamRequests,
  setTeamLoading,
} = teamSlice.actions;
export default teamSlice.reducer;
