import dotenv from "dotenv"
import {GoogleGenAI} from "@google/genai"

dotenv.config()

const ai = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});

if(!process.env.GEMINI_API_KEY){
    console.error('FATAL ERROR: gemini API is not set in the environment variables')
    process.exit(1)
}

export const generateFlashCards = async (text,count = 10) => {
    const prompt = `Generate exactly ${count} educational flashcards from the following text.
    Format each flashcard as:
    Q : [CLEAR,specific question]
    A : [Concise, accurate answer]
    D: [Difficulty level :  easy,medium or hard ]

    Seperate each flashcard with "---"

    Text : 
    ${text.subtring(0,15000)};
    `;

    try {
        
    } catch (error) {
        
    }
}