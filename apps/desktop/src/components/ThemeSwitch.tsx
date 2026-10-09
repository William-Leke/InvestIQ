import { useTheme } from "../theme/ThemeProvider";

/** Header switch between dark and light. Once used, the app stops following the system setting. */
export function ThemeSwitch() {
  const { mode, setAppearance } = useTheme();
  const light = mode === "light";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={light}
      aria-label="Light mode"
      title={light ? "Switch to dark mode" : "Switch to light mode"}
      onClick={() => setAppearance((a) => ({ ...a, mode: light ? "dark" : "light" }))}
      className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-cell py-1 pr-1 pl-3 text-xs font-semibold text-muted hover:text-fg"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <span className="hidden sm:inline">Light mode</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${light ? "bg-accent" : "bg-line-2"}`} aria-hidden="true">
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-fg transition-transform ${light ? "translate-x-4 bg-on-accent" : ""}`} />
      </span>
    </button>
  );
}
