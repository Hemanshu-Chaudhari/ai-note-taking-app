import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import Note from "../models/Note.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Initialize Gemini Client
const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in backend environment");
    }
    return new GoogleGenAI({ apiKey });
};

// Helper to run interactions safely
const runInteraction = async (prompt) => {
    const ai = getAiClient();
    const interaction = await ai.interactions.create({
        model: "gemini-3.6-flash",
        input: prompt
    });

    if (!interaction || !interaction.output_text) {
        throw new Error("Empty response received from Gemini AI");
    }

    return interaction.output_text.trim();
};

// 1. Summarize Note
export const summarizeNote = async (req, res) => {
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

        const prompt = `Summarize this note in simple, clear, and high-impact bullet points. Follow with a brief 1-sentence TL;DR key takeaway.

Title: ${note.title || "Untitled"}
Content:
${note.content}`;

        const summary = await runInteraction(prompt);

        // Save summary directly to the note
        note.aiSummary = summary;
        await note.save();

        res.status(200).json({
            message: "Note summarized successfully",
            summary,
            note
        });

    } catch (error) {
        console.error("GEMINI SUMMARIZE ERROR:", error);
        res.status(500).json({
            message: "AI summarization failed",
            error: error.message || "Failed to contact Gemini AI"
        });
    }
};

// 2. Extract Action Items / To-Dos
export const extractActionItems = async (req, res) => {
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

        const prompt = `Extract all action items, tasks, deadlines, and to-dos from this note as a numbered list. Only return the actionable tasks. If there are no clear action items, suggest 2-3 logical next steps based on the note.

Title: ${note.title || "Untitled"}
Content:
${note.content}`;

        const rawOutput = await runInteraction(prompt);

        // Convert output lines into an array of clean action items
        const actionItems = rawOutput
            .split("\n")
            .map((line) => line.replace(/^[\*\-\d\.\s\[\]]+/, "").trim())
            .filter((line) => line.length > 3);

        note.aiActionItems = actionItems;
        await note.save();

        res.status(200).json({
            message: "Action items extracted successfully",
            actionItems,
            rawText: rawOutput,
            note
        });

    } catch (error) {
        console.error("GEMINI ACTION ITEMS ERROR:", error);
        res.status(500).json({
            message: "AI action items extraction failed",
            error: error.message || "Failed to contact Gemini AI"
        });
    }
};

// 3. Enhance Note Text (Fix grammar, professional, concise, bulletize)
export const enhanceNote = async (req, res) => {
    try {
        const { text, mode = "improve" } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Text content is required"
            });
        }

        let instruction = "Improve the clarity, readability, and grammar of this text while preserving its exact meaning.";
        if (mode === "professional") {
            instruction = "Rewrite this text in a polished, professional, and confident tone.";
        } else if (mode === "concise") {
            instruction = "Make this text significantly more concise, removing fluff while keeping key points.";
        } else if (mode === "bulletize") {
            instruction = "Convert this text into clean, structured bullet points.";
        } else if (mode === "fix_grammar") {
            instruction = "Fix all grammar, spelling, and punctuation errors in this text without changing its tone.";
        }

        const prompt = `${instruction}

Original text:
${text}

Enhanced text (return only the enhanced text):`;

        const enhancedText = await runInteraction(prompt);

        res.status(200).json({
            message: "Text enhanced successfully",
            enhancedText
        });

    } catch (error) {
        console.error("GEMINI ENHANCE ERROR:", error);
        res.status(500).json({
            message: "AI text enhancement failed",
            error: error.message || "Failed to contact Gemini AI"
        });
    }
};

// 4. Ask a question about a Note (Q&A)
export const askNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { question } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid note ID"
            });
        }

        if (!question || !question.trim()) {
            return res.status(400).json({
                message: "Question is required"
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

        const prompt = `You are a helpful assistant answering a question about the following note. Answer accurately and directly using the note's context.

Note Title: ${note.title || "Untitled"}
Note Content:
${note.content}

User Question: ${question}

Helpful Answer:`;

        const answer = await runInteraction(prompt);

        res.status(200).json({
            message: "Question answered",
            answer
        });

    } catch (error) {
        console.error("GEMINI ASK NOTE ERROR:", error);
        res.status(500).json({
            message: "AI question answering failed",
            error: error.message || "Failed to contact Gemini AI"
        });
    }
};

// 5. Suggest Tags & Title
export const suggestTagsAndTitle = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: "Content is required"
            });
        }

        const prompt = `Based on the note content below, generate:
1. A concise, catchy title (max 6 words).
2. Exactly 3-4 relevant single-word hashtags/tags (e.g., #Work, #Ideas, #Coding).

Respond in exact JSON format:
{
  "title": "...",
  "tags": ["Work", "Design", "Productivity"]
}

Content:
${content}`;

        const raw = await runInteraction(prompt);
        let parsed = { title: "", tags: [] };

        try {
            // Extract json block
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            }
        } catch {
            parsed = { title: "", tags: ["Notes"] };
        }

        res.status(200).json({
            message: "Suggestions generated",
            suggestions: parsed
        });

    } catch (error) {
        console.error("GEMINI SUGGEST ERROR:", error);
        res.status(500).json({
            message: "AI suggestion failed",
            error: error.message || "Failed to contact Gemini AI"
        });
    }
};