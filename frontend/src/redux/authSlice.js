import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    loading: true,
    // True while a Google One Tap credential is being exchanged for a
    // session — used to disable the other sign-in buttons meanwhile.
    oneTapInProgress: false,
    // Set when a One Tap sign-in attempt fails, so login/register pages can
    // surface the error instead of silently re-enabling the buttons.
    oneTapError: null,
  },
  reducers: {
    setOneTapInProgress: (state, action) => {
      state.oneTapInProgress = action.payload;
      if (action.payload) state.oneTapError = null;
    },
    setOneTapError: (state, action) => {
      state.oneTapError = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.loading = false;
    },
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.loading = false;
    },
  },
});

export const { setUser, setAuthLoading, clearUser, setOneTapInProgress, setOneTapError } =
  authSlice.actions;
export default authSlice.reducer;
