const fs = require('fs');
const path = require('path');

async function debugPdf() {
    let pdfParse;
    try {
        const raw = require('pdf-parse');
        console.log('require("pdf-parse") type:', typeof raw);
        console.log('require("pdf-parse") keys:', Object.keys(raw));

        if (typeof raw === 'function') {
            pdfParse = raw;
        } else if (raw.default && typeof raw.default === 'function') {
            console.log('Using raw.default');
            pdfParse = raw.default;
        } else if (raw.PDFParse && typeof raw.PDFParse === 'function') {
            console.log('Using raw.PDFParse');
            pdfParse = raw.PDFParse;
        } else {
            console.error('CRITICAL: Could not find callable function in export');
            return;
        }
    } catch (e) {
        console.error('Import error:', e);
        return;
    }

    const filePath = path.join(__dirname, 'data', '01.pdf');
    console.log(`Reading file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error('File does not exist');
        return;
    }

    const buffer = fs.readFileSync(filePath);
    console.log(`File size: ${buffer.length} bytes`);

    try {
        console.log('Parsing...');
        const data = await pdfParse(buffer);
        console.log('--- PARSE SUCCESS ---');
        console.log('Data keys:', Object.keys(data));
        console.log('numpages:', data.numpages);
        console.log('info:', data.info);
        console.log('text length:', data.text ? data.text.length : 'UNDEFINED');
        if (data.text) {
            console.log('Preview (first 200 chars):');
            console.log(data.text.substring(0, 200));
        } else {
            console.log('CRITICAL: text property is missing/empty');
        }
    } catch (e) {
        console.error('Parsing error:', e);
    }
}

debugPdf();
