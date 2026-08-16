import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/brand")
      .then((res) => setBrief(res.data.brief))
      .catch((err) => {
        if (err.response?.status !== 404) {
          setError("Couldn't load your Brand Brief.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-8">
        <span className="font-display text-lg">BrandPilot</span>
        <nav className="flex items-center gap-6">
          <Link to="/content-studio" className="font-mono text-xs uppercase tracking-widest text-ink hover:text-cobalt">
            Content Studio
          </Link>
          <Link to="/canvas" className="font-mono text-xs uppercase tracking-widest text-ink hover:text-cobalt">
            Canvas
          </Link>
          <Link to="/planner" className="font-mono text-xs uppercase tracking-widest text-ink hover:text-cobalt">
            Planner
          </Link>
          <Link to="/settings" className="font-mono text-xs uppercase tracking-widest text-ink hover:text-cobalt">
            Settings
          </Link>
          <button onClick={logout} className="font-mono text-xs uppercase tracking-widest text-muted hover:text-ink">
            Log out
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-24">
        <p className="byline">Dashboard</p>
        <h1 className="mt-4 font-display text-4xl">Welcome, {user?.name?.split(" ")[0] || "there"}</h1>

        {loading && <p className="mt-8 text-sm text-muted">Loading your Brand Brief…</p>}

        {error && <p className="mt-8 text-sm text-red-700">{error}</p>}

        {!loading && !error && !brief && (
          <div className="mt-8 border border-line p-8 text-center">
            <p className="text-sm text-muted">You haven't generated a Brand Brief yet.</p>
            <Link to="/onboarding" className="btn-primary mt-4 inline-flex">
              Start onboarding
            </Link>
          </div>
        )}

        {brief && (
          <>
            <div className="mt-10 grid gap-8 border-t border-line pt-10 sm:grid-cols-2">
              <div>
                <p className="field-label">Positioning</p>
                <p className="mt-2 font-display text-xl leading-snug">{brief.positioning}</p>
              </div>
              <div>
                <p className="field-label">Tagline</p>
                <p className="mt-2 font-display text-xl leading-snug">{brief.tagline}</p>
              </div>
              <div>
                <p className="field-label">Tone</p>
                <p className="mt-2 text-base">{brief.tone}</p>
              </div>
              <div>
                <p className="field-label">Target audience</p>
                <p className="mt-2 text-base">{brief.targetAudience}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="field-label">Mission</p>
                <p className="mt-2 text-base">{brief.mission}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="field-label">Content pillars</p>
                <ul className="mt-3 space-y-2">
                  {brief.contentPillars?.map((pillar) => {
                    const weight =
                      brief.pillarWeights?.[pillar] ??
                      Math.round(100 / (brief.contentPillars.length || 1));
                    return (
                      <li key={pillar} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 truncate text-sm">{pillar}</span>
                        <div className="h-1.5 flex-1 bg-line/60">
                          <div
                            className="h-full bg-cobalt transition-[width] duration-500"
                            style={{ width: `${weight}%` }}
                          />
                        </div>
                        <span className="w-10 shrink-0 text-right font-mono text-xs text-muted">{weight}%</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="mt-16 grid gap-4 border-t border-line pt-10 sm:grid-cols-3">
              <Link to="/content-studio" className="border border-line p-6 hover:border-ink">
                <p className="font-mono text-xs text-muted">01</p>
                <h3 className="mt-2 font-display text-xl">Content Studio</h3>
                <p className="mt-2 text-sm text-ink/70">Generate posts for LinkedIn, Instagram, and more.</p>
              </Link>
              <Link to="/planner" className="border border-line p-6 hover:border-ink">
                <p className="font-mono text-xs text-muted">02</p>
                <h3 className="mt-2 font-display text-xl">Weekly Planner</h3>
                <p className="mt-2 text-sm text-ink/70">Schedule your drafts across the week.</p>
              </Link>
              <Link to="/profile-makeover" className="border border-line p-6 hover:border-ink">
                <p className="font-mono text-xs text-muted">03</p>
                <h3 className="mt-2 font-display text-xl">Profile Makeover</h3>
                <p className="mt-2 text-sm text-ink/70">Rewrite your LinkedIn headline and About section.</p>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;