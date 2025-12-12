import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    filePath: {
        type: String,
        required: true, 
    },
    fileSize: {
        type: Number,
        required: true,
    },  
    extractdText: {
        type: String,
        default: "" ,
    },
    chunks: [{
        content: {
            type: String,
            required: true, 
        },
        pageNumber: {
            type: Number,
            default:0
        },
        chunckIndex: {
            type: Number,
            required: true,
        }
    }],
    updateAt: {
        type: Date,
        default: Date.now, 
    },
    lastAccessed: {
        type: Date,
        default: Date.now,
    },
    status:{
        type: String,
        enum: ['processing', 'ready', 'error'],
        default: 'processing',
    }
},{
    timestamps: true
})

documentSchema.index({ userId: 1, uploadDate: -1 });


const Document = mongoose.model("Document", documentSchema);

export default Document;
