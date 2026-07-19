import { useParams, Link } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import Logo from "../components/ui/Logo.jsx";
import ThemeToggle from "../components/ui/ThemeToggle.jsx";
import GitPersonaCard from "../components/git-persona/GitPersonaCard.jsx";
import { useGetPublicGitPersonaCardQuery } from "../redux/apiSlice.js";

/**
 * Public, unauthenticated shareable page for a GitPersona developer card —
 * e.g. https://app.example.com/dev/octocat. Anyone with the link can view it.
 */
export default function PublicDevProfilePage() {
  const { login } = useParams();
  const { data: card, isLoading, error } = useGetPublicGitPersonaCardQuery(login);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <div className="app-backdrop">
        <div className="blob" />
      </div>

      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 justify-center px-5 py-8">
        <div className="w-full max-w-2xl">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-fg-muted" />
            </div>
          ) : error ? (
            <div className="glass-card flex flex-col items-center gap-2 rounded-xl px-6 py-16 text-center">
              <AlertCircle className="h-6 w-6 text-fg-subtle" />
              <p className="text-sm font-medium text-fg">This developer card isn't available</p>
              <p className="text-xs text-fg-muted">
                It may be private, or @{login} hasn't generated one yet.
              </p>
              <Link to="/" className="mt-2 text-xs font-medium text-brand hover:underline">
                Go to the app
              </Link>
            </div>
          ) : (
            <GitPersonaCard card={card} avatarUrl={card?.avatarUrl} name={card?.githubLogin} readOnly />
          )}
        </div>
      </main>

      <footer className="px-5 py-6 text-center text-xs text-fg-subtle">
        Built with GitPersona — connect your own GitHub at{" "}
        <Link to="/" className="font-medium text-brand hover:underline">
          the app
        </Link>
        .
      </footer>
    </div>
  );
}
