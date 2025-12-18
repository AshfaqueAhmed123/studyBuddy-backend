import dotenv from "dotenv"
import { GoogleGenAI } from "@google/genai"

dotenv.config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!process.env.GEMINI_API_KEY) {
    console.error('FATAL ERROR: gemini API is not set in the environment variables')
    process.exit(1)
}

export const generateFlashCards = async (text, count = 10) => {
    const prompt = `Generate exactly ${count} educational flashcards from the following text.
    Format each flashcard as:
    Q:[CLEAR,specific question]
    A:[Concise, accurate answer]
    D:[Difficulty level :  easy,medium or hard ]

    Separate each flashcard with "---"

    Text : 
    ${text.substring(0, 15000)};
    `;

    try {

        const response = await ai.models.generateContent(
            {
                model: "gemini-2.5-flash-lite",
                contents: prompt,
            }
        )

        const generatedText = response.text;

        // parse the response 

        const flashcards = [];
        const cards = generatedText.split('---').filter(c => c.trim())

        for (const card of cards) {
            let lines = card.trim().split('\n');
            let question = '', answer = '', difficulty = 'medium';

            for (const line of lines) {
                if (line.startsWith('Q:')) {
                    question = line.substring(2).trim();
                } else if (line.startsWith("A:")) {
                    answer = line.substring(2).trim()
                } else if (line.startsWith("D:")) {
                    const diff = line.substring(2).trim().toLowerCase()
                    if (['easy', 'medium', 'hard'].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }
            if (question && answer) {
                flashcards.push({ question, answer, difficulty })
            }

        }

        return flashcards.slice(0, count)

    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to generate flashcards')
    }
}


// generate QUiz questions 

export const generateQuiz = async (text, numQuestions = 5) => {
    const prompt = `
Generate exactly ${numQuestions} multiple choice questions from the following text.

Format EXACTLY as:

Q: Question text
01: Option 1
02: Option 2
03: Option 3
04: Option 4
C: Correct option (must match one option exactly)
E: Brief explanation
D: easy | medium | hard

Separate questions with ----

Text:
${text.substring(0, 15000)}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt
        });

        //text extraction
        const generatedText =
            response.text ||
            response?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "";

        console.log("RAW AI OUTPUT:\n", generatedText);

        if (!generatedText) return [];

        // separator
        const questionBlocks = generatedText
            .split('----')
            .map(b => b.trim())
            .filter(Boolean);

        const questions = [];

        for (const block of questionBlocks) {
            const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

            let question = "";
            let options = [];
            let correctAnswer = "";
            let explanation = "";
            let difficulty = "medium";

            for (const line of lines) {
                if (line.startsWith("Q:")) {
                    question = line.slice(2).trim();
                }
                else if (/^\d{2}:/i.test(line)) {
                    options.push(line.slice(3).trim());
                }
                else if (line.startsWith("C:")) {
                    correctAnswer = line.slice(2).trim();
                }
                else if (line.startsWith("E:")) {
                    explanation = line.slice(2).trim();
                }
                else if (line.startsWith("D:")) {
                    const diff = line.slice(2).trim().toLowerCase();
                    if (["easy", "medium", "hard"].includes(diff)) {
                        difficulty = diff;
                    }
                }
            }

            if (question && options.length >= 2) {
                questions.push({
                    question,
                    options,
                    correctAnswer,
                    explanation,
                    difficulty
                });
            }
        }

        return questions.slice(0, numQuestions);

    } catch (error) {
        console.error("Gemini API error:", error);
        throw new Error("Failed to generate quiz");
    }
};


// generate document summary 
export const generateSummary = async (text) => {
    const prompt = `provide a concise summary of the following text, highlighting the key concepts, main ideas and important points, keep the summary clear and structured.

    Text : 
    ${text.substring(0, 20000)};
    `;

    try {

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt
        })

        const generatedText = response.text;

        return generatedText

    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to generate summary')
    }
}


// chat with document context
export const chatWithContext = async (question, chunks) => {
    // const context = chunks.map((c,i)=> `Chunk ${i+1}\n${c.content}`.join('\n\n'))
    const context = chunks.map((c, i) => `Chunk ${i + 1}\n${c.content}`).join('\n\n');


    const prompt = `
    Based on the following context from the document, Analyze the context and answer the user's question if the answer is not in the context, say that this information is not included in document

    Context:${context}

    Question:${question}

    Answer:
    `;

    try {

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt
        })

        const generatedText = response.text;

        return generatedText

    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to process the chat')
    }
}


// explain the specific topic 
export const explainConcept = async (concept,context) => {

    const prompt = `
    explain the concept of "${concept}" based on the following context.
    provide a clear, and educational explanation that's easy to understand.
    include examples if relevant. 

    Context:${context.substring(0,10000)}
    `;

    try {

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt
        })

        const generatedText = response.text;

        return generatedText

    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to explain the concept')
    }
}
