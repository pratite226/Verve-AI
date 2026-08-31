import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { retryWithBackoff } from "../utils/async";
import { useAuth } from "../context/AuthContext.jsx";
import AppLayout, { PageHeader } from "../layouts/AppLayout.jsx";
import { Alert, Button, EmptyState, KpiCard, Skeleton } from "../components/ui.jsx";

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

  const loadBrief = () => {
    setLoading(true);
    setError("");
    api
      .get("/brand")
      .then((res) => setBrief(res.data.brief))
      .catch((err) => {
        if (err.response?.status !== 404) {
          setError("Couldn't load your Brand Brief.");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBrief();

    // The overview aggregation is a plain GET with no side effects, so a transient failure
    // (dropped connection, a 502 while the server is cold-starting) is safe to retry —
    // unlike the mutation calls elsewhere in the app, which never wrap this helper.
    retryWithBackoff(() => api.get("/analytics/overview"))
      .then((res) => setOverview(res.data))
      .catch(() => {});
  }, []);

  const statusCount = (id) => overview?.byStatus?.find((row) => row._id === id)?.count || 0;
  const totalDrafts = overview?.byStatus?.reduce((sum, row) => sum + row.count, 0) || 0;

  return (
    <AppLayout>
      <div className="px-6 pb-24 pt-11 sm:px-12">
        <PageHeader eyebrow="Dashboard" title={<>Welcome back,<br />{user?.name?.split(" ")[0] || "there"}.</>} />

        {loading && (
          <div className="mt-12 flex flex-col gap-3.5">
            <Skeleton style={{ height: "80px" }} />
            <Skeleton style={{ height: "80px" }} />
            <Skeleton style={{ height: "46px", width: "70%" }} />
            <Skeleton style={{ height: "46px", width: "50%" }} />
          </div>
        )}

        {!loading && error && (
          <Alert className="mt-12" onRetry={loadBrief}>
            {error}
          </Alert>
        )}

        {!loading && !error && !brief && (
          <EmptyState
            className="mt-12"
            label="No brand brief yet"
            action={
              <Button as={Link} to="/onboarding">
                Start onboarding
              </Button>
            }
          >
            Ten minutes of intake and the AI writes your positioning, tone, audience and content
            pillars.
          </EmptyState>
        )}

        {brief && (
          <>
            <div className="mt-[52px] grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
              <KpiCard label="Total drafts" value={totalDrafts} />
              <KpiCard label="Published" value={statusCount("posted")} />
              <KpiCard label="Planned" value={statusCount("scheduled")} />
              <KpiCard label="Content pillars" value={brief.contentPillars?.length || 0} />
            </div>

            <div className="mt-11 grid gap-px overflow-hidden rounded-2xl border border-bd bg-hair sm:grid-cols-2">
              {[
                { label: "Positioning", value: brief.positioning, size: "26px" },
                { label: "Tagline", value: brief.tagline, size: "26px" },
                { label: "Tone", value: brief.tone, size: "17px" },
                { label: "Target audience", value: brief.targetAudience, size: "17px" },
              ].map((f) => (
                <div key={f.label} className="bg-panel px-[30px] py-7">
                  <div className="verve-label">{f.label}</div>
                  <p className="mt-3 leading-tight tracking-[-0.02em] text-head" style={{ fontSize: f.size }}>
                    {f.value}
                  </p>
                </div>
              ))}
              <div className="bg-panel px-[30px] py-7 sm:col-span-2">
                <div className="verve-label">Mission</div>
                <p className="mt-3 text-[17px] leading-tight tracking-[-0.02em] text-head">{brief.mission}</p>
              </div>
            </div>

            <div className="mt-11">
              <div className="verve-label">Content pillars</div>
              <div className="mt-[18px] flex flex-col gap-3.5">
                {brief.contentPillars?.map((pillar) => {
                  const weight =
                    brief.pillarWeights?.[pillar] ??
                    Math.round(100 / (brief.contentPillars.length || 1));
                  return (
                    <div key={pillar} className="flex items-center gap-4.5">
                      <span className="w-[190px] shrink-0 truncate text-[15px] text-text">{pillar}</span>
                      <div className="h-[3px] flex-1 bg-hair">
                        <div
                          className="h-full bg-accent transition-[width] duration-500"
                          style={{ width: `${weight}%` }}
                        />
                      </div>
                      <span className="w-11 shrink-0 text-right font-mono text-[11px] text-muted">{weight}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-14 grid gap-3.5 sm:grid-cols-3">
              {quickCards.map((c) => (
                <Link
                  key={c.num}
                  to={c.to}
                  className="verve-card verve-card-interactive p-7"
                >
                  <span className="font-mono text-[10px] text-accent">{c.num}</span>
                  <h3 className="mt-3.5 text-2xl font-bold tracking-[-0.03em] text-head">{c.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{c.copy}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
