import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Background from "../components/layout/Background.jsx";
import Button from "../components/ui/Button.jsx";
import FormError from "../components/ui/FormError.jsx";
import ThemeToggle from "../components/ui/ThemeToggle.jsx";
import {
  useGetTeamPublicQuery,
  useGetMyRequestQuery,
  useRequestJoinMutation,
  errMsg,
} from "../redux/apiSlice.js";
import { useTeams } from "../context/TeamContext.jsx";

export default function JoinTeamPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { refresh } = useTeams();

  const { data: team, error: teamErr } = useGetTeamPublicQuery(teamId);
  const { data: mine } = useGetMyRequestQuery(teamId, {
    pollingInterval: 6000,
  });
  const [requestJoin, { isLoading: busy, error: reqErr }] = useRequestJoinMutation();

  const state = mine?.state || "LOADING";

  useEffect(() => {
    if (state === "MEMBER") refresh();
  }, [state, refresh]);

  const request = () => requestJoin(teamId);
  const openTeam = () => navigate(`/teams/${teamId}`);

  const error = (teamErr && errMsg(teamErr)) || (reqErr && errMsg(reqErr)) || "";

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

            {!team && !teamErr && <p className="text-sm text-fg-muted">Loading…</p>}

            {team && (
              <>
                <h1 className="text-xl font-semibold text-fg">{team.name}</h1>
                <p className="mt-1 text-sm text-fg-muted">
                  in {team.workspaceName} · {team.memberCount} member
                  {team.memberCount === 1 ? "" : "s"}
                </p>

                <div className="mt-6">
                  {state === "MEMBER" && <Button onClick={openTeam}>Open team</Button>}
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
