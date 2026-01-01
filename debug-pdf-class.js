const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function testClass() {
    console.log('Testing pdf-parse class usage...');
    const filePath = path.join(__dirname, 'data', '01.pdf');
    const buffer = fs.readFileSync(filePath);

    let PDFParser = pdf;
    if (pdf.default) PDFParser = pdf.default;
    if (pdf.PDFParse) PDFParser = pdf.PDFParse;

    try {
        console.log('Trying new PDFParser(buffer)...');
        // @ts-ignore
        const instance = new PDFParser(buffer);
        console.log('Instance created. Keys:', Object.keys(instance));
        console.log('Instance prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));

        // Check if it's a promise or has text immediately
        if (instance instanceof Promise) {
            console.log('Instance is a Promise. Awaiting...');
            const result = await instance;
            console.log('Result keys:', Object.keys(result));
            console.log('Result text length:', result.text ? result.text.length : 'undefined');
        } else {
            // Maybe it has a method like parse()?
            console.log('Instance is object.');
            if (instance.text) {
                console.log('Found instance.text, length:', instance.text.length);
            } else {
                console.log('instance.text is missing.');
                // check for other properties
                console.log('Instance full dump (depth 1):');
                for (const key in instance) {
                    try {
                        const val = instance[key];
                        console.log(`${key}: ${typeof val} ${val && val.toString ? val.toString().substring(0, 50) : ''}`);
                    } catch (e) { }
                }
            }
        }

    } catch (e) {
        console.error('Error with new:', e);
    }
}

testClass();
