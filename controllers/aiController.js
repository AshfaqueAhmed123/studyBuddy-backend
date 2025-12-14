import Document from "../models/Document.js"
import Quiz from "../models/Quiz.js"
import Flashcard from "../models/Flashcard.js"
import ChatHistory from "../models/ChatHistory.js"
import * as geminiService from "../utils/gemenaiService.js"
import { findRelevantChunks } from "../utils/textChuncker.js"

export const generateFlashCards = async  (req,res,next) => {
    try {
        const {documentId, count=10 } = req.body
        if(!documentId){
            return res.status(404).json({
                success:false,
                error:"please provide documentId",
                statusCode:404
            })
        }
        const document = await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:"ready"
        })

        if(!document){
             return res.status(404).json({
                success:false,
                error:"document not found or not ready",
                statusCode:404
            })
        }

        // generate flashcards using gemini
        const cards = await geminiService.generateFlashCards(
            document.extractedText,
            parseInt(count)
        )


        // save to database
        const flashcards = await Flashcard.create({
            userId:req.user._id,
            documentId:document._id,
            cards: cards.map(card => ({
                question: card.question,
                answer: card.answer,
                difficulty: card.difficulty,
                reviewCount:0,
                isStarred:false
            }))
        })

        res.status(200).json({
            success:true,
            data:flashcards,
            message:"Flashcards generated sucessfully"
        })
    } catch (error) {
        next(error)
    }
}


export const generateQuiz = async (req, res, next) => {
    try {
        const {documentId, numQuestions=5, title} = req.body;
        if(!documentId){
            return res.status(404).json({
                success:false,
                error:"please provide documentId",
                statusCode:404
            })
        }
        const document = await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:"ready"
        })
        if(!document){
             return res.status(404).json({
                success:false,
                error:"document not found or not ready",
                statusCode:404
            })
        }

        // Generate Quiz using gemini
        const questions = await geminiService.generateQuiz(
            document.extractedText,
            parseInt(numQuestions)
        )

        // save quiz to database

        const quiz = await Quiz.create({
            userId:req.user._id,
            document:document._id,
            title: title || `${document.title} - Quiz`,
            questions:questions,
            totalQuestions:questions.length,
            userAnswers:[],
            score:0
        })


        res.status(200).json({
            success:true,
            data:quiz,
            message:'Quiz generated successfully'
        })


    } catch (error) {
        next(error)
    }
}

export const generateSummary = async (req, res, next) => {
    try {
        const {documentId} = req.body
        if(!documentId){
            return res.status(404).json({
                success:false,
                error:"please provide documentId",
                statusCode:404
            })
        }
        const document = await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:"ready"
        })

        if(!document){
             return res.status(404).json({
                success:false,
                error:"document not found or not ready",
                statusCode:404
            })
        }

        // Generate Summary using gemini
        const summary = await geminiService.generateSummary(document.extractedText)

        res.status(200).json({
            success:true,
            data:{
                documentId:document._id,
                title:document.title,
                summary
            },
            message:'summary generated successfully'
        })

    } catch (error) {
        next(error)
    }
}

export const chat = async (req, res, next) => {
    try {
        const {documentId, question } = req.body
        if(!documentId || !question){
            return res.status(404).json({
                success:false,
                error:"please provide documentId and question",
                statusCode:404
            })
        }
        const document = await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:"ready"
        })

        if(!document){
             return res.status(404).json({
                success:false,
                error:"document not found or not ready",
                statusCode:404
            })
        }

        // find relevant chunks 
        const relevantChunks = findRelevantChunks(document.chunks, question, 3)
        const chunkIndices = relevantChunks.map(c => c.chunkIndex)

        // Get or create chat history 
        let chatHistory = await ChatHistory.findOne({
            userId:req.user._id,
            documentId:document._id,
            messages:[]
        })

        if(!chatHistory){
            chatHistory = await ChatHistory.create({
                userId:req.user._id,
                documentId:document._id,
                messages:[]
            })
        }


        // Generate response using gemini
        const answer = await geminiService.chatWithContext(question, relevantChunks)

        // save conversation
        chatHistory.message.push(
            {
            role:"user",
            content:question,
            timestamp: new Date(),
            relevantChunks:[]
            },
            {
            role:"assistant",
            content:answer,
            timestamp: new Date(),
            relevantChunks:chunkIndices
            }
        )

        await chatHistory.save();

        res.status(200).json({
            success:true,
            data:{
                question,
                answer,
                relevantChunks:chunkIndices,
                chatHistoryId:chatHistory._id
            },
            message:"Response generated successfully"
        })

    } catch (error) {
        next(error)
    }
}


export const explainConcept = async (req, res, next) => {
    try {
        const {documentId, concept } = req.body
        if(!documentId || !concept){
            return res.status(404).json({
                success:false,
                error:"please provide documentId and concept",
                statusCode:404
            })
        }
        const document = await Document.findOne({
            _id:documentId,
            userId:req.user._id,
            status:"ready"
        })

        if(!document){
             return res.status(404).json({
                success:false,
                error:"document not found or not ready",
                statusCode:404
            })
        }


        // find relevant chunks for the concept 
        const relevantChunks = await findRelevantChunks(document.chunks, concept, 3)
        const context = relevantChunks.map( c => c.content).join('\n\n')

        // generate explanation using gemini
        
        const explanation = await geminiService.explainConcept(concept,context)

        res.status(200).json({
            success:true,
            data:{
                concept,
                explanation,
                relevantChunks: relevantChunks.mao(c => c.chunkIndex) 
            },
            message:"explanation generated successfully"
        })

    } catch (error) {
        next(error)
    }
}


export const getChatHistory = async (req, res, next) => {
    try {
        const {documentId } = req.body
        if(!documentId){
            return res.status(404).json({
                success:false,
                error:"please provide documentId",
                statusCode:404
            })
        }

        const chatHistory = await ChatHistory.findOne({
            userId:req.user._id,
            documentId:documentId,
        }).select("messages") // only retrieve the messages array

        if(!chatHistory){
            return res.status(200).json({
                success:true,
                data : [],
                message:"no chat history found fot this document"
            })
        }


        res.status(200).json({
            success:true,
            data:chatHistory.messages,
            message:"chat history retrieved successfully"
        })
    } catch (error) {
        next(error)
    }
}

    

    
    
     