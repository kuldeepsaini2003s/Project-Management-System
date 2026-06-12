import { createContext, useContext, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import {
  useGetWorkspacesQuery,
  useCreateWorkspaceMutation,
} from "../store/apiSlice.js";
import { setCurrentWorkspace } from "../store/uiSlice.js";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const currentId = useSelector((s) => s.ui.currentWorkspaceId);

  const { data: workspaces = [], isLoading, refetch } = useGetWorkspacesQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [createWorkspaceMut] = useCreateWorkspaceMutation();

  // Default to the first workspace when none is selected (or the saved one vanished).
  useEffect(() => {
    if (!workspaces.length) return;
    if (!currentId || !workspaces.some((w) => w.id === currentId)) {
      dispatch(setCurrentWorkspace(workspaces[0].id));
    }
  }, [workspaces, currentId, dispatch]);

  const switchWorkspace = useCallback(
    (id) => dispatch(setCurrentWorkspace(id)),
    [dispatch]
  );

  const createWorkspace = useCallback(
    async (name) => {
      const ws = await createWorkspaceMut({ name }).unwrap();
      dispatch(setCurrentWorkspace(ws.id));
      return ws;
    },
    [createWorkspaceMut, dispatch]
  );

  const current = workspaces.find((w) => w.id === currentId) || null;

  const value = {
    workspaces,
    current,
    currentId,
    loading: isAuthenticated && isLoading,
    switchWorkspace,
    createWorkspace,
    refresh: refetch,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
};
