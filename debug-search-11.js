const fs = require('fs');
const path = require('path');

const VECTOR_FILE = path.join(__dirname, 'data', 'vectors.json');

try {
    const data = fs.readFileSync(VECTOR_FILE, 'utf8');
    const vectors = JSON.parse(data);

    // Filter for 11.pdf
    const chunks11 = vectors.filter(c => c.source.includes('11.pdf'));

    console.log(`Searching ${chunks11.length} pages in 11.pdf...`);

    // Search for "밀러" or "재즈"
    const keyword = "밀러";
    const keyword2 = "재즈";

    let found = false;
    chunks11.forEach(c => {
        if (c.content.includes(keyword) || c.content.includes(keyword2)) {
            console.log(`FOUND in Page ${c.page}:`);
            console.log(c.content.substring(0, 200) + "...");
            found = true;
        }
    });

    if (!found) {
        console.log("Keywords NOT FOUND in any page of 11.pdf");
    }

} catch (e) {
    console.error(e);
}
