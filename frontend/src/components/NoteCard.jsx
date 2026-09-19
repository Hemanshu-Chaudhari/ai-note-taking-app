import React, { useState } from "react";
import {
    Pin,
    Sparkles,
    Trash2,
    Edit3,
    Copy,
    Check,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    Clock,
    Tag
} from "lucide-react";

function NoteCard({
    note,
    onEdit,
    onDelete,
    onTogglePin,
    onOpenAIModal,
    onTagClick,
    onToast
}) {
    const [copied, setCopied] = useState(false);
    const [showSummary, setShowSummary] = useState(true);
    const [showActions, setShowActions] = useState(true);

    const handleCopy = (e) => {
        e.stopPropagation();
        const textToCopy = `${note.title ? note.title + "\n\n" : ""}${note.content}`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        onToast("Note copied to clipboard!", "success");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    // Calculate word count
    const words = note.content ? note.content.trim().split(/\s+/).filter(Boolean).length : 0;

    return (
        <div
            className={`note-card note-card-color-${note.color || "default"} ${note.isPinned ? "is-pinned" : ""}`}
        >
            {/* Top Bar: Pin & Actions */}
            <div className="note-card-topbar">
                <div className="note-card-meta">
                    <Clock size={12} className="meta-icon" />
                    <span>{formatDate(note.createdAt)}</span>
                    <span className="meta-dot">•</span>
                    <span>{words} {words === 1 ? "word" : "words"}</span>
                </div>

                <button
                    className={`pin-btn ${note.isPinned ? "pinned" : ""}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(note._id);
                    }}
                    title={note.isPinned ? "Unpin note" : "Pin note to top"}
                    aria-label={note.isPinned ? "Unpin note" : "Pin note to top"}
                >
                    <Pin size={15} />
                </button>
            </div>

            {/* Note Title (ONLY rendered if title exists, removing unwanted blank space!) */}
            {note.title && note.title.trim() && (
                <h3 className="note-title">{note.title.trim()}</h3>
            )}

            {/* Note Content */}
            <p className="note-body">{note.content}</p>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
                <div className="note-tags-row">
                    {note.tags.map((tag, idx) => (
                        <span
                            key={idx}
                            className="note-tag-badge"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onTagClick) onTagClick(tag);
                            }}
                            title={`Filter by #${tag}`}
                        >
                            <Tag size={10} />
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* AI Summary Section (If saved to note) */}
            {note.aiSummary && (
                <div className="note-ai-card ai-summary-card">
                    <div
                        className="note-ai-card-header"
                        onClick={() => setShowSummary(!showSummary)}
                    >
                        <div className="ai-badge-label">
                            <Sparkles size={13} />
                            <span>AI Summary</span>
                        </div>
                        <button className="collapse-btn">
                            {showSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                    {showSummary && (
                        <div className="note-ai-card-body">
                            {note.aiSummary}
                        </div>
                    )}
                </div>
            )}

            {/* AI Action Items Section (If saved to note) */}
            {note.aiActionItems && note.aiActionItems.length > 0 && (
                <div className="note-ai-card ai-actions-card">
                    <div
                        className="note-ai-card-header"
                        onClick={() => setShowActions(!showActions)}
                    >
                        <div className="ai-badge-label">
                            <CheckSquare size={13} />
                            <span>Action Items ({note.aiActionItems.length})</span>
                        </div>
                        <button className="collapse-btn">
                            {showActions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                    {showActions && (
                        <ul className="note-actions-checklist">
                            {note.aiActionItems.map((item, idx) => (
                                <li key={idx} className="note-action-item">
                                    <input type="checkbox" id={`card-task-${note._id}-${idx}`} />
                                    <label htmlFor={`card-task-${note._id}-${idx}`}>{item}</label>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Footer Action Buttons */}
            <div className="note-footer">
                <div className="note-footer-left">
                    <button
                        className="action-btn ai-action-btn"
                        onClick={() => onOpenAIModal(note)}
                        title="Open AI Assistant"
                    >
                        <Sparkles size={14} />
                        <span>AI Tools</span>
                    </button>
                    <button
                        className="action-btn icon-only-btn"
                        onClick={handleCopy}
                        title="Copy note"
                        aria-label="Copy note"
                    >
                        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                </div>

                <div className="note-footer-right">
                    <button
                        className="action-btn edit-btn"
                        onClick={() => onEdit(note)}
                        title="Edit note"
                    >
                        <Edit3 size={14} />
                        <span>Edit</span>
                    </button>
                    <button
                        className="action-btn delete-btn"
                        onClick={() => onDelete(note._id)}
                        title="Delete note"
                        aria-label="Delete note"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NoteCard;