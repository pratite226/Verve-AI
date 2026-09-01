import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { coalesceMicrotask } from "../utils/async";
import AppLayout from "../layouts/AppLayout.jsx";
import { Alert, Button } from "../components/ui.jsx";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

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
  const today = new Date();

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

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // generateWeeklyPlanContent (contentController.js) emits one "draft:created" per day it
    // plans — coalesced to a single reload instead of one per event, see coalesceMicrotask.
    const onDraftChange = coalesceMicrotask(loadPlanner);
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
      return isSameDay(new Date(d.scheduledDate), day);
    });

  return (
    <AppLayout>
      <div className="px-6 pb-24 pt-11 sm:px-12">
        <div className="verve-eyebrow">Weekly Planner</div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <h1
            className="m-0 font-extrabold leading-[0.92] tracking-[-0.04em] text-head"
            style={{ fontSize: "clamp(38px,4.6vw,72px)" }}
          >
            {formatDayHeader(weekDays[0])} – {formatDayHeader(weekDays[6])}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={goPrevWeek}>← Prev</Button>
            <Button variant="ghost" onClick={goNextWeek}>Next →</Button>
            <Button onClick={handlePlanWeek} loading={planning}>
              {planning ? "Planning…" : "Plan this week with AI"}
            </Button>
          </div>
        </div>

        {error && <Alert className="mt-4">{error}</Alert>}
        {loading && <p className="mt-8 text-sm text-muted">Loading planner…</p>}

        {!loading && (
          <>
            <div className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-bd bg-hair sm:grid-cols-7">
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={i}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverDay(i);
                    }}
                    onDragLeave={() => setDragOverDay((d) => (d === i ? null : d))}
                    onDrop={(e) => handleDrop(day, e)}
                    className="min-h-[230px] px-3.5 py-4 transition-colors duration-150"
                    style={{
                      background: dragOverDay === i
                        ? "var(--color-hover)"
                        : isToday
                          ? "var(--color-raised-2)"
                          : "var(--color-panel)",
                      outline: dragOverDay === i ? "1px solid var(--color-accent)" : "none",
                      outlineOffset: "-1px",
                    }}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${isToday ? "text-accent" : "text-muted"}`}>
                        {DAY_LABELS[i]}
                      </span>
                      <span className={`text-[19px] font-bold tracking-[-0.02em] ${isToday ? "text-head" : "text-label"}`}>
                        {formatDayHeader(day).split(" ")[1]}
                      </span>
                    </div>
                    <div className="mt-3.5 flex flex-col gap-2">
                      {draftsForDay(day).length === 0 && <p className="text-xs text-faint">Nothing scheduled</p>}
                      {draftsForDay(day).map((draft) => (
                        <div
                          key={draft._id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", draft._id)}
                          className="cursor-grab rounded-[6px] border border-tint-bd bg-tint p-2.5 active:cursor-grabbing"
                          style={{ borderLeft: "2px solid var(--color-accent)" }}
                        >
                          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
                            {draft.platform}
                          </div>
                          <p className="mt-1.5 line-clamp-3 text-xs text-label">{draft.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12">
              <span className="verve-label">Unscheduled drafts</span>
              {unscheduledDrafts.length === 0 && (
                <p className="mt-4 text-sm text-muted">
                  Nothing to schedule — generate some posts in Content Studio first.
                </p>
              )}
              <div className="mt-4 flex flex-col gap-2.5">
                {unscheduledDrafts.map((draft) => (
                  <div
                    key={draft._id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", draft._id)}
                    className="verve-card verve-card-interactive flex cursor-grab items-center justify-between gap-6 px-[22px] py-[18px] active:cursor-grabbing"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                        {draft.platform}
                      </span>
                      <p className="mt-1.5 truncate text-sm text-label">{draft.content}</p>
                    </div>
                    <input
                      type="date"
                      disabled={schedulingId === draft._id}
                      onChange={(e) => handleSchedule(draft._id, e.target.value)}
                      title="Drag to a day, or pick a date"
                      className="shrink-0 rounded-full border border-bd-2 bg-transparent px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted outline-none transition-colors duration-150 hover:border-accent"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default WeeklyPlanner;
