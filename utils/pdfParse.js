import fs from "fs/promises"
import { parse } from "path"
import { PDFParse } from "pdf-parse"

/*
extract text from PDF file 
* @params {String} filePath - path to pdf file
* @returns {Promise<{text:String, numPage:number}>}

*/

export const extractTextFromPDF = async (filePath)=>{
    try {
        const dataBuffer = await fs.readFile(filePath)
        // pdf-parse expects a unit8Array, not a buffer
        const parser = new PDFParse(new Uint8Array(dataBuffer))
        const data = parser.getText();

        return {
            text:data.text,
            numPage:data.numpages,
            info:data.info
        };
    } catch (error) {
        console.error("PDF parsing error", error)
        throw new Error("failed to extract text from PDF")
    }
}