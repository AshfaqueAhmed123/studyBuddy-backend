import express from "express"
import protect from "../middleware/auth.js"
import {
    getQuizzes,
    getQuizById,
    submitQuiz,
    getQuizResults,
    deleteQuiz
} from "../controllers/quizController.js"

const router = express.Router()

router.use(protect)

router.get("/:documentId", getQuizzes)
router.get("/quiz/:id", getQuizById)
router.post("/:id/submit", submitQuiz)
router.get("/:id/results", getQuizResults)
router.delete("/:id", deleteQuiz)


export default router