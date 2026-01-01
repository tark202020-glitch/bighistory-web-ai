const fs = require('fs');
const path = require('path');

const VECTOR_FILE = path.join(__dirname, 'data', 'vectors.json');

try {
    const data = fs.readFileSync(VECTOR_FILE, 'utf8');
    const vectors = JSON.parse(data);

    // Find the Miller chunk
    console.log("Searching for Miller chunk...");
    const millerChunk = vectors.find(c => c.content.includes("밀러는 인간은 이성에게"));

    if (millerChunk) {
        console.log("Miller Chunk FOUND:");
        console.log(`ID: ${millerChunk.id}`);
        console.log(`Source: ${millerChunk.source}`);
        console.log(`Page: ${millerChunk.page}`);
        // console.log(`Content Preview: ${millerChunk.content.substring(0, 50)}...`);
        console.log(`Embedding Length: ${millerChunk.embedding ? millerChunk.embedding.length : 'NULL'}`);

        if (!millerChunk.embedding || millerChunk.embedding.length === 0) {
            console.error("CRITICAL: Embedding is missing or empty!");
        } else {
            console.log("Integrity Check PASSED.");
        }
    } else {
        console.error("Miller Chunk NOT FOUND in JSON.");
    }

} catch (e) {
    console.error(e);
}
