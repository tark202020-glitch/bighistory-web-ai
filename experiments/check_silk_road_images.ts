
import { searchStore } from '../src/lib/vertex-search';
import { getMatchingImages } from '../src/lib/gcs-info';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables manually since we are running standalone
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
    const envConfig = fs.readFileSync(envLocalPath, 'utf8');
    const lines = envConfig.split('\n');
    for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx > 0) {
            const key = line.substring(0, eqIdx).trim();
            const value = line.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            // Handle JSON content appropriately if needed, but for now simple string is fine as long as we don't break on =
            process.env[key] = value;
        }
    }
} else {
    // Fallback to .env
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
            }
        });
    }
}

async function run() {
    console.log("Starting Debug Script...");
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        console.error("Missing GOOGLE_APPLICATION_CREDENTIALS_JSON");
        // Don't exit, might rely on ADC, but likely fails based on codebase
    }

    const query = '실크로드와 교역: 문명은 어떻게 연결되었나?';
    console.log(`Searching for '${query}'...`);

    try {
        const results = await searchStore(query);
        console.log(`Found ${results.length} results.`);

        for (const result of results) {
            console.log(`\n-----------------------------------`);
            console.log(`Title: ${result.title}`);
            console.log(`URI: ${result.sourceUri}`);
            console.log(`Page: ${result.page}`);

            if (result.sourceUri && result.page) {
                // Extract bookId logic
                // If URI is .../15-Main_p023_01.jpeg, we want "15" if gcs-info expects "15" (because it adds -Main)
                // OR "15-Main" if we fix gcs-info.
                // Let's assume filename is "15-Main..."
                const filename = result.sourceUri.split('/').pop() || '';
                const baseName = filename.replace(/\.(pdf|jpeg|jpg|png)$/i, '');

                // Heuristic: If it looks like "15-Main...", extract "15".
                // If it looks like "15-Main", extract "15".
                let bookId = baseName;
                if (bookId.includes('-Main')) {
                    bookId = bookId.split('-Main')[0];
                }

                console.log(`Derived BookID for Lookup: ${bookId} (from ${filename})`);

                console.log(`Checking images via getMatchingImages...`);
                // Note: getMatchingImages inside uses `extracted_images/${bookId}-Main_p...`
                // So passing "15" -> "15-Main_p..." which matches "15-Main_p023_01.jpeg"
                const images = await getMatchingImages(bookId, result.page);

                if (images.length > 0) {
                    console.log(`SUCCESS: Found ${images.length} images.`);
                    images.forEach(img => console.log(` - ${img}`));
                } else {
                    console.log(`FAILURE: No images found.`);
                    // Try debugging why
                    // Check if maybe the page padding is different or prefix is wrong
                    console.log(`(Debug tip: Check GCS bucket manually for prefix: extracted_images/${bookId}-Main_p${result.page.toString().padStart(3, '0')})`);
                }
            }
        }
    } catch (e) {
        console.error("Search failed:", e);
    }
}

run();
