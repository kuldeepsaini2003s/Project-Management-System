import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { workspaceService } from "../services/workspaceService.js";
import { useAuth } from "./AuthContext.jsx";

const WorkspaceContext = createContext(null);
const CURRENT_KEY = "linear-current-workspace";

export function WorkspaceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentId, setCurrentId] = useState(
    () => localStorage.getItem(CURRENT_KEY) || null
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await workspaceService.list();
    setWorkspaces(data);
    setCurrentId((prev) => {
      if (prev && data.some((w) => w.id === prev)) return prev;
      return data[0]?.id || null;
    });
    return data;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setCurrentId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [isAuthenticated, load]);

  useEffect(() => {
    if (currentId) localStorage.setItem(CURRENT_KEY, currentId);
  }, [currentId]);

  const switchWorkspace = useCallback((id) => setCurrentId(id), []);

  const createWorkspace = useCallback(async (name) => {
    const ws = await workspaceService.create({ name });
    setWorkspaces((prev) => [...prev, ws]);
    setCurrentId(ws.id);
    return ws;
  }, []);

  const current = workspaces.find((w) => w.id === currentId) || null;

  const value = {
    workspaces,
    current,
    currentId,
    loading,
    switchWorkspace,
    createWorkspace,
    refresh: load,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
};
