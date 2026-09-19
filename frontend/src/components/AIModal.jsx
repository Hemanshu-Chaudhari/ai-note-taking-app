import React, { useState } from "react";
import {
    Sparkles,
    CheckSquare,
    MessageSquare,
    Wand2,
    Copy,
    Check,
    X,
    Loader2,
    ArrowRight,
    Send
} from "lucide-react";
import api from "../services/api";

function AIModal({ note, isOpen, onClose, onNoteUpdated, onToast }) {
    if (!isOpen || !note) return null;

    const [activeTab, setActiveTab] = useState("summary"); // 'summary' | 'actions' | 'ask' | 'enhance'
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // States for each AI feature
    const [summary, setSummary] = useState(note.aiSummary || "");
    const [actionItems, setActionItems] = useState(note.aiActionItems || []);
    const [askQuestion, setAskQuestion] = useState("");
    const [askAnswer, setAskAnswer] = useState("");
    const [enhanceMode, setEnhanceMode] = useState("professional");
    const [enhancedPreview, setEnhancedPreview] = useState("");

    // 1. Summarize
    const handleSummarize = async () => {
        try {
            setLoading(true);
            const res = await api.post(`/api/ai/summarize/${note._id}`);
            setSummary(res.data.summary);
            if (res.data.note) {
                onNoteUpdated(res.data.note);
            }
            onToast("Summary generated and saved!", "success");
        } catch (err) {
            console.error("AI summarize error:", err);
            onToast(err.response?.data?.error || err.response?.data?.message || "AI summarization failed", "error");
        } finally {
            setLoading(false);
        }
    };

    // 2. Action Items
    const handleExtractActions = async () => {
        try {
            setLoading(true);
            const res = await api.post(`/api/ai/action-items/${note._id}`);
            setActionItems(res.data.actionItems || []);
            if (res.data.note) {
                onNoteUpdated(res.data.note);
            }
            onToast("Action items extracted and saved!", "success");
        } catch (err) {
            console.error("AI action items error:", err);
            onToast(err.response?.data?.error || err.response?.data?.message || "Failed to extract action items", "error");
        } finally {
            setLoading(false);
        }
    };

    // 3. Ask AI
    const handleAskQuestion = async (e) => {
        if (e) e.preventDefault();
        if (!askQuestion.trim()) return;

        try {
            setLoading(true);
            const res = await api.post(`/api/ai/ask/${note._id}`, {
                question: askQuestion.trim()
            });
            setAskAnswer(res.data.answer);
        } catch (err) {
            console.error("AI ask error:", err);
            onToast(err.response?.data?.error || err.response?.data?.message || "Failed to get AI answer", "error");
        } finally {
            setLoading(false);
        }
    };

    // 4. Enhance
    const handleEnhance = async () => {
        try {
            setLoading(true);
            const res = await api.post("/api/ai/enhance", {
                text: note.content,
                mode: enhanceMode
            });
            setEnhancedPreview(res.data.enhancedText);
            onToast("Text enhanced successfully!", "success");
        } catch (err) {
            console.error("AI enhance error:", err);
            onToast(err.response?.data?.error || err.response?.data?.message || "Failed to enhance text", "error");
        } finally {
            setLoading(false);
        }
    };

    const applyEnhancedText = async () => {
        if (!enhancedPreview) return;
        try {
            setLoading(true);
            const res = await api.put(`/api/notes/${note._id}`, {
                content: enhancedPreview
            });
            onNoteUpdated(res.data.note);
            onToast("Enhanced text applied to note!", "success");
            onClose();
        } catch (err) {
            console.error("Apply enhance error:", err);
            onToast("Failed to update note", "error");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        onToast("Copied to clipboard!", "success");
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="ai-modal-header">
                    <div className="ai-modal-title">
                        <div className="sparkle-badge">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h3>AI Assistant</h3>
                            <p className="ai-modal-sub">
                                {note.title ? note.title : "Untitled Note"}
                            </p>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="ai-modal-tabs">
                    <button
                        className={`ai-tab ${activeTab === "summary" ? "active" : ""}`}
                        onClick={() => setActiveTab("summary")}
                    >
                        <Sparkles size={15} />
                        <span>Summary</span>
                    </button>
                    <button
                        className={`ai-tab ${activeTab === "actions" ? "active" : ""}`}
                        onClick={() => setActiveTab("actions")}
                    >
                        <CheckSquare size={15} />
                        <span>Action Items</span>
                    </button>
                    <button
                        className={`ai-tab ${activeTab === "ask" ? "active" : ""}`}
                        onClick={() => setActiveTab("ask")}
                    >
                        <MessageSquare size={15} />
                        <span>Ask Note</span>
                    </button>
                    <button
                        className={`ai-tab ${activeTab === "enhance" ? "active" : ""}`}
                        onClick={() => setActiveTab("enhance")}
                    >
                        <Wand2 size={15} />
                        <span>Polish & Rewrite</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="ai-modal-body">
                    {/* 1. SUMMARY TAB */}
                    {activeTab === "summary" && (
                        <div className="ai-feature-view">
                            <div className="feature-intro">
                                <p>Get a quick, clear bullet-point summary and key takeaway using Gemini AI.</p>
                                <button
                                    className="btn-primary-ai"
                                    onClick={handleSummarize}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="spin" />
                                            <span>Analyzing Note...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            <span>{summary ? "Regenerate Summary" : "Generate Summary"}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {summary && (
                                <div className="ai-result-box">
                                    <div className="ai-result-header">
                                        <h4>AI Summary</h4>
                                        <button
                                            className="btn-icon"
                                            onClick={() => copyToClipboard(summary)}
                                            title="Copy summary"
                                        >
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <div className="ai-result-text formatted-ai-text">
                                        {summary}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. ACTION ITEMS TAB */}
                    {activeTab === "actions" && (
                        <div className="ai-feature-view">
                            <div className="feature-intro">
                                <p>Extract tasks, deadlines, and checklists automatically from your note.</p>
                                <button
                                    className="btn-primary-ai"
                                    onClick={handleExtractActions}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="spin" />
                                            <span>Extracting Tasks...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckSquare size={16} />
                                            <span>{actionItems.length ? "Re-Extract Tasks" : "Extract Action Items"}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {actionItems.length > 0 && (
                                <div className="ai-result-box">
                                    <div className="ai-result-header">
                                        <h4>Checklist ({actionItems.length} tasks)</h4>
                                        <button
                                            className="btn-icon"
                                            onClick={() => copyToClipboard(actionItems.map(item => `• ${item}`).join("\n"))}
                                            title="Copy task list"
                                        >
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <ul className="action-items-list">
                                        {actionItems.map((item, idx) => (
                                            <li key={idx} className="action-item-row">
                                                <input type="checkbox" id={`ai-item-${idx}`} />
                                                <label htmlFor={`ai-item-${idx}`}>{item}</label>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. ASK NOTE TAB */}
                    {activeTab === "ask" && (
                        <div className="ai-feature-view">
                            <div className="feature-intro">
                                <p>Ask questions specifically about this note. Gemini answers using note context.</p>
                            </div>

                            <form onSubmit={handleAskQuestion} className="ai-ask-input-group">
                                <input
                                    type="text"
                                    placeholder="e.g. What are the key points? What deadlines are mentioned?"
                                    value={askQuestion}
                                    onChange={(e) => setAskQuestion(e.target.value)}
                                    disabled={loading}
                                />
                                <button type="submit" disabled={loading || !askQuestion.trim()} className="btn-send">
                                    {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                                </button>
                            </form>

                            {askAnswer && (
                                <div className="ai-result-box">
                                    <div className="ai-result-header">
                                        <h4>Answer</h4>
                                        <button
                                            className="btn-icon"
                                            onClick={() => copyToClipboard(askAnswer)}
                                            title="Copy answer"
                                        >
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <div className="ai-result-text">{askAnswer}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. POLISH & REWRITE TAB */}
                    {activeTab === "enhance" && (
                        <div className="ai-feature-view">
                            <div className="feature-intro">
                                <p>Enhance the quality, tone, or formatting of your note with one click.</p>
                                <div className="enhance-pills">
                                    <button
                                        type="button"
                                        className={`pill-btn ${enhanceMode === "professional" ? "active" : ""}`}
                                        onClick={() => setEnhanceMode("professional")}
                                    >
                                        💼 Professional
                                    </button>
                                    <button
                                        type="button"
                                        className={`pill-btn ${enhanceMode === "fix_grammar" ? "active" : ""}`}
                                        onClick={() => setEnhanceMode("fix_grammar")}
                                    >
                                        ✨ Fix Grammar
                                    </button>
                                    <button
                                        type="button"
                                        className={`pill-btn ${enhanceMode === "concise" ? "active" : ""}`}
                                        onClick={() => setEnhanceMode("concise")}
                                    >
                                        ⚡ Make Concise
                                    </button>
                                    <button
                                        type="button"
                                        className={`pill-btn ${enhanceMode === "bulletize" ? "active" : ""}`}
                                        onClick={() => setEnhanceMode("bulletize")}
                                    >
                                        📑 Bullet Points
                                    </button>
                                </div>

                                <button
                                    className="btn-primary-ai"
                                    onClick={handleEnhance}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="spin" />
                                            <span>Polishing Text...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 size={16} />
                                            <span>Enhance Note</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {enhancedPreview && (
                                <div className="ai-result-box">
                                    <div className="ai-result-header">
                                        <h4>Enhanced Preview</h4>
                                        <div className="result-actions-group">
                                            <button
                                                className="btn-secondary-sm"
                                                onClick={() => copyToClipboard(enhancedPreview)}
                                            >
                                                {copied ? <Check size={14} /> : <Copy size={14} />} Copy
                                            </button>
                                            <button
                                                className="btn-accent-sm"
                                                onClick={applyEnhancedText}
                                                disabled={loading}
                                            >
                                                <ArrowRight size={14} /> Replace in Note
                                            </button>
                                        </div>
                                    </div>
                                    <div className="ai-result-text">{enhancedPreview}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AIModal;
