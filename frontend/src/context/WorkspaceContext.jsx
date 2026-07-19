import { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { fetchWorkspaces, createWorkspace as createWorkspaceThunk } from "../redux/actions/workspaceActions.js";
import { setCurrentWorkspace } from "../redux/uiSlice.js";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const items = useSelector((state) => state.workspace.items);
  const loading = useSelector((state) => state.workspace.loading);
  const currentId = useSelector((state) => state.ui.currentWorkspaceId);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchWorkspaces());
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!items.length) return;
    if (!currentId || !items.some((w) => w.id === currentId)) {
      dispatch(setCurrentWorkspace(items[0].id));
    }
  }, [items, currentId, dispatch]);

  const current = items.find((w) => w.id === currentId) || null;

  const value = {
    workspaces: items,
    current,
    currentId,
    loading: isAuthenticated && loading,
    switchWorkspace: (id) => dispatch(setCurrentWorkspace(id)),
    createWorkspace: (name) => dispatch(createWorkspaceThunk(name)),
    refresh: () => dispatch(fetchWorkspaces()),
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
};
