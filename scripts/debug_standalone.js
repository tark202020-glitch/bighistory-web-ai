const { SearchServiceClient } = require('@google-cloud/discoveryengine');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
// Load .env.local
const envPath = path.join(__dirname, '../.env.local');
require('dotenv').config({ path: envPath });

async function run() {
    console.log("Starting Debug Script...");
    const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
    const LOCATION = 'global';
    // Hardcoded ID from source/screenshot
    const DATA_STORE_ID = 'bighistory-set-raw-chunking-20260110_1768030786251';
    const COLLECTION_ID = 'default_collection';

    console.log(`Project: ${PROJECT_ID}`);
    console.log(`Data Store: ${DATA_STORE_ID}`);

    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    let credentials = undefined;
    if (credentialsJson) {
        try {
            // Sanitize: sometimes literal newlines or weird chars get into env vars
            const sanitizedJson = credentialsJson.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
            // But wait, if it's already a valid JSON string, it shouldn't have literal newlines in the string values
            // Let's try to just parse it directly but with error handling
            credentials = JSON.parse(credentialsJson);
            if (credentials.private_key) credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        } catch (e) {
            console.error("JSON Parse Error at position:", e.message);
            // Attempt a more aggressive sanitization if it fails
            try {
                // Remove literal newlines/tabs inside the JSON structure if they are not escaped
                const cleaned = credentialsJson.replace(/[\n\r]/g, '');
                credentials = JSON.parse(cleaned);
                if (credentials.private_key) credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
                console.log("Recovery: Parse successful after removing literal newlines.");
            } catch (e2) {
                console.error("Critical Cred Error:", e2.message);
            }
        }
    }

    if (!credentials) {
        console.log("No explicit JSON credentials found. Trying Application Default Credentials (ADC)...");
    }

    // 1. Search (using v1beta for better chunking support)
    const { SearchServiceClient } = require('@google-cloud/discoveryengine').v1beta;
    const client = new SearchServiceClient({ apiEndpoint: 'discoveryengine.googleapis.com', credentials });
    const servingConfig = client.projectLocationCollectionDataStoreServingConfigPath(PROJECT_ID, LOCATION, COLLECTION_ID, DATA_STORE_ID, 'default_search');

    const request = {
        pageSize: 1,
        query: '바닷길과 비단길',
        servingConfig: servingConfig,
        autoPaginate: false,
        searchResultMode: 'CHUNKS', // Request Chunks explicitly
        contentSearchSpec: {
            snippetSpec: { returnSnippet: true },
        }
    };

    console.log("\n--- Vertex AI Search Results (Stream) ---");
    try {
        const stream = client.searchStream(request);

        stream.on('data', (response) => {
            console.log("\n--- Full JSON of First Result (Stream) ---");
            // Response in stream is a SearchResult item, not the array
            console.log(JSON.stringify(response, null, 2));
            process.exit(0);
        });

        stream.on('error', (e) => {
            console.error("Stream Error:", e);
            process.exit(1);
        });

        // Wait 10s then timeout
        setTimeout(() => {
            console.log("Stream Timeout");
            process.exit(1);
        }, 10000);

    } catch (e) {
        console.error("Search Setup Failed:", e.message);
    }

    // 2. GCS
    console.log("\n--- GCS extracted_images (First 20) ---");
    const storage = new Storage({ projectId: PROJECT_ID, credentials });
    const bucket = storage.bucket('20set-bighistory-raw');
    try {
        const [files] = await bucket.getFiles({ prefix: 'extracted_images/', maxResults: 20 });
        if (files.length === 0) console.log("No files found in extracted_images/");
        files.forEach(f => console.log(f.name));
    } catch (e) {
        console.error("GCS Failed:", e.message);
    }
}

run();
