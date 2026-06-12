import { configureStore } from "@reduxjs/toolkit";
import { api } from "./apiSlice.js";
import uiReducer from "./uiSlice.js";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    ui: uiReducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});
