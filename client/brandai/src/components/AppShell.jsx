import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/content-studio", label: "Content Studio" },
  { to: "/planner", label: "Weekly Planner" },
  { to: "/profile-makeover", label: "Profile Makeover" },
  { to: "/canvas", label: "Canvas" },
  { to: "/settings", label: "Settings" },
];

const AppShell = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="grid min-h-screen grid-cols-[246px_1fr] font-body">
      <aside className="sticky top-0 flex h-screen flex-col justify-between border-r border-line bg-paper-raised px-5 py-6">
        <div>
          <div className="flex items-baseline gap-2 px-2.5 pb-6">
            <span className="font-display text-base font-extrabold tracking-tight">BRANDPILOT</span>
            <span className="font-mono text-[9px] tracking-[0.22em] text-muted">AI</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item, i) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded px-3 py-3 text-sm font-medium transition-colors duration-150 ${
                    isActive ? "bg-[#16180F] text-ink" : "text-muted hover:bg-paper hover:text-ink"
                  }`}
                >
                  <span
                    className="font-mono text-[9px] tracking-[0.16em]"
                    style={{ color: isActive ? "var(--color-cobalt)" : "#3A3A3E" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-line pt-4">
          <div className="text-sm font-semibold">{user?.name || "Account"}</div>
          <div className="mt-0.5 text-xs text-muted">{user?.email}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
};

export default AppShell;
