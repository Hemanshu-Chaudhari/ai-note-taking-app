import express from "express";
import { summarizeNote } from "../controllers/aiController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
    "/summarize/:id",
    authMiddleware,
    summarizeNote
);

export default router;