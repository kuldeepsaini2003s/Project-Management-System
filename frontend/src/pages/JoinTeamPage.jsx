import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Background from "../components/layout/Background.jsx";
import Button from "../components/ui/Button.jsx";
import FormError from "../components/ui/FormError.jsx";
import ThemeToggle from "../components/ui/ThemeToggle.jsx";
import usePolling from "../hooks/usePolling.js";
import { teamService } from "../services/teamService.js";
import { useTeams } from "../context/TeamContext.jsx";

export default function JoinTeamPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { refresh } = useTeams();

  const [team, setTeam] = useState(null);
  const [state, setState] = useState("LOADING"); // LOADING|NONE|PENDING|REJECTED|MEMBER|ERROR
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pub, mine] = await Promise.all([
          teamService.getPublic(teamId),
          teamService.myRequest(teamId),
        ]);
        setTeam(pub);
        setState(mine.state);
      } catch (err) {
        setError(err.message);
        setState("ERROR");
      }
    })();
  }, [teamId]);

  // While a request is pending, poll for the admin's decision.
  usePolling(async () => {
    try {
      const mine = await teamService.myRequest(teamId);
      setState(mine.state);
      if (mine.state === "MEMBER") refresh();
    } catch {
      /* ignore */
    }
  }, 6000, state === "PENDING");

  const request = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await teamService.requestJoin(teamId);
      setState(res.status); // PENDING
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openTeam = async () => {
    await refresh();
    navigate(`/teams/${teamId}`);
  };

  return (
    <>
      <Background />
      <div className="flex min-h-screen flex-col">
        <header className="flex justify-end p-5">
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-5 pb-20">
          <div className="glass-strong w-full max-w-md rounded-xl p-8 text-center">
            <FormError message={error} />

            {team && (
              <span
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: (team.color || "#5e6ad2") + "22" }}
              >
                {team.icon || team.key?.[0] || "T"}
              </span>
            )}

            {state === "LOADING" && <p className="text-sm text-fg-muted">Loading…</p>}

            {team && state !== "LOADING" && state !== "ERROR" && (
              <>
                <h1 className="text-xl font-semibold text-fg">{team.name}</h1>
                <p className="mt-1 text-sm text-fg-muted">
                  in {team.workspaceName} · {team.memberCount} member
                  {team.memberCount === 1 ? "" : "s"}
                </p>

                <div className="mt-6">
                  {state === "MEMBER" && (
                    <Button onClick={openTeam}>Open team</Button>
                  )}
                  {state === "PENDING" && (
                    <p className="rounded-md border border-glass-border px-4 py-3 text-sm text-fg-muted">
                      Your request is pending approval from a team admin.
                    </p>
                  )}
                  {(state === "NONE" || state === "REJECTED") && (
                    <>
                      {state === "REJECTED" && (
                        <p className="mb-3 text-sm text-fg-muted">
                          Your previous request was declined. You can ask again.
                        </p>
                      )}
                      <Button onClick={request} isLoading={busy}>
                        Request to join
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
