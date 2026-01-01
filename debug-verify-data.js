const fs = require('fs');
const path = require('path');

const VECTOR_FILE = path.join(__dirname, 'data', 'vectors.json');

try {
    if (!fs.existsSync(VECTOR_FILE)) {
        console.log("File not found!");
        process.exit(1);
    }

    const stats = fs.statSync(VECTOR_FILE);
    console.log(`File Size: ${stats.size} bytes`);

    console.log("Reading file...");
    const data = fs.readFileSync(VECTOR_FILE, 'utf8');

    console.log("Parsing JSON...");
    const vectors = JSON.parse(data);

    console.log(`Total Chunks: ${vectors.length}`);

    // Count unique files
    const uniqueFiles = new Set(vectors.map(v => v.source));
    console.log(`Unique Sources: ${uniqueFiles.size}`);
    console.log("Files found:", Array.from(uniqueFiles).slice(0, 5), "...");

    // Search for the specific text
    console.log("Searching for '밀러'...");
    const millerChunks = vectors.filter(c => c.content.includes("밀러"));

    if (millerChunks.length > 0) {
        console.log(`FOUND ${millerChunks.length} chunks containing '밀러'.`);
        millerChunks.forEach(c => {
            console.log(`- [${c.source} p.${c.page}] ${c.content.substring(0, 100)}...`);
            console.log(`  Embedding length: ${c.embedding ? c.embedding.length : 'MISSING'}`);
        });
    } else {
        console.log("NOT FOUND: '밀러' keyword missing.");
        // Debug: print random chunk content
        if (vectors.length > 0) {
            console.log("Sample content:", vectors[0].content);
        }
    }

} catch (e) {
    console.error("Error:", e.message);
}
