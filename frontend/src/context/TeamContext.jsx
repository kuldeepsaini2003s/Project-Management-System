import { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useWorkspace } from "./WorkspaceContext.jsx";
import { fetchTeams, createTeam as createTeamThunk } from "../redux/actions/teamActions.js";

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const dispatch = useDispatch();
  const { currentId: workspaceId } = useWorkspace();

  const teams = useSelector((state) => state.team.items);
  const loading = useSelector((state) => state.team.loading);

  useEffect(() => {
    if (workspaceId) dispatch(fetchTeams(workspaceId));
  }, [workspaceId, dispatch]);

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
