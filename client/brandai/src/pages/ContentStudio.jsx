import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import { debounce, coalesceMicrotask } from "../utils/async";
import { useToast } from "../hooks/useToast.jsx";
import { getSocket } from "../services/socket";
import AppShell from "../components/AppShell.jsx";

const PLATFORMS = ["linkedin", "instagram", "twitter"];
const TONES = ["Professional", "Casual", "Bold", "Educational", "Storytelling", "Inspirational", "Funny", "Gen-Z"];
const LENGTHS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];
const REFINE_ACTIONS = [
  { action: "improve", label: "Improve" },
  { action: "shorten", label: "Shorten" },
  { action: "more_engaging", label: "More engaging" },
  { action: "add_hook", label: "Add hook" },
  { action: "add_cta", label: "Add CTA" },
  { action: "more_professional", label: "More professional" },
  { action: "more_casual", label: "More casual" },
];
const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Planned" },
  { value: "posted", label: "Published" },
];

const STATUS_COLORS = {
  posted: { color: "var(--color-cobalt)", border: "#3A4520" },
  scheduled: { color: "#A5A199", border: "var(--color-line)" },
  draft: { color: "var(--color-muted)", border: "var(--color-line)" },
};

const ContentStudio = () => {
  const [brief, setBrief] = useState(null);
  const [topic, setTopic] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["linkedin"]);
  const [selectedPillar, setSelectedPillar] = useState("");
  const [tone, setTone] = useState("");
  const [length, setLength] = useState("medium");

  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(true);

  const [copiedId, setCopiedId] = useState(null);
  const [refiningId, setRefiningId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const debouncedSetSearch = useRef(debounce(setSearch, 300)).current;

  const handleSearchChange = (value) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  const loadDrafts = () => {
    setDraftsLoading(true);
    api
      .get("/content")
      .then((res) => setDrafts(res.data.drafts || []))
      .catch(() => setDrafts([]))
      .finally(() => setDraftsLoading(false));
  };

  useEffect(() => {
    api.get("/brand").then((res) => setBrief(res.data.brief)).catch(() => setBrief(null));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDrafts();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onDraftChange = coalesceMicrotask(loadDrafts);
    socket.on("draft:created", onDraftChange);
    socket.on("draft:statusChanged", onDraftChange);

    return () => {
      socket.off("draft:created", onDraftChange);
      socket.off("draft:statusChanged", onDraftChange);
    };
  }, []);

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleGetIdeas = async () => {
    setIdeasLoading(true);
    try {
      const { data } = await api.post("/content/ideas", { count: 8, exclude: ideas });
      const newIdeas = (data.ideas || []).filter((idea) => !ideas.includes(idea));
      setIdeas((prev) => [...prev, ...newIdeas]);
    } catch {
      // keep existing ideas on failure
    } finally {
      setIdeasLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic || selectedPlatforms.length === 0) return;

    setGenerating(true);
    setGenerateError("");

    try {
      if (selectedPlatforms.length === 1) {
        await api.post("/content/generate", {
          platform: selectedPlatforms[0],
          topic,
          pillar: selectedPillar || undefined,
          tone: tone || undefined,
          length,
        });
      } else {
        await api.post("/content/generate-multi", {
          platforms: selectedPlatforms,
          topic,
          pillar: selectedPillar || undefined,
          tone: tone || undefined,
          length,
        });
      }
      setTopic("");
      loadDrafts();
    } catch (err) {
      setGenerateError(err.response?.data?.message || "Couldn't generate content. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/content/${id}`);
      setDrafts((prev) => prev.filter((d) => d._id !== id));
    } catch {
      showToast("Couldn't delete that draft — try again.", { type: "error" });
    }
  };

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleRefine = async (id, action) => {
    setRefiningId(id);
    try {
      const { data } = await api.put(`/content/${id}/refine`, { action });
      setDrafts((prev) => prev.map((d) => (d._id === id ? data.draft : d)));
    } catch {
      showToast("Couldn't refine that draft — try again.", { type: "error" });
    } finally {
      setRefiningId(null);
    }
  };

  const handleMarkPosted = async (id) => {
    setUpdatingId(id);
    try {
      const { data } = await api.put(`/content/${id}/status`, { status: "posted" });
      setDrafts((prev) => prev.map((d) => (d._id === id ? data.draft : d)));
    } catch {
      showToast("Couldn't update that draft — try again.", { type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredDrafts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drafts.filter((d) => {
      if (platformFilter !== "all" && d.platform !== platformFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (q && !d.content.toLowerCase().includes(q) && !d.topic.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [drafts, platformFilter, statusFilter, search]);

  return (
    <AppShell>
      <div className="px-12 pb-24 pt-11">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Content Studio</div>
        <h1
          className="mt-4 font-display font-extrabold tracking-[-0.04em]"
          style={{ fontSize: "clamp(40px,5vw,80px)", lineHeight: 0.92 }}
        >
          Generate content
        </h1>

        <div className="mt-11 rounded border border-line bg-paper-raised p-8">
          <div className="flex items-center justify-between gap-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Need a topic?</span>
            <button type="button" onClick={handleGetIdeas} disabled={ideasLoading} className="btn-secondary disabled:opacity-50">
              {ideasLoading ? "Thinking…" : ideas.length > 0 ? "Generate more" : "Get ideas"}
            </button>
          </div>
          {ideas.length > 0 && (
            <div className="mt-[18px] flex flex-wrap gap-2">
              {ideas.map((idea, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTopic(idea)}
                  className="rounded-full border border-line px-3.5 py-2.5 text-left text-[13px] transition-colors duration-150 hover:border-[var(--color-cobalt)]"
                  style={{ background: "var(--color-paper)", color: "#A5A199" }}
                >
                  {idea}
                </button>
              ))}
            </div>
          )}

          <div className="mt-7 border-t border-line pt-7">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Topic</span>
            <textarea
              rows={2}
              className="mt-2.5 w-full resize-none border-none bg-transparent py-2 text-[19px] tracking-[-0.01em] outline-none"
              style={{ borderBottom: "1px solid var(--color-line)" }}
              placeholder="What should this post be about?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />

            <div className="mt-7 grid gap-8 sm:grid-cols-2">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Platforms</span>
                <div className="mt-3 flex gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`chip capitalize ${selectedPlatforms.includes(p) ? "chip-active" : ""}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="field-label" htmlFor="tone">Tone (optional)</label>
                  <select id="tone" className="field-input mt-2.5" value={tone} onChange={(e) => setTone(e.target.value)}>
                    <option value="">Use brand default</option>
                    {TONES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="length">Length</label>
                  <select id="length" className="field-input mt-2.5" value={length} onChange={(e) => setLength(e.target.value)}>
                    {LENGTHS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {brief?.contentPillars?.length > 0 && (
              <div className="mt-7">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Content pillar (optional)</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPillar("")}
                    className={`chip ${selectedPillar === "" ? "chip-active" : ""}`}
                  >
                    None
                  </button>
                  {brief.contentPillars.map((pillar) => (
                    <button
                      key={pillar}
                      type="button"
                      onClick={() => setSelectedPillar(pillar)}
                      className={`chip ${selectedPillar === pillar ? "chip-active" : ""}`}
                    >
                      {pillar}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {generateError && (
              <div className="mt-6 rounded-sm border px-4 py-3.5 text-sm" style={{ borderColor: "#4A1F16", background: "#1A0C08", color: "#FF7A55" }}>
                {generateError}
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !topic || selectedPlatforms.length === 0}
              data-magnetic
              className="btn-primary mt-7 disabled:opacity-40"
            >
              {generating && <span className="spinner" aria-hidden="true" />}
              {generating ? "Generating…" : `Generate ${selectedPlatforms.length > 1 ? "posts" : "post"}`}
            </button>
          </div>
        </div>

        <div className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Your drafts</span>
            <input
              type="search"
              placeholder="Search your content…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="field-input w-56"
            />
          </div>

          <div className="mt-[18px] flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {["all", ...PLATFORMS].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatformFilter(p)}
                  className={`chip capitalize ${platformFilter === p ? "chip-active" : ""}`}
                >
                  {p === "all" ? "All" : p}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={`chip ${statusFilter === s.value ? "chip-active" : ""}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {draftsLoading && <p className="mt-4 text-sm text-muted">Loading drafts…</p>}

          {!draftsLoading && filteredDrafts.length === 0 && (
            <div className="mt-[22px] rounded border border-dashed px-10 py-16 text-center" style={{ borderColor: "var(--color-line)" }}>
              <p className="m-0 text-[15px] text-[#8A867E]">
                {drafts.length === 0 ? "No drafts yet — generate your first post above." : "No drafts match your filters."}
              </p>
            </div>
          )}

          <div className="mt-[22px] flex flex-col gap-3">
            {filteredDrafts.map((draft) => {
              const sc = STATUS_COLORS[draft.status] || STATUS_COLORS.draft;
              return (
                <div key={draft._id} className="rounded border border-line bg-paper-raised px-[26px] py-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.2em]">
                      <span style={{ color: "var(--color-cobalt)" }}>{draft.platform}</span>
                      {draft.pillar && (
                        <>
                          <span style={{ color: "#3A3A3E" }}>/</span>
                          <span className="text-muted">{draft.pillar}</span>
                        </>
                      )}
                    </div>
                    <span
                      className="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: sc.color, borderColor: sc.border }}
                    >
                      {draft.status}
                    </span>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed" style={{ color: "#CFCCC5" }}>
                    {draft.content}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(draft._id, draft.content)}
                      className="font-mono text-xs uppercase tracking-widest hover:underline"
                      style={{ color: "var(--color-cobalt)" }}
                    >
                      {copiedId === draft._id ? "Copied!" : "Copy"}
                    </button>
                    {draft.status === "scheduled" && (
                      <button
                        type="button"
                        onClick={() => handleMarkPosted(draft._id)}
                        disabled={updatingId === draft._id}
                        className="font-mono text-xs uppercase tracking-widest hover:underline disabled:opacity-50"
                        style={{ color: "var(--color-cobalt)" }}
                      >
                        {updatingId === draft._id ? "Marking…" : "Mark as posted"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(draft._id)}
                      className="font-mono text-xs uppercase tracking-widest text-muted hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="mt-3.5 flex flex-wrap gap-2 border-t border-line pt-4.5">
                    {REFINE_ACTIONS.map(({ action, label }) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => handleRefine(draft._id, action)}
                        disabled={refiningId === draft._id}
                        className="rounded-full border border-line px-3.5 py-2 text-xs text-[#8A867E] transition-colors duration-150 hover:border-[var(--color-cobalt)] hover:text-[var(--color-cobalt)] disabled:opacity-40"
                      >
                        {refiningId === draft._id ? "…" : label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ContentStudio;
