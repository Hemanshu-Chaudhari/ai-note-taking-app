import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

import SearchBar from "../components/SearchBar";
import NoteCard from "../components/NoteCard";


function Dashboard() {

    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    const token = localStorage.getItem("token");


    // =========================
    // STATES
    // =========================

    const [notes, setNotes] = useState([]);

    const [title, setTitle] = useState("");

    const [content, setContent] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");

    // Search
    const [search, setSearch] = useState("");

    // AI
    const [summary, setSummary] = useState("");

    const [summaryNoteId, setSummaryNoteId] =
        useState(null);

    const [aiLoading, setAiLoading] =
        useState(false);


    // =========================
    // CONFIG
    // =========================

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };


    // =========================
    // GET NOTES
    // =========================

    const fetchNotes = async () => {

        try {

            const response = await api.get(
                "/api/notes",
                config
            );

            setNotes(
                response.data.notes
            );

        } catch (error) {

            console.log(
                "GET NOTES ERROR:",
                error.response?.data
            );

            if (
                error.response?.status === 401
            ) {
                logout();
            }
        }
    };


    // =========================
    // LOAD NOTES
    // =========================

    useEffect(() => {

        if (!token) {

            navigate("/login");

            return;
        }

        fetchNotes();

    }, []);


    // =========================
    // CREATE / UPDATE
    // =========================

    const handleSubmit = async (e) => {

        e.preventDefault();


        if (
            !title.trim() ||
            !content.trim()
        ) {

            setMessage(
                "Title and content are required"
            );

            return;
        }


        try {

            setLoading(true);

            setMessage("");


            if (editingId) {

                await api.put(
                    `/api/notes/${editingId}`,
                    {
                        title,
                        content
                    },
                    config
                );

                setMessage(
                    "Note updated successfully"
                );

            } else {

                await api.post(
                    "/api/notes",
                    {
                        title,
                        content
                    },
                    config
                );

                setMessage(
                    "Note created successfully"
                );
            }


            setTitle("");

            setContent("");

            setEditingId(null);


            await fetchNotes();

        } catch (error) {

            console.log(
                "NOTE ERROR:",
                error.response?.data
            );

            setMessage(
                error.response?.data?.message ||
                "Something went wrong"
            );

        } finally {

            setLoading(false);
        }
    };


    // =========================
    // EDIT
    // =========================

    const handleEdit = (note) => {

        setTitle(note.title);

        setContent(note.content);

        setEditingId(note._id);

        setMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


    // =========================
    // CANCEL EDIT
    // =========================

    const cancelEdit = () => {

        setTitle("");

        setContent("");

        setEditingId(null);

        setMessage("");
    };


    // =========================
    // DELETE
    // =========================

    const handleDelete = async (id) => {

        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this note?"
            );


        if (!confirmDelete) {

            return;
        }


        try {

            await api.delete(
                `/api/notes/${id}`,
                config
            );


            setMessage(
                "Note deleted successfully"
            );


            if (
                summaryNoteId === id
            ) {

                setSummary("");

                setSummaryNoteId(null);
            }


            await fetchNotes();

        } catch (error) {

            console.log(
                "DELETE ERROR:",
                error.response?.data
            );

            setMessage(
                error.response?.data?.message ||
                "Delete failed"
            );
        }
    };


    // =========================
    // AI SUMMARIZE
    // =========================

    const handleSummarize = async (
        noteId
    ) => {

        try {

            setAiLoading(true);

            setSummary("");

            setSummaryNoteId(
                noteId
            );


            const response =
                await api.post(
                    `/api/ai/summarize/${noteId}`,
                    {},
                    config
                );


            setSummary(
                response.data.summary
            );

        } catch (error) {

            console.log(
                "AI ERROR:",
                error.response?.data
            );

            setSummary(
                error.response?.data?.message ||
                "AI summarization failed"
            );

        } finally {

            setAiLoading(false);
        }
    };


    // =========================
    // LOGOUT
    // =========================

    const logout = () => {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

        navigate("/login");
    };


    // =========================
    // SEARCH
    // =========================

    const filteredNotes =
        notes.filter((note) => {

            const searchText =
                search.toLowerCase();

            return (
                note.title
                    .toLowerCase()
                    .includes(searchText) ||

                note.content
                    .toLowerCase()
                    .includes(searchText)
            );
        });


    // =========================
    // UI
    // =========================

    return (

        <div className="dashboard">


            {/* NAVBAR */}

            <nav className="navbar">

                <h2>
                    📝 Note Taking App
                </h2>


                <div className="nav-right">

                    <span>
                        {user?.name}
                    </span>


                    <button
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>

            </nav>


            {/* MAIN */}

            <main className="dashboard-content">


                <h1>
                    Welcome, {user?.name} 👋
                </h1>


                <p className="subtitle">
                    Create and manage your notes.
                </p>


                {/* CREATE / EDIT */}

                <div className="note-form">

                    <h2>

                        {editingId
                            ? "Edit Note"
                            : "Create Note"}

                    </h2>


                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >

                        <input
                            type="text"
                            placeholder="Note title"
                            value={title}
                            onChange={(e) =>
                                setTitle(
                                    e.target.value
                                )
                            }
                        />


                        <textarea
                            placeholder="Write your note..."
                            value={content}
                            onChange={(e) =>
                                setContent(
                                    e.target.value
                                )
                            }
                            rows="6"
                        />


                        <div className="form-buttons">

                            <button
                                type="submit"
                                disabled={loading}
                            >

                                {loading
                                    ? "Saving..."
                                    : editingId
                                    ? "Update Note"
                                    : "Create Note"}

                            </button>


                            {editingId && (

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={
                                        cancelEdit
                                    }
                                >
                                    Cancel
                                </button>

                            )}

                        </div>

                    </form>


                    {message && (

                        <p className="message">
                            {message}
                        </p>

                    )}

                </div>


                {/* NOTES */}

                <div className="notes-section">


                    <div className="notes-header">

                        <h2>
                            My Notes
                        </h2>

                        <span>
                            {filteredNotes.length} notes
                        </span>

                    </div>


                    {/* SEARCH */}

                    <SearchBar
                        search={search}
                        setSearch={setSearch}
                    />


                    {/* EMPTY */}

                    {filteredNotes.length ===
                    0 ? (

                        <div className="empty-state">

                            <h3>
                                {search
                                    ? "No notes found"
                                    : "No notes yet"}
                            </h3>


                            <p>

                                {search
                                    ? "Try another search."
                                    : "Create your first note above."}

                            </p>

                        </div>

                    ) : (


                        /* NOTE GRID */

                        <div className="notes-grid">

                            {filteredNotes.map(
                                (note) => (

                                    <NoteCard
                                        key={
                                            note._id
                                        }

                                        note={note}

                                        onEdit={
                                            handleEdit
                                        }

                                        onDelete={
                                            handleDelete
                                        }

                                        onSummarize={
                                            handleSummarize
                                        }

                                        aiLoading={
                                            aiLoading
                                        }

                                        summaryNoteId={
                                            summaryNoteId
                                        }

                                        summary={
                                            summary
                                        }
                                    />

                                )
                            )}

                        </div>

                    )}

                </div>

            </main>

        </div>
    );
}

export default Dashboard;