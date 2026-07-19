import { createSlice } from "@reduxjs/toolkit";

// API payloads can arrive malformed (error body, HTML fallback, wrapped object).
// Never let a non-array reach the store — components call .map() on these.
const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

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
      state.items = toArray(action.payload);
    },
    addTeam: (state, action) => {
      if (!Array.isArray(state.items)) state.items = [];
      if (action.payload) state.items.push(action.payload);
    },
    setCurrentTeam: (state, action) => {
      state.current = action.payload;
    },
    setTeamMembers: (state, action) => {
      state.members = toArray(action.payload);
    },
    setTeamRequests: (state, action) => {
      state.requests = toArray(action.payload);
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
