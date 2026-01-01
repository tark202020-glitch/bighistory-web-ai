const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

const pdfParser = new PDFParser();

const pdfPath = path.join(__dirname, 'data', '08.pdf'); // Using 08.pdf as it's open in editor

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    console.log("Structure keys:", Object.keys(pdfData));
    if (pdfData.Pages) { // Old version might use formImage?
        console.log("Pages found directly:", pdfData.Pages.length);
        console.log("First page snippet:", JSON.stringify(pdfData.Pages[0].Texts[0], null, 2));
    } else if (pdfData.formImage && pdfData.formImage.Pages) {
        console.log("Pages found in formImage:", pdfData.formImage.Pages.length);
        // Inspect text structure
        const firstPage = pdfData.formImage.Pages[0];
        console.log("First Page Texts Sample:", firstPage.Texts.slice(0, 3));

        // Try to decode one text item
        const textItem = firstPage.Texts[0];
        if (textItem) {
            console.log("Decoded content:", decodeURIComponent(textItem.R[0].T));
        }
    } else {
        console.log("Unknown structure:", JSON.stringify(pdfData, null, 2).substring(0, 500));
    }
});

pdfParser.loadPDF(pdfPath);
