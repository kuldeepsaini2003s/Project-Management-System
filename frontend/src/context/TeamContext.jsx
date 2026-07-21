import { createContext, useContext, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "./AuthContext.jsx";
import { useWorkspace } from "./WorkspaceContext.jsx";
import { fetchTeams, createTeam as createTeamThunk } from "../redux/actions/teamActions.js";

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const { currentId: workspaceId } = useWorkspace();

  const rawTeams = useSelector((state) => state.team.items);
  const loading = useSelector((state) => state.team.loading);

  const teams = useMemo(() => (Array.isArray(rawTeams) ? rawTeams : []), [rawTeams]);

  useEffect(() => {
    if (isAuthenticated && workspaceId) dispatch(fetchTeams(workspaceId));
  }, [isAuthenticated, workspaceId, dispatch]);

  const value = {
    teams,
    loading: !!workspaceId && loading,
    createTeam: (payload) => dispatch(createTeamThunk(workspaceId, payload)),
    refresh: () => (workspaceId ? dispatch(fetchTeams(workspaceId)) : undefined),
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTeams = () => {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeams must be used within a TeamProvider");
  return ctx;
};
