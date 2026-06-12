import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { teamService } from "../services/teamService.js";
import { useWorkspace } from "./WorkspaceContext.jsx";

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const { currentId: workspaceId } = useWorkspace();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!workspaceId) {
      setTeams([]);
      setLoading(false);
      return [];
    }
    setLoading(true);
    try {
      const data = await teamService.listForWorkspace(workspaceId);
      setTeams(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  const createTeam = useCallback(
    async (payload) => {
      if (!workspaceId) throw new Error("No workspace selected yet — try reloading.");
      const team = await teamService.create(workspaceId, payload);
      setTeams((prev) => [...prev, team]);
      return team;
    },
    [workspaceId]
  );

  const value = { teams, loading, createTeam, refresh: load };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTeams = () => {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeams must be used within a TeamProvider");
  return ctx;
};
