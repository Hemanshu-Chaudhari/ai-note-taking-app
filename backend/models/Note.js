import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            default: ""
        },

        content: {
            type: String,
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        isPinned: {
            type: Boolean,
            default: false
        },

        color: {
            type: String,
            default: "default"
        },

        tags: [
            {
                type: String,
                trim: true
            }
        ],

        aiSummary: {
            type: String,
            default: ""
        },

        aiActionItems: [
            {
                type: String
            }
        ]
    },
    {
        timestamps: true
    }
);

noteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

const Note = mongoose.model("Note", noteSchema);

export default Note;