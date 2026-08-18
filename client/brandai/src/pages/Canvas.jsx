import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { readFileAsDataURL } from "../utils/async";
import { useToast } from "../hooks/useToast.jsx";

const CARD_SIZES = [
  "w-56 h-64",
  "w-64 h-48",
  "w-48 h-80",
  "w-72 h-56",
  "w-56 h-56",
  "w-64 h-72",
];

const Canvas = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNoteText, setNewNoteText] = useState("");
  const [adding, setAdding] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const res = await api.get("/canvas/notes");
        setNotes(res.data.notes || []);
      } catch {
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    setAdding(true);
    try {
      const { data } = await api.post("/canvas/notes", {
        type: "text",
        content: newNoteText.trim(),
      });
      setNotes((prev) => [...prev, data.note]);
      setNewNoteText("");
    } catch {
      showToast("Couldn't add that note — try again.", { type: "error" });
    } finally {
      setAdding(false);
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    try {
      // Promise-wrapped FileReader (utils/async.js) — lets this read like the axios calls
      // below instead of nesting an onload callback.
      const dataUrl = await readFileAsDataURL(file);
      setImagePreview({ file, dataUrl });
    } catch {
      showToast("Couldn't read that image file.", { type: "error" });
    }
  };

  const handleConfirmImage = async () => {
    if (!imagePreview) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", imagePreview.file);
      const { data: uploadData } = await api.post("/canvas/upload", formData);

      const { data } = await api.post("/canvas/notes", {
        type: "image",
        content: uploadData.url,
      });
      setNotes((prev) => [...prev, data.note]);
      setImagePreview(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Couldn't upload that image.", { type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await api.delete(`/canvas/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch {
      // ignore — note stays, user can retry
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError("");
    setAnalysis(null);
    try {
      const { data } = await api.post("/canvas/analyze");
      setAnalysis(data);
    } catch (err) {
      setAnalyzeError(err.response?.data?.message || "Couldn't analyze your board.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
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

      <div className="mx-auto max-w-6xl px-6">
        <p className="byline">Canvas</p>
        <h1 className="mt-4 font-display text-4xl">Dump your ideas here</h1>
        <p className="mt-3 max-w-xl text-sm text-ink/70">
          Add scattered thoughts below. Scroll through them like a gallery, then ask AI
          what content you could make from what's here.
        </p>

        <div className="mt-8 flex gap-2">
          <input
            className="field-input"
            placeholder="Type a quick idea, thought, or note…"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddNote();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddNote}
            disabled={adding}
            className="btn-secondary shrink-0 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add note"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary shrink-0"
          >
            Add image
          </button>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || notes.length === 0}
            className="btn-primary shrink-0 disabled:opacity-40"
          >
            {analyzing ? "Analyzing…" : "Analyze my board"}
          </button>
        </div>

        {imagePreview && (
          <div className="mt-4 flex items-center gap-4 border border-line p-4">
            <img src={imagePreview.dataUrl} alt="Preview" className="h-20 w-20 object-cover" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmImage}
                disabled={uploading}
                className="btn-primary disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Add to board"}
              </button>
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {analyzeError && <p className="mt-4 text-sm text-red-700">{analyzeError}</p>}

        {analysis && (
          <div className="mt-6 border border-line p-5">
            <p className="field-label">Board summary</p>
            <p className="mt-2 text-sm text-ink/80">{analysis.summary}</p>

            {analysis.suggestions?.length > 0 && (
              <div className="mt-4 space-y-3">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="border-t border-line pt-3">
                    <p className="text-sm font-medium text-ink">{s.idea}</p>
                    <p className="mt-1 text-xs text-muted">Based on: {s.basedOn}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {loading && <p className="mx-auto mt-8 max-w-6xl px-6 text-sm text-muted">Loading board…</p>}

      {!loading && notes.length === 0 && (
        <p className="mx-auto mt-8 max-w-6xl px-6 text-sm text-muted">
          Your board is empty — add a note above to get started.
        </p>
      )}

      {!loading && notes.length > 0 && (
        <div className="mt-10 w-full overflow-x-auto pb-16">
          <div className="flex gap-5 px-6" style={{ width: "max-content" }}>
            {notes.map((note, i) => (
              <div
                key={note._id}
                className={`group relative shrink-0 snap-start border border-line bg-paper p-5 ${
                  CARD_SIZES[i % CARD_SIZES.length]
                }`}
              >
                <p className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</p>
                {note.type === "image" ? (
                  <img
                    src={note.content}
                    alt="Canvas note"
                    className="mt-3 h-[calc(100%-2rem)] w-full object-cover"
                  />
                ) : (
                  <p className="mt-3 font-display text-lg leading-snug text-ink/90">
                    {note.content}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteNote(note._id)}
                  className="absolute right-3 top-3 text-muted opacity-0 transition-opacity hover:text-red-700 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;