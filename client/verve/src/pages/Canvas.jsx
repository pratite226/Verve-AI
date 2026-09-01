import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { readFileAsDataURL } from "../utils/async";
import { useToast } from "../hooks/useToast.jsx";
import AppLayout, { PageHeader } from "../layouts/AppLayout.jsx";
import { Alert, Button, EmptyState } from "../components/ui.jsx";

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
    <AppLayout>
      <div className="px-6 pb-24 pt-11 sm:px-12">
        <PageHeader
          eyebrow="Canvas"
          title={<>Dump your<br />ideas here</>}
          blurb="Add scattered thoughts below, then ask the AI what content you could make from what's here."
        />

        <div className="mt-8 flex max-w-[760px] flex-wrap items-end gap-3">
          <input
            className="verve-field min-w-[220px] flex-1"
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
          <Button variant="ghost" onClick={handleAddNote} loading={adding} className="shrink-0">
            {adding ? "Adding…" : "Add note"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileSelected}
            className="hidden"
          />
          <Button variant="ghost" onClick={() => fileInputRef.current?.click()} className="shrink-0">
            Add image
          </Button>
          <Button onClick={handleAnalyze} disabled={notes.length === 0} loading={analyzing} className="shrink-0">
            {analyzing ? "Reading board…" : "Analyze board"}
          </Button>
        </div>

        {imagePreview && (
          <div className="verve-card mt-5 flex flex-wrap items-center gap-4 p-4">
            <img src={imagePreview.dataUrl} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleConfirmImage} loading={uploading}>
                {uploading ? "Uploading…" : "Add to board"}
              </Button>
              <Button variant="ghost" onClick={() => setImagePreview(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {analyzeError && <Alert className="mt-5">{analyzeError}</Alert>}

        {analysis && (
          <div className="mt-9 rounded-2xl border border-tint-bd bg-tint px-[30px] py-7">
            <div className="verve-label text-accent">Board analysis</div>
            <p className="mt-3.5 max-w-[820px] text-[19px] leading-[1.5] tracking-[-0.015em] text-head">{analysis.summary}</p>
            {analysis.suggestions?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2.5">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="rounded-full border border-tint-bd bg-panel px-4 py-2.5">
                    <p className="text-sm font-medium text-text">{s.idea}</p>
                    {s.basedOn && <p className="mt-0.5 text-xs text-muted">Based on: {s.basedOn}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && <p className="mt-9 text-sm text-muted">Loading board…</p>}

        {!loading && notes.length === 0 && (
          <EmptyState className="mt-9" label="Empty board">
            Half-thoughts welcome. The AI reads the whole board at once.
          </EmptyState>
        )}

        {!loading && notes.length > 0 && (
          <div className="mt-9 columns-1 gap-3.5 sm:columns-2 lg:columns-4">
            {notes.map((note, i) => (
              <div
                key={note._id}
                className="verve-card verve-card-interactive group relative mb-3.5 break-inside-avoid p-5"
              >
                <p className="font-mono text-[9px] text-faint">{String(i + 1).padStart(2, "0")}</p>
                {note.type === "image" ? (
                  <img src={note.content} alt="Canvas note" className="mt-3 w-full rounded-lg object-cover" />
                ) : (
                  <p className="mt-3 text-lg leading-snug text-text">{note.content}</p>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteNote(note._id)}
                  className="absolute right-3 top-3 text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Canvas;
