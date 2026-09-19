import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import {
    Plus,
    Sparkles,
    Sun,
    Moon,
    LogOut,
    Check,
    Pin,
    Tag,
    Palette,
    Download,
    FileText,
    Wand2,
    Loader2,
    X
} from "lucide-react";

import api from "../services/api";
import SearchBar from "../components/SearchBar";
import NoteCard from "../components/NoteCard";
import AIModal from "../components/AIModal";
import Toast from "../components/Toast";

const COLOR_OPTIONS = [
    { id: "default", name: "Default", bg: "var(--card-bg)" },
    { id: "amber", name: "Warm Amber", bg: "#fef3c7" },
    { id: "emerald", name: "Mint Green", bg: "#d1fae5" },
    { id: "sky", name: "Soft Blue", bg: "#e0f2fe" },
    { id: "rose", name: "Blush Pink", bg: "#ffe4e6" },
    { id: "violet", name: "Lilac Purple", bg: "#ede9fe" }
];

function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    // Theme state
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    // Notes state with local cache for instant 0ms load
    const [notes, setNotes] = useState(() => {
        try {
            const cached = localStorage.getItem("cached_notes");
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });

    // Form states
    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [color, setColor] = useState("default");
    const [tagsInput, setTagsInput] = useState("");
    const [isPinned, setIsPinned] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [aiSuggesting, setAiSuggesting] = useState(false);

    // Search and filter states
    const [search, setSearch] = useState("");
    const [selectedTag, setSelectedTag] = useState(null);
    const [filterPinnedOnly, setFilterPinnedOnly] = useState(false);

    // AI Modal states
    const [activeAiNote, setActiveAiNote] = useState(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState({ message: "", type: "info" });

    const showToast = (message, type = "info") => {
        setToast({ message, type });
    };

    const formRef = useRef(null);
    const contentTextareaRef = useRef(null);

    // Save notes to localStorage cache whenever updated
    useEffect(() => {
        try {
            localStorage.setItem("cached_notes", JSON.stringify(notes));
        } catch (e) {
            console.error("Cache save error:", e);
        }
    }, [notes]);

    // Fetch notes from server
    const fetchNotes = async () => {
        try {
            const response = await api.get("/api/notes");
            setNotes(response.data.notes || []);
        } catch (error) {
            console.error("Fetch notes error:", error);
            if (error.response?.status === 401) {
                logout();
            }
        }
    };

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchNotes();
    }, [token]);

    // Global keyboard shortcuts (Ctrl+K for search, Ctrl+N for new note, Esc)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                const searchInput = document.querySelector(".search-input-wrapper input");
                if (searchInput) searchInput.focus();
            } else if ((e.ctrlKey || e.metaKey) && e.key === "n" && !isAiModalOpen) {
                e.preventDefault();
                setIsFormExpanded(true);
                setTimeout(() => contentTextareaRef.current?.focus(), 50);
            } else if (e.key === "Escape") {
                if (isAiModalOpen) {
                    setIsAiModalOpen(false);
                } else if (editingId) {
                    cancelEdit();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isAiModalOpen, editingId]);

    // Extract all unique tags across all notes
    const availableTags = useMemo(() => {
        const set = new Set();
        notes.forEach((n) => {
            if (Array.isArray(n.tags)) {
                n.tags.forEach((t) => set.add(t));
            }
        });
        return Array.from(set);
    }, [notes]);

    // Filter notes
    const filteredNotes = useMemo(() => {
        return notes.filter((note) => {
            // Search query filter
            if (search.trim()) {
                const q = search.toLowerCase();
                const matchesTitle = note.title?.toLowerCase().includes(q);
                const matchesContent = note.content?.toLowerCase().includes(q);
                const matchesTags = note.tags?.some((t) => t.toLowerCase().includes(q));
                if (!matchesTitle && !matchesContent && !matchesTags) return false;
            }

            // Tag filter
            if (selectedTag) {
                if (!note.tags || !note.tags.includes(selectedTag)) return false;
            }

            // Pinned only filter
            if (filterPinnedOnly) {
                if (!note.isPinned) return false;
            }

            return true;
        });
    }, [notes, search, selectedTag, filterPinnedOnly]);

    // Separate into Pinned & Other notes
    const pinnedNotes = useMemo(() => {
        return filteredNotes.filter((n) => n.isPinned);
    }, [filteredNotes]);

    const otherNotes = useMemo(() => {
        return filteredNotes.filter((n) => !n.isPinned);
    }, [filteredNotes]);

    // Create or Update Note with Optimistic UI updates
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!content.trim()) {
            showToast("Note content cannot be empty", "error");
            return;
        }

        const tagsArray = tagsInput
            .split(",")
            .map((t) => t.trim().replace(/^#/, ""))
            .filter(Boolean);

        const payload = {
            title: title.trim(),
            content: content.trim(),
            color,
            tags: tagsArray,
            isPinned
        };

        try {
            setFormLoading(true);

            if (editingId) {
                // Optimistic update
                const previousNotes = [...notes];
                setNotes((prev) =>
                    prev.map((n) =>
                        n._id === editingId ? { ...n, ...payload, updatedAt: new Date().toISOString() } : n
                    )
                );

                const res = await api.put(`/api/notes/${editingId}`, payload);
                // Update with server returned note
                setNotes((prev) =>
                    prev.map((n) => (n._id === editingId ? res.data.note : n))
                );

                showToast("Note updated successfully!", "success");
                cancelEdit();
            } else {
                // Optimistic creation
                const tempId = "temp_" + Date.now();
                const optimisticNote = {
                    _id: tempId,
                    ...payload,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                setNotes((prev) => [optimisticNote, ...prev]);

                // Reset form
                setTitle("");
                setContent("");
                setColor("default");
                setTagsInput("");
                setIsPinned(false);
                setIsFormExpanded(false);

                // Fire celebratory confetti!
                confetti({
                    particleCount: 35,
                    spread: 60,
                    origin: { y: 0.85 }
                });

                const res = await api.post("/api/notes", payload);

                // Replace optimistic note with real server note
                setNotes((prev) =>
                    prev.map((n) => (n._id === tempId ? res.data.note : n))
                );

                showToast("Note created successfully!", "success");
            }
        } catch (error) {
            console.error("Submit note error:", error);
            showToast(error.response?.data?.message || "Failed to save note", "error");
            // Re-fetch to sync
            fetchNotes();
        } finally {
            setFormLoading(false);
        }
    };

    // Toggle Pin with instant optimistic update
    const handleTogglePin = async (id) => {
        // Optimistic toggle
        setNotes((prev) =>
            prev.map((n) => (n._id === id ? { ...n, isPinned: !n.isPinned } : n))
        );

        try {
            const res = await api.patch(`/api/notes/${id}/pin`);
            setNotes((prev) =>
                prev.map((n) => (n._id === id ? res.data.note : n))
            );
            showToast(res.data.message, "info");
        } catch (error) {
            console.error("Toggle pin error:", error);
            showToast("Failed to update pin", "error");
            fetchNotes();
        }
    };

    // Edit Note
    const handleEdit = (note) => {
        setTitle(note.title || "");
        setContent(note.content || "");
        setColor(note.color || "default");
        setTagsInput(note.tags ? note.tags.join(", ") : "");
        setIsPinned(Boolean(note.isPinned));
        setEditingId(note._id);
        setIsFormExpanded(true);

        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => contentTextareaRef.current?.focus(), 200);
    };

    // Cancel Edit
    const cancelEdit = () => {
        setTitle("");
        setContent("");
        setColor("default");
        setTagsInput("");
        setIsPinned(false);
        setEditingId(null);
        setIsFormExpanded(false);
    };

    // Delete Note with instant optimistic update
    const handleDelete = async (id) => {
        const noteToDelete = notes.find((n) => n._id === id);
        const confirmDelete = window.confirm(
            `Delete "${noteToDelete?.title || "this note"}"?`
        );
        if (!confirmDelete) return;

        // Optimistic delete
        setNotes((prev) => prev.filter((n) => n._id !== id));
        showToast("Note deleted", "info");

        try {
            await api.delete(`/api/notes/${id}`);
        } catch (error) {
            console.error("Delete note error:", error);
            showToast("Failed to delete note from server", "error");
            fetchNotes();
        }
    };

    // AI Suggest Title & Tags right inside the note editor
    const handleAiSuggest = async () => {
        if (!content.trim()) {
            showToast("Write some note content first to get AI suggestions", "info");
            return;
        }

        try {
            setAiSuggesting(true);
            const res = await api.post("/api/ai/suggest-tags", {
                content: content.trim()
            });

            if (res.data?.suggestions) {
                const { title: suggestedTitle, tags: suggestedTags } = res.data.suggestions;
                if (suggestedTitle && !title.trim()) {
                    setTitle(suggestedTitle);
                }
                if (suggestedTags && suggestedTags.length > 0) {
                    const existing = tagsInput ? tagsInput.split(",").map((t) => t.trim()) : [];
                    const combined = Array.from(new Set([...existing, ...suggestedTags])).filter(Boolean);
                    setTagsInput(combined.join(", "));
                }
                showToast("✨ AI suggested a title and tags!", "success");
            }
        } catch (err) {
            console.error("AI suggest error:", err);
            showToast("Failed to generate suggestions", "error");
        } finally {
            setAiSuggesting(false);
        }
    };

    // AI Polish Draft directly inside the note editor
    const handleAiPolishDraft = async () => {
        if (!content.trim()) {
            showToast("Write some content first to polish", "info");
            return;
        }

        try {
            setAiSuggesting(true);
            const res = await api.post("/api/ai/enhance", {
                text: content.trim(),
                mode: "professional"
            });
            if (res.data?.enhancedText) {
                setContent(res.data.enhancedText);
                showToast("✨ Draft polished by AI!", "success");
            }
        } catch (err) {
            console.error("AI polish draft error:", err);
            showToast("Failed to polish draft", "error");
        } finally {
            setAiSuggesting(false);
        }
    };

    // Open AI Assistant Modal
    const handleOpenAIModal = (note) => {
        setActiveAiNote(note);
        setIsAiModalOpen(true);
    };

    // Update note in state when AI updates it
    const handleNoteUpdated = (updatedNote) => {
        setNotes((prev) =>
            prev.map((n) => (n._id === updatedNote._id ? updatedNote : n))
        );
        setActiveAiNote(updatedNote);
    };

    // Export all notes as JSON backup
    const handleExportBackup = () => {
        if (!notes.length) {
            showToast("No notes to export", "info");
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `mindkeep_notes_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast("Notes exported as JSON backup!", "success");
    };

    // Logout
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("cached_notes");
        navigate("/login");
    };

    return (
        <div className="dashboard-wrapper">
            {/* Top Notification Toast */}
            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ message: "", type: "info" })}
            />

            {/* AI Assistant Modal */}
            <AIModal
                note={activeAiNote}
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onNoteUpdated={handleNoteUpdated}
                onToast={showToast}
            />

            {/* TOP NAVIGATION BAR */}
            <header className="app-navbar">
                <div className="nav-brand">
                    <div className="brand-icon">
                        <Sparkles size={20} />
                    </div>
                    <span className="brand-text">MindKeep</span>
                    <span className="brand-badge">AI</span>
                </div>

                <div className="nav-actions">
                    <button
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <button
                        className="btn-backup"
                        onClick={handleExportBackup}
                        title="Export notes backup"
                    >
                        <Download size={16} />
                        <span className="btn-text-desktop">Backup</span>
                    </button>

                    <div className="user-profile-pill">
                        <div className="user-avatar">
                            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <span className="user-name-label">{user?.name}</span>
                    </div>

                    <button
                        className="btn-logout"
                        onClick={logout}
                        title="Log out"
                        aria-label="Log out"
                    >
                        <LogOut size={16} />
                        <span className="btn-text-desktop">Logout</span>
                    </button>
                </div>
            </header>

            {/* MAIN DASHBOARD CONTENT */}
            <main className="main-container">
                {/* INLINE NOTE CREATION / EDITING WIDGET */}
                <div
                    ref={formRef}
                    className={`note-input-widget note-card-color-${color} ${isFormExpanded ? "expanded" : "collapsed"}`}
                >
                    <form onSubmit={handleSubmit}>
                        {/* Note Title (shown when expanded) */}
                        {isFormExpanded && (
                            <div className="widget-title-row">
                                <input
                                    type="text"
                                    placeholder="Title (optional)"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="widget-title-input"
                                />
                                <button
                                    type="button"
                                    className={`pin-btn ${isPinned ? "pinned" : ""}`}
                                    onClick={() => setIsPinned(!isPinned)}
                                    title={isPinned ? "Unpin note" : "Pin note to top"}
                                >
                                    <Pin size={16} />
                                </button>
                            </div>
                        )}

                        {/* Note Content Textarea */}
                        <textarea
                            ref={contentTextareaRef}
                            placeholder={isFormExpanded ? "Write your note here... (Markdown supported)" : "Take a note... (Ctrl+N)"}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onFocus={() => setIsFormExpanded(true)}
                            rows={isFormExpanded ? 5 : 1}
                            className="widget-content-input"
                            onKeyDown={(e) => {
                                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />

                        {/* Expanded Controls & Tools */}
                        {isFormExpanded && (
                            <div className="widget-controls">
                                {/* Tag Input */}
                                <div className="widget-tag-row">
                                    <Tag size={14} className="tag-input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Add tags separated by comma (e.g. Work, Ideas)"
                                        value={tagsInput}
                                        onChange={(e) => setTagsInput(e.target.value)}
                                        className="widget-tag-input"
                                    />
                                </div>

                                {/* Color Picker & AI Assist Buttons */}
                                <div className="widget-bottom-toolbar">
                                    <div className="toolbar-left">
                                        {/* Color Options */}
                                        <div className="color-picker-dots">
                                            {COLOR_OPTIONS.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    className={`color-dot color-dot-${c.id} ${color === c.id ? "selected" : ""}`}
                                                    onClick={() => setColor(c.id)}
                                                    title={c.name}
                                                >
                                                    {color === c.id && <Check size={10} />}
                                                </button>
                                            ))}
                                        </div>

                                        {/* AI Assist Buttons */}
                                        <div className="widget-ai-tools">
                                            <button
                                                type="button"
                                                className="btn-ai-sm"
                                                onClick={handleAiSuggest}
                                                disabled={aiSuggesting || !content.trim()}
                                                title="Suggest Title & Tags"
                                            >
                                                {aiSuggesting ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
                                                <span>Suggest Title/Tags</span>
                                            </button>

                                            <button
                                                type="button"
                                                className="btn-ai-sm"
                                                onClick={handleAiPolishDraft}
                                                disabled={aiSuggesting || !content.trim()}
                                                title="Improve Draft Grammar & Tone"
                                            >
                                                <Wand2 size={13} />
                                                <span>Polish</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="toolbar-right">
                                        <button
                                            type="button"
                                            className="btn-cancel"
                                            onClick={cancelEdit}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn-save"
                                            disabled={formLoading || !content.trim()}
                                        >
                                            {formLoading ? (
                                                <>
                                                    <Loader2 size={14} className="spin" />
                                                    <span>Saving...</span>
                                                </>
                                            ) : (
                                                <span>{editingId ? "Update Note" : "Save Note"}</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* SEARCH & FILTERS */}
                <SearchBar
                    search={search}
                    setSearch={setSearch}
                    availableTags={availableTags}
                    selectedTag={selectedTag}
                    setSelectedTag={setSelectedTag}
                    filterPinnedOnly={filterPinnedOnly}
                    setFilterPinnedOnly={setFilterPinnedOnly}
                />

                {/* PINNED NOTES SECTION (Rendered if any pinned notes exist) */}
                {pinnedNotes.length > 0 && (
                    <section className="notes-group-section">
                        <div className="section-label">
                            <Pin size={14} className="section-icon" />
                            <span>PINNED ({pinnedNotes.length})</span>
                        </div>
                        <div className="notes-grid">
                            {pinnedNotes.map((note) => (
                                <NoteCard
                                    key={note._id}
                                    note={note}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onTogglePin={handleTogglePin}
                                    onOpenAIModal={handleOpenAIModal}
                                    onTagClick={(tag) => setSelectedTag(tag)}
                                    onToast={showToast}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* ALL / OTHER NOTES SECTION */}
                <section className="notes-group-section">
                    {pinnedNotes.length > 0 && otherNotes.length > 0 && (
                        <div className="section-label">
                            <FileText size={14} className="section-icon" />
                            <span>OTHER NOTES ({otherNotes.length})</span>
                        </div>
                    )}

                    {filteredNotes.length === 0 ? (
                        <div className="empty-state-card">
                            <div className="empty-state-icon">
                                <Sparkles size={36} />
                            </div>
                            <h3>{search || selectedTag ? "No notes found" : "No notes yet"}</h3>
                            <p>
                                {search || selectedTag
                                    ? "Try adjusting your search terms or filters."
                                    : "Start writing or click 'Take a note...' above to capture your thoughts."}
                            </p>
                        </div>
                    ) : (
                        <div className="notes-grid">
                            {(pinnedNotes.length > 0 ? otherNotes : filteredNotes).map((note) => (
                                <NoteCard
                                    key={note._id}
                                    note={note}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onTogglePin={handleTogglePin}
                                    onOpenAIModal={handleOpenAIModal}
                                    onTagClick={(tag) => setSelectedTag(tag)}
                                    onToast={showToast}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Dashboard;