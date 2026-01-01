const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

const pdfPath = path.join(__dirname, 'data', '11.pdf');
const pdfParser = new PDFParser();

console.log("Loading 11.pdf to inspect Page 72 (index 71)...");

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    // Page 72 is likely at index 71 (0-based)
    // Adjust if necessary based on previous "Page 14" being index 0? No, usually 1-1 mapping.
    // Let's check index 71.
    const pageIndex = 71;
    const page = pdfData.Pages[pageIndex] || (pdfData.formImage && pdfData.formImage.Pages[pageIndex]);

    if (!page) {
        console.error("Page 72 not found!");
        return;
    }

    console.log(`--- Raw Texts for Page ${pageIndex + 1} ---`);
    console.log(`Number of Text Blocks: ${page.Texts.length}`);

    page.Texts.forEach((t, i) => {
        if (t.R && t.R.length > 0) {
            const raw = t.R[0].T;
            const decoded = decodeURIComponent(raw);
            console.log(`[${i}] Raw: ${raw} -> Decoded: ${decoded}`);
        }
    });
});

pdfParser.loadPDF(pdfPath);
