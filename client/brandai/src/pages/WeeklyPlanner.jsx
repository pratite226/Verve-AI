import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { getSocket } from "../services/socket";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toDateInputValue = (date) => date.toISOString().split("T")[0];

const formatDayHeader = (date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

const WeeklyPlanner = () => {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [scheduledDrafts, setScheduledDrafts] = useState([]);
  const [unscheduledDrafts, setUnscheduledDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [schedulingId, setSchedulingId] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [dragOverDay, setDragOverDay] = useState(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const loadPlanner = useCallback(() => {
    setLoading(true);
    setError("");

    const start = toDateInputValue(weekStart);
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 6);
    const end = toDateInputValue(endDate);

    Promise.all([
      api.get(`/content/planner?start=${start}&end=${end}`),
      api.get("/content"),
    ])
      .then(([plannerRes, allRes]) => {
        setScheduledDrafts(plannerRes.data.drafts || []);
        const unscheduled = (allRes.data.drafts || []).filter((d) => d.status === "draft");
        setUnscheduledDrafts(unscheduled);
      })
      .catch(() => setError("Couldn't load your planner."))
      .finally(() => setLoading(false));
  }, [weekStart]);

  useEffect(() => {
    void Promise.resolve().then(loadPlanner);
  }, [loadPlanner]);

  // Live sync with other tabs — e.g. marking a post "posted" in Content Studio updates
  // this page's board without a manual refresh.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onDraftChange = () => loadPlanner();
    socket.on("draft:created", onDraftChange);
    socket.on("draft:statusChanged", onDraftChange);

    return () => {
      socket.off("draft:created", onDraftChange);
      socket.off("draft:statusChanged", onDraftChange);
    };
  }, [loadPlanner]);

  const handleSchedule = async (draftId, dateValue) => {
    if (!dateValue) return;
    setSchedulingId(draftId);
    try {
      await api.put(`/content/${draftId}/schedule`, { scheduledDate: dateValue });
      loadPlanner();
    } catch {
      setError("Couldn't schedule that draft.");
    } finally {
      setSchedulingId(null);
    }
  };

  const handlePlanWeek = async () => {
    setPlanning(true);
    setError("");
    try {
      await api.post("/content/planner/generate", { weekStart: toDateInputValue(weekStart) });
      loadPlanner();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't plan this week. Please try again.");
    } finally {
      setPlanning(false);
    }
  };

  const handleDrop = (day, e) => {
    e.preventDefault();
    setDragOverDay(null);
    const draftId = e.dataTransfer.getData("text/plain");
    if (draftId) handleSchedule(draftId, toDateInputValue(day));
  };

  const goPrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const goNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const draftsForDay = (day) =>
    scheduledDrafts.filter((d) => {
      if (!d.scheduledDate) return false;
      const sd = new Date(d.scheduledDate);
      return (
        sd.getFullYear() === day.getFullYear() &&
        sd.getMonth() === day.getMonth() &&
        sd.getDate() === day.getDate()
      );
    });

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <Link to="/dashboard" className="font-display text-lg">BrandPilot</Link>
        <nav className="flex items-center gap-6">
          <Link to="/dashboard" className="font-mono text-xs uppercase tracking-widest text-muted hover:text-ink">
            Dashboard
          </Link>
          <Link to="/content-studio" className="font-mono text-xs uppercase tracking-widest text-muted hover:text-ink">
            Content Studio
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <p className="byline">Weekly Planner</p>
        <div className="mt-4 flex items-center justify-between">
          <h1 className="font-display text-4xl">
            {formatDayHeader(weekDays[0])} – {formatDayHeader(weekDays[6])}
          </h1>
          <div className="flex gap-2">
            <button onClick={goPrevWeek} className="btn-secondary">← Prev</button>
            <button onClick={goNextWeek} className="btn-secondary">Next →</button>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePlanWeek}
          disabled={planning}
          className="btn-primary mt-6 disabled:opacity-50"
        >
          {planning && <span className="spinner" aria-hidden="true" />}
          {planning ? "Planning…" : "Plan this week with AI"}
        </button>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {loading && <p className="mt-8 text-sm text-muted">Loading planner…</p>}

        {!loading && (
          <>
            {/* Week grid */}
            <div className="mt-10 grid grid-cols-1 gap-4 border-t border-line pt-8 sm:grid-cols-7">
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverDay(i);
                  }}
                  onDragLeave={() => setDragOverDay((d) => (d === i ? null : d))}
                  onDrop={(e) => handleDrop(day, e)}
                  className={`border border-line p-3 transition-colors duration-150 ${
                    dragOverDay === i ? "bg-paper-raised border-cobalt" : ""
                  }`}
                >
                  <p className="field-label">{DAY_LABELS[i]}</p>
                  <p className="mt-1 font-display text-lg">{formatDayHeader(day)}</p>
                  <div className="mt-3 space-y-2">
                    {draftsForDay(day).length === 0 && (
                      <p className="text-xs text-muted">Nothing scheduled</p>
                    )}
                    {draftsForDay(day).map((draft) => (
                      <div
                        key={draft._id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", draft._id)}
                        className="cursor-grab border border-line bg-paper p-2 active:cursor-grabbing"
                      >
                        <p className="font-mono text-[10px] uppercase tracking-widest text-cobalt">
                          {draft.platform}
                        </p>
                        <p className="mt-1 line-clamp-3 text-xs text-ink/80">{draft.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Unscheduled drafts pool */}
            <div className="mt-16 border-t border-line pt-10">
              <p className="field-label">Unscheduled drafts</p>
              {unscheduledDrafts.length === 0 && (
                <p className="mt-4 text-sm text-muted">
                  Nothing to schedule — generate some posts in Content Studio first.
                </p>
              )}
              <div className="mt-4 space-y-3">
                {unscheduledDrafts.map((draft) => (
                  <div
                    key={draft._id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", draft._id)}
                    className="flex cursor-grab items-center justify-between border border-line p-4 active:cursor-grabbing"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <span className="font-mono text-xs uppercase tracking-widest text-cobalt">
                        {draft.platform}
                      </span>
                      <p className="mt-1 truncate text-sm text-ink/80">{draft.content}</p>
                    </div>
                    <input
                      type="date"
                      disabled={schedulingId === draft._id}
                      onChange={(e) => handleSchedule(draft._id, e.target.value)}
                      className="field-input w-40 shrink-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default WeeklyPlanner;