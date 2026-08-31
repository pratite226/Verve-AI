import { useTheme } from "../context/ThemeContext.jsx";

// The icon/label depend on client-only state (see ThemeContext's getInitialTheme) so they can
// legitimately differ between the server-rendered markup (always "dark", no document to read)
// and the first client render on the SSR'd Landing page — suppressHydrationWarning tells React
// that's expected instead of logging a mismatch warning for it.
//
// The glyph shows the mode you will GET by clicking, not the current one: ☀ while dark (click
// to go light), ☾ while light (click to go dark) — same logic drives the "Light"/"Dark" label.
const ThemeToggle = ({ variant = "pill", className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const glyph = isDark ? "☀" : "☾";
  const label = isDark ? "Light" : "Dark";
  const a11yLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={a11yLabel}
        title={a11yLabel}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-bd-2 text-muted transition-colors duration-150 hover:border-accent hover:text-accent ${className}`}
      >
        <span aria-hidden="true" suppressHydrationWarning>
          {glyph}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={a11yLabel}
      title={a11yLabel}
      className={`verve-chip ${className}`}
    >
      <span aria-hidden="true" suppressHydrationWarning>
        {glyph}
      </span>
      <span suppressHydrationWarning>{label}</span>
    </button>
  );
};

export default ThemeToggle;
