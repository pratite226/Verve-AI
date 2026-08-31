import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import { debounce, coalesceMicrotask } from "../utils/async";
import { useToast } from "../hooks/useToast.jsx";
import { getSocket } from "../services/socket";
import AppLayout, { PageHeader } from "../layouts/AppLayout.jsx";
import { Alert, Button, Chip, EmptyState, Select, StatusPill } from "../components/ui.jsx";

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
    <AppLayout>
      <div className="px-6 pb-24 pt-11 sm:px-12">
        <PageHeader eyebrow="Content Studio" title="Generate content" />

        <div className="verve-card mt-11 p-8">
          <div className="flex items-center justify-between gap-5">
            <span className="verve-label">Need a topic?</span>
            <Button variant="ghost" size="sm" onClick={handleGetIdeas} loading={ideasLoading}>
              {ideasLoading ? "Thinking…" : ideas.length > 0 ? "Generate more" : "Get ideas"}
            </Button>
          </div>
          {ideas.length > 0 && (
            <div className="mt-[18px] flex flex-wrap gap-2">
              {ideas.map((idea, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTopic(idea)}
                  className="rounded-full border border-bd-2 bg-raised px-3.5 py-2.5 text-left text-[13px] text-label transition-colors duration-150 hover:border-accent"
                >
                  {idea}
                </button>
              ))}
            </div>
          )}

          <div className="mt-7 border-t border-hair pt-7">
            <span className="verve-label">Topic</span>
            <textarea
              rows={2}
              className="verve-field mt-2.5 resize-none text-[19px] tracking-[-0.01em]"
              placeholder="What should this post be about?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />

            <div className="mt-7 grid gap-8 sm:grid-cols-2">
              <div>
                <span className="verve-label">Platforms</span>
                <div className="mt-3 flex gap-2">
                  {PLATFORMS.map((p) => (
                    <Chip key={p} active={selectedPlatforms.includes(p)} onClick={() => togglePlatform(p)} className="capitalize">
                      {p}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
                <Select label="Tone (optional)" id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                  <option value="">Use brand default</option>
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
                <Select label="Length" id="length" value={length} onChange={(e) => setLength(e.target.value)}>
                  {LENGTHS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </Select>
              </div>
            </div>

            {brief?.contentPillars?.length > 0 && (
              <div className="mt-7">
                <span className="verve-label">Content pillar (optional)</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip active={selectedPillar === ""} onClick={() => setSelectedPillar("")}>
                    None
                  </Chip>
                  {brief.contentPillars.map((pillar) => (
                    <Chip key={pillar} active={selectedPillar === pillar} onClick={() => setSelectedPillar(pillar)}>
                      {pillar}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {generateError && <Alert className="mt-6">{generateError}</Alert>}

            <Button
              onClick={handleGenerate}
              disabled={!topic || selectedPlatforms.length === 0}
              loading={generating}
              className="mt-7"
            >
              {generating ? "Generating…" : `Generate ${selectedPlatforms.length > 1 ? "posts" : "post"}`}
            </Button>
          </div>
        </div>

        <div className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="verve-label">Your drafts</span>
            <input
              type="search"
              placeholder="Search your content…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="verve-field w-56"
            />
          </div>

          <div className="mt-[18px] flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {["all", ...PLATFORMS].map((p) => (
                <Chip key={p} active={platformFilter === p} onClick={() => setPlatformFilter(p)} className="capitalize">
                  {p === "all" ? "All" : p}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <Chip key={s.value} active={statusFilter === s.value} onClick={() => setStatusFilter(s.value)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </div>

          {draftsLoading && <p className="mt-4 text-sm text-muted">Loading drafts…</p>}

          {!draftsLoading && filteredDrafts.length === 0 && (
            <EmptyState className="mt-[22px]">
              {drafts.length === 0 ? "No drafts yet — generate your first post above." : "No drafts match your filters."}
            </EmptyState>
          )}

          <div className="mt-[22px] flex flex-col gap-3">
            {filteredDrafts.map((draft) => (
              <div key={draft._id} className="verve-card px-[26px] py-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.2em]">
                    <span className="text-accent">{draft.platform}</span>
                    {draft.pillar && (
                      <>
                        <span className="text-faint">/</span>
                        <span className="text-muted">{draft.pillar}</span>
                      </>
                    )}
                  </div>
                  <StatusPill status={draft.status} />
                </div>
                <p className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.65] text-text">{draft.content}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(draft._id, draft.content)}
                    className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
                  >
                    {copiedId === draft._id ? "Copied!" : "Copy"}
                  </button>
                  {draft.status === "scheduled" && (
                    <button
                      type="button"
                      onClick={() => handleMarkPosted(draft._id)}
                      disabled={updatingId === draft._id}
                      className="font-mono text-xs uppercase tracking-widest text-accent hover:underline disabled:opacity-50"
                    >
                      {updatingId === draft._id ? "Marking…" : "Mark as posted"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(draft._id)}
                    className="font-mono text-xs uppercase tracking-widest text-muted hover:text-danger"
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-2 border-t border-hair pt-4.5">
                  {REFINE_ACTIONS.map(({ action, label }) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => handleRefine(draft._id, action)}
                      disabled={refiningId === draft._id}
                      className="rounded-full border border-bd-2 px-3.5 py-2 text-xs text-muted transition-colors duration-150 hover:border-accent hover:text-accent disabled:opacity-40"
                    >
                      {refiningId === draft._id ? "…" : label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ContentStudio;
