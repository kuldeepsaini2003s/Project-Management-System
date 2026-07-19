import { Navigate, useOutletContext } from "react-router-dom";
import { Users } from "lucide-react";
import { useTeams } from "../context/TeamContext.jsx";
import ComingSoon from "./ComingSoon.jsx";
import FullScreenLoader from "../components/common/FullScreenLoader.jsx";

export default function HomeRedirect() {
  const { teams, loading } = useTeams();
  useOutletContext();

  if (loading) return <FullScreenLoader />;
  if (teams.length > 0) {
    return <Navigate to={`/teams/${teams[0].id}/issues`} replace />;
  }
  return <ComingSoon title="Create a team to get started" icon={Users} />;
}
