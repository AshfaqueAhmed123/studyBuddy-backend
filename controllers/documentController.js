import Document from "../models/Document.js"
import Flashcard from "../models/Flashcard.js"
import Quiz from "../models/Quiz.js "
import { extractTextFromPDF } from "../utils/pdfParse.js"
import { chunkText } from "../utils/textChuncker.js"
import fs from "fs/promises"
import mongoose from "mongoose"


// @dec upload PDF document
// @route POST /api/documents/upload
// @access private

export const uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Please upload a PDF file',
                statusCode: 400
            });
        }

        const { title } = req.body;

        if (!title) {
            // delete uploaded file if no title pd
            await fs.unlink(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Please provide a document title',
                statusCode: 400
            });
        }
        // Construct the URL for the uploaded file
        const baseUrl = `http://localhost:${process.env.PORT || 8000}`;
        const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

        // Create document record
        const document = await Document.create({
            userId: req.user._id,
            title,
            filename: req.file.originalname,
            filePath: fileUrl, // Store the URL instead of the local path
            fileSize: req.file.size,
            status: 'processing'
        });

        // Process PDF in background (in production, use a queue like Bull)
        processPDF(document._id, req.file.path).catch(err => {
            console.error('PDF processing error:', err);
        });

        res.status(201).json({
            success: true,
            data: document,
            message: 'Document uploaded successfully. processing in progress...'
        });

    } catch (error) {
        // clean up file on error
        if (req.file) {
            fs.unlink(req.file.path).catch(() => { })
        }
        next(error)
    }
}

// Helper function to process PDF
const processPDF = async (documentId, filePath) => {
    try {
        const { text } = await extractTextFromPDF(filePath);

        // Create chunks
        const chunks = chunkText(text, 500, 50);

        // Update document
        await Document.findByIdAndUpdate(documentId, {
            extractedText: text,
            chunks: chunks,
            status: 'ready'
        });

        console.log(`Document ${documentId} processed successfully`)
    } catch (error) {
        console.error(`Error processing document  ${documentId}:`, error)

        await Document.findByIdAndUpdate(documentId, {
            status: "failed"
        })
    }
}


// @dec get all documents
// @route GET /api/documents
// @access private

export const getDocuments = async (req, next) => {
    try {
        const documents = await Document.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(req.user._id) }
            },
            {
                $lookup: {
                    from: 'flashcards',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'flashcardSets'
                }
            },
            {
                $lookup: {
                    from: 'quizzes',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'quizzes'
                }
            },
            {
                $addFields: {
                    flashcardCount: { $size: '$flashcardSets' },
                    quizCount: { $size: '$quizzes' }
                }
            },
            {
                $project:{
                    extractedText:0,
                    chunks:0,
                    flashcardSets:0,
                    quizzes:0
                }
            },
            {
                $sort: { uploadDate: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            count:documents.length,
            documents: documents
        });
    } catch (error) {
        next(error)
    }
}


// @dec get one document
// @route GET /api/document/:id
// @access private

export const getDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            id:req.params.id,
            user:req.user._id
        })
        if(!document){
            return res.status(404).json({
                success:false,
                error:"document not found",
                statusCode:404
            })
        }
        // get counts of associated flashcards and quizzes
        const flashcardCount = await flashcard.countDocument({documentId:document._id, userId:req.user._id})
        const quizCount = await Quiz.countDocuments({documentId:document._id,userId:req.user._id})

        // update last accessed 
        document.lastAccessed = Date.now()
        await Document.save()
        // combine document data with counts
        const documentData = document.toObject();
        documentData.flashcardCount = flashcardCount;
        documentData.quizCount = quizCount;

        return res.status(200).json({
            success:true,
            data:documentData
        })
    } catch (error) {
        next(error)
    }
}



// @dec delete one document
// @route delete /api/document/:id
// @access private

export const deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id:req.params.id,
            userId:req.user._id
        })
        if(!document){
            return res.status(404).json({
                success:false,
                error:"document not found",
                statusCode:404,
            })
        }

        // delete file from filesystem
        fs.unlink(document.filePath).catch(()=>{})

        // delete document
        await document.deleteOne() 

        return res.status(200).json({
            success:true,
            message:"document deleted successfully"
        })
    } catch (error) {
        next(error)
    }
}


