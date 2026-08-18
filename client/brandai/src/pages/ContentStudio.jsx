import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { debounce } from "../utils/async";
import { useToast } from "../hooks/useToast.jsx";
import { getSocket } from "../services/socket";

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

  // searchInput updates the text box instantly; the debounced setter only commits to
  // `search` (which actually drives filtering) 300ms after typing pauses — avoids
  // re-filtering the list on every keystroke. useRef so the debounced function (and its
  // closed-over timer) is created once, not recreated — and re-debounced from scratch —
  // on every render.
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

  // Keeps this page's draft list in sync if a draft is created/updated from another open
  // tab (or, later, the weekly planner) for the same account — without this, you'd only
  // see it after a manual refresh.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onDraftChange = () => loadDrafts();
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
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-8">
        <Link to="/dashboard" className="font-display text-lg">BrandPilot</Link>
        <nav className="flex items-center gap-6">
          <Link to="/dashboard" className="font-mono text-xs uppercase tracking-widest text-muted hover:text-ink">
            Dashboard
          </Link>
          <Link to="/planner" className="font-mono text-xs uppercase tracking-widest text-muted hover:text-ink">
            Planner
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-24">
        <p className="byline">Content Studio</p>
        <h1 className="mt-4 font-display text-4xl">Generate content</h1>

        <div className="mt-10 border-t border-line pt-8">
          <div className="flex items-center justify-between">
            <p className="field-label">Need a topic?</p>
            <button
              type="button"
              onClick={handleGetIdeas}
              disabled={ideasLoading}
              className="btn-secondary disabled:opacity-50"
            >
              {ideasLoading ? "Thinking…" : ideas.length > 0 ? "Generate more" : "Get ideas"}
            </button>
          </div>
          {ideas.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {ideas.map((idea, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTopic(idea)}
                  className="border border-line px-3 py-1.5 text-left text-sm hover:border-ink"
                >
                  {idea}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 border-t border-line pt-8">
          <label className="field-label">Topic</label>
          <textarea
            rows={2}
            className="field-input mt-2 resize-none"
            placeholder="What should this post be about?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <div className="mt-6">
            <p className="field-label">Platforms</p>
            <div className="mt-2 flex gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`rounded-md border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-200 ${
selectedPlatforms.includes(p)
? "bg-black text-white border-black"
: "bg-white text-gray-700 border-gray-300 hover:border-black"
}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="tone">Tone (optional)</label>
              <select
                id="tone"
                className="field-input mt-2"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="">Use brand default</option>
                {TONES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="length">Length</label>
              <select
                id="length"
                className="field-input mt-2"
                value={length}
                onChange={(e) => setLength(e.target.value)}
              >
                {LENGTHS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {brief?.contentPillars?.length > 0 && (
            <div className="mt-6">
              <p className="field-label">Content pillar (optional)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPillar("")}
                  className={`border px-3 py-1.5 text-xs ${
                    selectedPillar === "" ? "border-ink bg-ink text-paper" : "border-line text-ink/70"
                  }`}
                >
                  None
                </button>
                {brief.contentPillars.map((pillar) => (
                  <button
                    key={pillar}
                    type="button"
                    onClick={() => setSelectedPillar(pillar)}
                    className={`border px-3 py-1.5 text-xs ${
                      selectedPillar === pillar ? "border-ink bg-ink text-paper" : "border-line text-ink/70"
                    }`}
                  >
                    {pillar}
                  </button>
                ))}
              </div>
            </div>
          )}

          {generateError && <p className="mt-4 text-sm text-red-700">{generateError}</p>}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !topic || selectedPlatforms.length === 0}
            className="btn-primary mt-6 disabled:opacity-40"
          >
            {generating ? "Generating…" : `Generate ${selectedPlatforms.length > 1 ? "posts" : "post"}`}
          </button>
        </div>

        <div className="mt-16 border-t border-line pt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="field-label">Your drafts</p>
            <input
              type="search"
              placeholder="Search your content…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="field-input w-56"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {["all", ...PLATFORMS].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatformFilter(p)}
                  className={`border px-3 py-1 font-mono text-xs uppercase tracking-widest ${
                    platformFilter === p ? "border-ink bg-ink text-paper" : "border-line text-ink/70"
                  }`}
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
                  className={`border px-3 py-1 font-mono text-xs uppercase tracking-widest ${
                    statusFilter === s.value ? "border-cobalt text-cobalt" : "border-line text-ink/70"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {draftsLoading && <p className="mt-4 text-sm text-muted">Loading drafts…</p>}

          {!draftsLoading && filteredDrafts.length === 0 && (
            <p className="mt-4 text-sm text-muted">
              {drafts.length === 0 ? "No drafts yet — generate your first post above." : "No drafts match your filters."}
            </p>
          )}

          <div className="mt-4 space-y-4">
            {filteredDrafts.map((draft) => (
              <div key={draft._id} className="border border-line p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-widest text-cobalt">
                      {draft.platform}
                    </span>
                    {draft.pillar && (
                      <span className="font-mono text-xs uppercase tracking-widest text-muted">
                        · {draft.pillar}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted">
                    {draft.status}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/90">
                  {draft.content}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(draft._id, draft.content)}
                    className="font-mono text-xs uppercase tracking-widest text-cobalt hover:underline"
                  >
                    {copiedId === draft._id ? "Copied!" : "Copy"}
                  </button>
                  {draft.status === "scheduled" && (
                    <button
                      type="button"
                      onClick={() => handleMarkPosted(draft._id)}
                      disabled={updatingId === draft._id}
                      className="font-mono text-xs uppercase tracking-widest text-cobalt hover:underline disabled:opacity-50"
                    >
                      {updatingId === draft._id ? "Marking…" : "Mark as posted"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(draft._id)}
                    className="font-mono text-xs uppercase tracking-widest text-muted hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  {REFINE_ACTIONS.map(({ action, label }) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => handleRefine(draft._id, action)}
                      disabled={refiningId === draft._id}
                      className="border border-line px-2.5 py-1 text-xs text-ink/70 hover:border-ink hover:text-ink disabled:opacity-40"
                    >
                      {refiningId === draft._id ? "…" : label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContentStudio;
