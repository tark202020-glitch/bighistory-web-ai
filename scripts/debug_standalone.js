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

    // Creds
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    let credentials = undefined;
    if (credentialsJson) {
        try {
            credentials = JSON.parse(credentialsJson);
            if (credentials.private_key) credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        } catch (e) { console.error("Cred Error:", e.message); }
    }

    if (!credentials) {
        console.log("No explicit JSON credentials found. Trying Application Default Credentials (ADC)...");
    }

    // 1. Search
    const client = new SearchServiceClient({ apiEndpoint: 'discoveryengine.googleapis.com', credentials });
    const servingConfig = client.projectLocationCollectionDataStoreServingConfigPath(PROJECT_ID, LOCATION, COLLECTION_ID, DATA_STORE_ID, 'default_search');

    const request = {
        pageSize: 1,
        query: '데이비드 크리스천 교수는 빅뱅 이론이 20세기에 어떻게 발전하였는지를 설명한다', // Very specific query from snippet
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
