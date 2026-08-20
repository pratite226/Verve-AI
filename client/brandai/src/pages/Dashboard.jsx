import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { retryWithBackoff } from "../utils/async";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../components/AppShell.jsx";

const quickCards = [
  { num: "01", title: "Content Studio", copy: "Generate posts for LinkedIn, Instagram, and more.", to: "/content-studio" },
  { num: "02", title: "Weekly Planner", copy: "Schedule your drafts across the week.", to: "/planner" },
  { num: "03", title: "Profile Makeover", copy: "Rewrite your LinkedIn headline and About section.", to: "/profile-makeover" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [brief, setBrief] = useState(null);
  const [overview, setOverview] = useState(null);
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

    // The overview aggregation is a plain GET with no side effects, so a transient failure
    // (dropped connection, a 502 while the server is cold-starting) is safe to retry —
    // unlike the mutation calls elsewhere in the app, which never wrap this helper.
    retryWithBackoff(() => api.get("/analytics/overview"))
      .then((res) => setOverview(res.data))
      .catch(() => {});
  }, []);

  return (
    <AppShell>
      <div className="px-12 pb-24 pt-11">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Dashboard</div>
        <h1
          className="mt-4 font-display font-extrabold tracking-[-0.04em]"
          style={{ fontSize: "clamp(40px,5vw,80px)", lineHeight: 0.92 }}
        >
          Welcome back,
          <br />
          {user?.name?.split(" ")[0] || "there"}.
        </h1>

        {loading && (
          <div className="mt-12 flex flex-col gap-3.5">
            {["80px", "80px", "46px", "46px"].map((h, i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{ height: h, width: i > 1 ? (i === 2 ? "70%" : "50%") : "100%", background: "#101013", animation: "pulse 1.4s ease-in-out infinite" }}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-12 flex items-center justify-between gap-5 rounded-sm border px-[22px] py-5" style={{ borderColor: "#4A1F16", background: "#1A0C08", color: "#FF7A55" }}>
            <span className="text-[15px]">{error}</span>
          </div>
        )}

        {!loading && !error && !brief && (
          <div className="mt-12 rounded border border-dashed px-10 py-[72px] text-center" style={{ borderColor: "var(--color-line)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">No brand brief yet</div>
            <p className="mx-auto mt-4 max-w-[420px] text-base leading-relaxed text-[#8A867E]">
              Ten minutes of intake and the AI writes your positioning, tone, audience and content
              pillars.
            </p>
            <Link to="/onboarding" data-magnetic className="btn-primary mt-6 inline-flex">
              Start onboarding
            </Link>
          </div>
        )}

        {brief && (
          <>
            <div className="mt-[52px] grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
              {[
                { label: "Positioning", value: brief.positioning, size: "26px" },
                { label: "Tagline", value: brief.tagline, size: "26px" },
                { label: "Tone", value: brief.tone, size: "17px" },
                { label: "Target audience", value: brief.targetAudience, size: "17px" },
              ].map((f) => (
                <div key={f.label} className="bg-paper-raised px-[30px] py-7">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{f.label}</div>
                  <p className="mt-3 leading-tight tracking-[-0.02em]" style={{ fontSize: f.size }}>
                    {f.value}
                  </p>
                </div>
              ))}
              <div className="bg-paper-raised px-[30px] py-7 sm:col-span-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Mission</div>
                <p className="mt-3 text-[17px] leading-tight tracking-[-0.02em]">{brief.mission}</p>
              </div>
            </div>

            <div className="mt-11">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Content pillars</div>
              <div className="mt-[18px] flex flex-col gap-3.5">
                {brief.contentPillars?.map((pillar) => {
                  const weight =
                    brief.pillarWeights?.[pillar] ??
                    Math.round(100 / (brief.contentPillars.length || 1));
                  return (
                    <div key={pillar} className="flex items-center gap-4.5">
                      <span className="w-[190px] shrink-0 truncate text-[15px]">{pillar}</span>
                      <div className="h-[3px] flex-1 bg-line">
                        <div className="h-full transition-[width] duration-500" style={{ width: `${weight}%`, background: "var(--color-cobalt)" }} />
                      </div>
                      <span className="w-11 shrink-0 text-right font-mono text-[11px] text-muted">{weight}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {overview && (overview.byPlatform.length > 0 || overview.byStatus.length > 0) && (
              <div className="mt-14 grid gap-9 border-t border-line pt-9 sm:grid-cols-2">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                    Posts by platform
                    {overview.profileContext?.industry && ` — ${overview.profileContext.industry}`}
                  </div>
                  <ul className="mt-3 space-y-2">
                    {overview.byPlatform.map((row) => (
                      <li key={row._id} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{row._id}</span>
                        <span className="font-mono text-xs text-muted">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Posts by status</div>
                  <ul className="mt-3 space-y-2">
                    {overview.byStatus.map((row) => (
                      <li key={row._id} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{row._id}</span>
                        <span className="font-mono text-xs text-muted">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-14 grid gap-3.5 sm:grid-cols-3">
              {quickCards.map((c) => (
                <Link
                  key={c.num}
                  to={c.to}
                  data-magnetic
                  className="rounded border border-line bg-paper-raised p-7 transition-colors duration-150 hover:border-[var(--color-cobalt)]"
                >
                  <span className="font-mono text-[10px]" style={{ color: "var(--color-cobalt)" }}>{c.num}</span>
                  <h3 className="mt-3.5 font-display text-2xl font-bold tracking-[-0.03em]">{c.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#8A867E]">{c.copy}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default Dashboard;
