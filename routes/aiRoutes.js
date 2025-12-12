import express from "express"
import {
    generateFlashCards,
    generateQuiz,
    generateSummary,
    chat,
    explainConcept,
    getChatHistory 
} from "../controllers/aiController.js"
import protect from "../middleware/auth.js"

const router = express.Router();

router.use(protect)


router.post("/generate-flashcards", generateFlashCards)
router.post("/generate-quiz", generateQuiz)
router.post("/generate-summary", generateSummary)
router.post("/chat", chat)
router.post("/explain-concept", explainConcept)
router.get("/chat-history/:documentId", getChatHistory)


export default router