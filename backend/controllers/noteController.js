import mongoose from "mongoose";
import Note from "../models/Note.js";

// Helper to validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create Note
export const createNote = async (req, res) => {
    try {
        const { title = "", content, color = "default", tags = [], isPinned = false } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: "Note content is required"
            });
        }

        // Process tags if passed as comma-separated string or array
        const processedTags = Array.isArray(tags)
            ? tags.map((t) => t.trim()).filter(Boolean)
            : typeof tags === "string"
            ? tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [];

        const note = await Note.create({
            title: title ? title.trim() : "",
            content: content.trim(),
            color,
            tags: processedTags,
            isPinned: Boolean(isPinned),
            userId: req.userId
        });

        res.status(201).json({
            message: "Note created successfully",
            note
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// Get all notes of logged-in user with search, tag filter, and pinned priority
export const getNotes = async (req, res) => {
    try {
        const { search, tag } = req.query;

        const query = {
            userId: req.userId
        };

        if (tag && tag.trim()) {
            query.tags = tag.trim();
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.$or = [
                { title: regex },
                { content: regex },
                { tags: regex }
            ];
        }

        const notes = await Note.find(query).sort({
            isPinned: -1,
            updatedAt: -1
        });

        res.status(200).json({
            notes,
            count: notes.length
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// Update Note
export const updateNote = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid note ID"
            });
        }

        const { title, content, color, tags, isPinned, aiSummary, aiActionItems } = req.body;

        const updateData = {};

        if (title !== undefined) updateData.title = title.trim();
        if (content !== undefined) {
            if (!content.trim()) {
                return res.status(400).json({
                    message: "Content cannot be empty"
                });
            }
            updateData.content = content.trim();
        }
        if (color !== undefined) updateData.color = color;
        if (isPinned !== undefined) updateData.isPinned = Boolean(isPinned);
        if (aiSummary !== undefined) updateData.aiSummary = aiSummary;
        if (aiActionItems !== undefined) updateData.aiActionItems = aiActionItems;

        if (tags !== undefined) {
            updateData.tags = Array.isArray(tags)
                ? tags.map((t) => t.trim()).filter(Boolean)
                : typeof tags === "string"
                ? tags.split(",").map((t) => t.trim()).filter(Boolean)
                : [];
        }

        const note = await Note.findOneAndUpdate(
            {
                _id: id,
                userId: req.userId
            },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        res.status(200).json({
            message: "Note updated successfully",
            note
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// Toggle Pin Note
export const togglePinNote = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid note ID"
            });
        }

        const note = await Note.findOne({
            _id: id,
            userId: req.userId
        });

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        note.isPinned = !note.isPinned;
        await note.save();

        res.status(200).json({
            message: note.isPinned ? "Note pinned" : "Note unpinned",
            note
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// Delete Note
export const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid note ID"
            });
        }

        const note = await Note.findOneAndDelete({
            _id: id,
            userId: req.userId
        });

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        res.status(200).json({
            message: "Note deleted successfully",
            deletedId: id
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};