const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function testParse() {
    const filePath = path.join(__dirname, 'data', '01.pdf');
    if (!fs.existsSync(filePath)) {
        console.error('File found check failed: 01.pdf not found in data/');
        // Try to list data dir
        console.log('Listing data dir:');
        try {
            console.log(fs.readdirSync(path.join(__dirname, 'data')));
        } catch (e) {
            console.log('Could not list data dir');
        }
        return;
    }

    const dataBuffer = fs.readFileSync(filePath);

    try {
        console.log('Attempting to parse 01.pdf...');
        const data = await pdf(dataBuffer);
        console.log('Parse successful.');
        console.log('Keys in data object:', Object.keys(data));
        console.log('Type of data.text:', typeof data.text);
        if (data.text) {
            console.log('Text length:', data.text.length);
            console.log('Preview:', data.text.substring(0, 100));
        } else {
            console.log('data.text is missing or empty');
            console.log('Full data object:', data);
        }
    } catch (error) {
        console.error('Error during parsing:', error);
    }
}

testParse();
