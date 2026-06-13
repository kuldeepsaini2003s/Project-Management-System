import { configureStore } from "@reduxjs/toolkit";
import { api } from "./apiSlice.js";
import uiReducer from "./uiSlice.js";
import authReducer from "./authSlice.js";
import workspaceReducer from "./workspaceSlice.js";
import teamReducer from "./teamSlice.js";
import projectReducer from "./projectSlice.js";
import issueReducer from "./issueSlice.js";

export const store = configureStore({
  reducer: {
    // RTK Query reducer is kept only until every page is migrated to the
    // plain slices below, then it (and apiSlice.js) will be removed.
    [api.reducerPath]: api.reducer,
    ui: uiReducer,
    auth: authReducer,
    workspace: workspaceReducer,
    team: teamReducer,
    project: projectReducer,
    issue: issueReducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});
