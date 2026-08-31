import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/content-studio", label: "Content Studio" },
  { to: "/planner", label: "Weekly Planner" },
  { to: "/profile-makeover", label: "Profile Makeover" },
  { to: "/canvas", label: "Canvas" },
  { to: "/settings", label: "Settings" },
];

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[246px_1fr]">
      <aside className="sticky top-0 z-30 flex h-auto flex-col justify-between border-b border-hair bg-panel px-5 py-5 lg:h-screen lg:border-b-0 lg:border-r lg:py-[26px]">
        <div>
          <Link to="/dashboard" className="mb-6 flex px-2.5">
            <Logo size={24} />
          </Link>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item, i) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-active={isActive}
                  className="verve-nav-item"
                >
                  <span className="verve-nav-item-index">{String(i + 1).padStart(2, "0")}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-6 border-t border-hair pt-4 lg:mt-0">
          <div className="flex items-center gap-3">
            <ThemeToggle variant="icon" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-head">{user?.name || "Account"}</div>
              <div className="truncate text-xs text-muted">{user?.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-head"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
};

export const PageHeader = ({ eyebrow, title, blurb, className = "" }) => (
  <div className={className}>
    {eyebrow && <div className="verve-eyebrow">{eyebrow}</div>}
    <h1
      className="mt-4 font-extrabold leading-[0.92] tracking-[-0.04em] text-head"
      style={{ fontSize: "clamp(40px,5vw,80px)" }}
    >
      {title}
    </h1>
    {blurb && <p className="mt-6 max-w-[560px] text-base leading-relaxed text-muted">{blurb}</p>}
  </div>
);

export default AppLayout;
