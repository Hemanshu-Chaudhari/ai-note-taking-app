import dotenv from "dotenv";

dotenv.config();

import { GoogleGenAI } from "@google/genai";
import Note from "../models/Note.js";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export const summarizeNote = async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!note) {
            return res.status(404).json({
                message: "Note not found"
            });
        }

        const interaction = await ai.interactions.create({
            model: "gemini-3.6-flash",
            input: `Summarize this note in simple and clear bullet points.

Title:
${note.title}

Content:
${note.content}`
        });

        res.status(200).json({
            message: "Note summarized successfully",
            summary: interaction.output_text
        });

    } catch (error) {
        console.error("GEMINI ERROR:", error);

        res.status(500).json({
            message: "AI summarization failed",
            error: error.message
        });
    }
};