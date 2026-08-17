function NoteCard({
    note,
    onEdit,
    onDelete,
    onSummarize,
    aiLoading,
    summaryNoteId,
    summary
}) {
    return (
        <div className="note-card">

            <h3>
                {note.title}
            </h3>

            <p>
                {note.content}
            </p>

            <small>
                Created:{" "}
                {new Date(
                    note.createdAt
                ).toLocaleDateString()}
            </small>

            <div className="note-actions">

                <button
                    onClick={() => onEdit(note)}
                >
                    Edit
                </button>

                <button
                    className="delete-btn"
                    onClick={() => onDelete(note._id)}
                >
                    Delete
                </button>

                <button
                    className="ai-btn"
                    onClick={() =>
                        onSummarize(note._id)
                    }
                    disabled={
                        aiLoading &&
                        summaryNoteId === note._id
                    }
                >
                    {aiLoading &&
                    summaryNoteId === note._id
                        ? "✨ Thinking..."
                        : "✨ Summarize"}
                </button>

            </div>

            {summaryNoteId === note._id &&
                summary && (
                    <div className="ai-summary">

                        <h4>
                            ✨ AI Summary
                        </h4>

                        <p>
                            {summary}
                        </p>

                    </div>
                )}

        </div>
    );
}

export default NoteCard;