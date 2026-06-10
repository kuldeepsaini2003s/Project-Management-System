import Logo from "../components/ui/Logo.jsx";
import ThemeToggle from "../components/ui/ThemeToggle.jsx";
import Button from "../components/ui/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Temporary authenticated landing — replaced by the app shell (sidebar +
// Inbox / Projects / Issues / Teams) in the next step.
export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden items-center gap-2 sm:flex">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-fg">
                {user?.name?.[0]?.toUpperCase() || "?"}
              </span>
            )}
            <span className="text-sm text-fg">{user?.name}</span>
          </div>
          <div className="w-auto">
            <Button variant="secondary" size="md" onClick={logout} className="!w-auto px-3">
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 text-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Welcome, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="mt-2 text-sm text-fg-muted">
            You're signed in via {user?.provider === "GOOGLE" ? "Google" : "email"}.
            Inbox, Projects, Issues and Teams come next.
          </p>
        </div>
      </main>
    </div>
  );
}
