import Logo from "../ui/Logo.jsx";
import ThemeToggle from "../ui/ThemeToggle.jsx";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-fg-muted">{subtitle}</p>
            )}
          </div>

          {children}

          {footer && (
            <div className="mt-6 text-center text-sm text-fg-muted">
              {footer}
            </div>
          )}
        </div>
      </main>

      <footer className="px-5 py-6 text-center text-xs text-fg-subtle font-semibold">
        Made with ❤️ by Algofolks{" "}
        <br />
        <p
          href="#"
          className="underline-offset-2 hover:text-fg-muted hover:underline"
        >
          Engineered by Heart, Developed with Passion.
        </p>        
      </footer>
    </div>
  );
}
