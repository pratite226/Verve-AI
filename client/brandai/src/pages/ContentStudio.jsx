import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const PLATFORMS = ["linkedin", "instagram", "twitter"];

const ContentStudio = () => {
  const [brief, setBrief] = useState(null);
  const [topic, setTopic] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["linkedin"]);
  const [selectedPillar, setSelectedPillar] = useState("");

  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(true);

  const [copiedId, setCopiedId] = useState(null);

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

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleGetIdeas = async () => {
    setIdeasLoading(true);
    try {
      const { data } = await api.post("/content/ideas", { count: 8 });
      setIdeas(data.ideas || []);
    } catch {
      setIdeas([]);
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
        });
      } else {
        await api.post("/content/generate-multi", {
          platforms: selectedPlatforms,
          topic,
          pillar: selectedPillar || undefined,
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
      // silently ignore — draft stays in list, user can retry
    }
  };

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

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
              {ideasLoading ? "Thinking…" : "Get ideas"}
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
          <p className="field-label">Your drafts</p>

          {draftsLoading && <p className="mt-4 text-sm text-muted">Loading drafts…</p>}

          {!draftsLoading && drafts.length === 0 && (
            <p className="mt-4 text-sm text-muted">No drafts yet — generate your first post above.</p>
          )}

          <div className="mt-4 space-y-4">
            {drafts.map((draft) => (
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
                <div className="mt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleCopy(draft._id, draft.content)}
                    className="font-mono text-xs uppercase tracking-widest text-cobalt hover:underline"
                  >
                    {copiedId === draft._id ? "Copied!" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(draft._id)}
                    className="font-mono text-xs uppercase tracking-widest text-muted hover:text-red-700"
                  >
                    Delete
                  </button>
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