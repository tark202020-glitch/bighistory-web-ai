const fs = require('fs');
const path = require('path');

const VECTOR_FILE = path.join(__dirname, 'data', 'vectors.json');

try {
    const data = fs.readFileSync(VECTOR_FILE, 'utf8');
    const vectors = JSON.parse(data);

    console.log(`Total Chunks: ${vectors.length}`);

    // Check for 11.pdf chunks
    const chunks11 = vectors.filter(c => c.source.includes('11.pdf'));
    console.log(`Chunks from 11.pdf: ${chunks11.length}`);

    // Check Page 72 specifically
    const p72 = chunks11.find(c => c.page === 72);
    if (p72) {
        console.log(`--- Page 72 Content ---`);
        console.log(p72.content);
        console.log(`-----------------------`);
    } else {
        console.log(`Page 72 NOT FOUND in 11.pdf chunks.`);
        // List verified pages to see if it's offset
        const pages = chunks11.map(c => c.page).sort((a, b) => a - b);
        console.log(`Available Pages: ${pages.slice(0, 5)} ... ${pages.slice(-5)}`);
    }

} catch (e) {
    console.error(e);
}
