import { createContext, useContext, useCallback } from "react";
import { useWorkspace } from "./WorkspaceContext.jsx";
import {
  useGetWorkspaceTeamsQuery,
  useCreateTeamMutation,
} from "../store/apiSlice.js";

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const { currentId: workspaceId } = useWorkspace();

  const { data: teams = [], isLoading, refetch } = useGetWorkspaceTeamsQuery(workspaceId, {
    skip: !workspaceId,
  });
  const [createTeamMut] = useCreateTeamMutation();

  const createTeam = useCallback(
    async (payload) => {
      if (!workspaceId) throw new Error("No workspace selected yet — try reloading.");
      return createTeamMut({ workspaceId, ...payload }).unwrap();
    },
    [createTeamMut, workspaceId]
  );

  const value = {
    teams,
    loading: !!workspaceId && isLoading,
    createTeam,
    refresh: refetch,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTeams = () => {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeams must be used within a TeamProvider");
  return ctx;
};
