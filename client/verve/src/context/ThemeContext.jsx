import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "verve.theme";

// Reads whatever theme the bootstrap script in index.html already applied to <html> before
// React ever mounted (localStorage → OS prefers-color-scheme → dark) — using that as the
// initial state means there's no second, visible theme flip right after hydration. Falls
// back to "dark" when there's no `document` (SSR): entry-server.jsx only ever renders the
// static Landing route for the very first request, and any node that reads theme there
// carries `suppressHydrationWarning` for exactly this server/client gap — see ThemeToggle.jsx.
const getInitialTheme = () => {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};
