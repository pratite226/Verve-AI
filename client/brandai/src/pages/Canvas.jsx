import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { readFileAsDataURL } from "../utils/async";
import { useToast } from "../hooks/useToast.jsx";
import AppShell from "../components/AppShell.jsx";

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
    e.target.value = "";
    if (!file) return;

    try {
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
    <AppShell>
      <div className="px-12 pb-24 pt-11">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Canvas</div>
        <h1
          className="mt-4 font-display font-extrabold tracking-[-0.04em]"
          style={{ fontSize: "clamp(40px,5vw,80px)", lineHeight: 0.92 }}
        >
          Dump your
          <br />
          ideas here
        </h1>
        <p className="mt-6 max-w-[540px] text-base leading-relaxed text-[#8A867E]">
          Add scattered thoughts below, then ask the AI what content you could make from what's
          here.
        </p>

        <div className="mt-8 flex max-w-[760px] items-end gap-3">
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
          <button type="button" onClick={handleAddNote} disabled={adding} className="btn-secondary shrink-0 disabled:opacity-50">
            {adding ? "Adding…" : "Add note"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary shrink-0">
            Add image
          </button>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || notes.length === 0}
            data-magnetic
            className="btn-primary shrink-0 disabled:opacity-40"
          >
            {analyzing && <span className="spinner" aria-hidden="true" />}
            {analyzing ? "Analyzing…" : "Analyze my board"}
          </button>
        </div>

        {imagePreview && (
          <div className="mt-5 flex items-center gap-4 rounded border border-line bg-paper-raised p-4">
            <img src={imagePreview.dataUrl} alt="Preview" className="h-20 w-20 object-cover" />
            <div className="flex gap-2">
              <button type="button" onClick={handleConfirmImage} disabled={uploading} data-magnetic className="btn-primary disabled:opacity-50">
                {uploading ? "Uploading…" : "Add to board"}
              </button>
              <button type="button" onClick={() => setImagePreview(null)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {analyzeError && (
          <div className="mt-5 rounded-sm border px-4 py-3.5 text-sm" style={{ borderColor: "#4A1F16", background: "#1A0C08", color: "#FF7A55" }}>
            {analyzeError}
          </div>
        )}

        {analysis && (
          <div className="mt-9 rounded border px-[30px] py-7" style={{ borderColor: "#23231F", background: "#101210" }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--color-cobalt)" }}>Board analysis</div>
            <p className="mt-3.5 max-w-[820px] text-[19px] leading-snug tracking-[-0.015em]">{analysis.summary}</p>
            {analysis.suggestions?.length > 0 && (
              <div className="mt-5 flex flex-col gap-3.5">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="border-t border-line pt-3.5">
                    <p className="text-sm font-medium">{s.idea}</p>
                    <p className="mt-1.5 text-xs text-muted">Based on: {s.basedOn}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && <p className="mt-9 text-sm text-muted">Loading board…</p>}

        {!loading && notes.length === 0 && (
          <div className="mt-9 rounded border border-dashed px-10 py-20 text-center" style={{ borderColor: "var(--color-line)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Empty board</div>
            <p className="mx-auto mt-4 max-w-[400px] text-[15px] leading-relaxed text-[#8A867E]">
              Half-thoughts welcome. The AI reads the whole board at once.
            </p>
          </div>
        )}

        {!loading && notes.length > 0 && (
          <div className="mt-9" style={{ columnCount: 4, columnGap: "14px" }}>
            {notes.map((note, i) => (
              <div
                key={note._id}
                className="group relative mb-3.5 break-inside-avoid rounded border border-line bg-paper-raised p-5 transition-colors duration-150 hover:border-[var(--color-cobalt)]"
              >
                <p className="font-mono text-[9px] text-muted">{String(i + 1).padStart(2, "0")}</p>
                {note.type === "image" ? (
                  <img src={note.content} alt="Canvas note" className="mt-3 w-full rounded-sm object-cover" />
                ) : (
                  <p className="mt-3 font-display text-lg leading-snug" style={{ color: "rgba(244,242,238,.9)" }}>
                    {note.content}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteNote(note._id)}
                  className="absolute right-3 top-3 text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default Canvas;
