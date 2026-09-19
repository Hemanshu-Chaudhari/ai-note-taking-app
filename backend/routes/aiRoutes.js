import express from "express";
import {
    summarizeNote,
    extractActionItems,
    enhanceNote,
    askNote,
    suggestTagsAndTitle
} from "../controllers/aiController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/summarize/:id", authMiddleware, summarizeNote);
router.post("/action-items/:id", authMiddleware, extractActionItems);
router.post("/enhance", authMiddleware, enhanceNote);
router.post("/ask/:id", authMiddleware, askNote);
router.post("/suggest-tags", authMiddleware, suggestTagsAndTitle);

export default router;