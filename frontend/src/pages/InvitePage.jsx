import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2, Users, AlertCircle } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout.jsx";
import Button from "../components/ui/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useGetInviteQuery, useAcceptInviteMutation, errMsg } from "../redux/apiSlice.js";

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: invite, isLoading, isError } = useGetInviteQuery(token);
  const [acceptInvite] = useAcceptInviteMutation();

  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (authLoading || isLoading) return;
    if (!isAuthenticated || tried) return;
    if (!invite || invite.status !== "PENDING") return;

    setTried(true);
    setAccepting(true);
    acceptInvite(token)
      .unwrap()
      .then((res) => navigate(`/teams/${res.teamId}`, { replace: true }))
      .catch((err) => {
        setError(errMsg(err));
        setAccepting(false);
      });
  }, [authLoading, isLoading, isAuthenticated, invite, tried, acceptInvite, token, navigate]);

  if (isLoading || authLoading) {
    return (
      <AuthLayout title="Loading invitation…">
        <div className="flex justify-center py-6 text-fg-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AuthLayout>
    );
  }

  if (isError || !invite) {
    return (
      <AuthLayout title="Invitation not found">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <AlertCircle className="h-8 w-8 text-danger" />
          <p className="text-sm text-fg-muted">
            This invite link is invalid. Ask your admin to send a new invitation.
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (invite.status === "EXPIRED" || invite.status === "REVOKED") {
    return (
      <AuthLayout title="Invitation expired">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <AlertCircle className="h-8 w-8 text-warning" />
          <p className="text-sm text-fg-muted">
            This invitation to join <strong>{invite.team?.name}</strong> is no longer valid. Ask
            for a fresh invite link.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const teamName = invite.team?.name || "the team";

  if (isAuthenticated) {
    return (
      <AuthLayout title={`Join ${teamName}`}>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          {error ? (
            <>
              <AlertCircle className="h-8 w-8 text-danger" />
              <p className="text-sm text-danger">{error}</p>
              <Button
                className="!w-auto px-4"
                onClick={() => {
                  setError("");
                  setTried(false);
                }}
              >
                Try again
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
              <p className="text-sm text-fg-muted">Joining {teamName}…</p>
            </>
          )}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={`Join ${teamName}`}
      subtitle={`You've been invited to collaborate on ${teamName}.`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center gap-2 rounded-lg border border-glass-border py-3 text-sm text-fg-muted">
          <Users className="h-4 w-4" />
          Invitation for {invite.email}
        </div>
        <Button onClick={() => navigate("/login", { state: { from: location } })}>
          Log in to accept
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/register", { state: { from: location } })}
        >
          Create an account
        </Button>
      </div>
    </AuthLayout>
  );
}
