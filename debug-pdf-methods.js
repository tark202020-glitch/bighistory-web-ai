const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function testMethods() {
    console.log('Testing explicit method calls...');
    const filePath = path.join(__dirname, 'data', '01.pdf');
    const buffer = fs.readFileSync(filePath);

    let PDFParser = pdf;
    if (pdf.default) PDFParser = pdf.default;
    if (pdf.PDFParse) PDFParser = pdf.PDFParse;

    try {
        // @ts-ignore
        const instance = new PDFParser(buffer);
        console.log('Instance created.');

        if (typeof instance.load === 'function') {
            console.log('Calling instance.load()...');
            // assuming load might fail or return something
            await instance.load();
            console.log('Load complete?');
        }

        if (typeof instance.getText === 'function') {
            console.log('Calling instance.getText()...');
            const result = await instance.getText();
            console.log('getText result type:', typeof result);
            console.log('getText result length:', result ? result.length : 'null');
            // Standard pdf-parse usually returns keys like { text, numpages, info }
            console.log('Result keys:', Object.keys(result));
            if (result.text) {
                console.log('First 100 chars:', result.text.substring(0, 100));
            }
        } else {
            console.log('No getText method found');
        }

    } catch (e) {
        console.error('Method call error:', e);
    }
}

testMethods();
