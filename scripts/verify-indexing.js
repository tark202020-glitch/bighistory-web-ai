// Standalone script
require('dotenv').config({ path: '.env.local' });

async function verifyIndexing() {
    console.log("=== Checking Indexing for '임계국면' (Thresholds) ===");
    try {
        const results = await searchStore('임계국면 8가지');

        if (results.length === 0) {
            console.log("No results found. The document might not be indexed.");
        } else {
            console.log(`Found ${results.length} results.`);
            results.forEach((res, i) => {
                console.log(`\n[Result ${i + 1}]`);
                console.log(`Title: ${res.title}`);
                console.log(`Link: ${res.link}`);
                console.log(`Snippet: ${res.snippet.substring(0, 100)}...`);
            });
        }
    } catch (error) {
        console.error("Error searching store:", error);
    }
}

// Mock the environment if needed or rely on dotenv
// Since src/lib/vertex-search.ts uses import, we might need to use ts-node or modify it to be runnable.
// Actually, let's keep it simple and just create a standalone JS script using the same logic to avoid TS compilation issues in this quick check.

const { SearchServiceClient } = require('@google-cloud/discoveryengine');

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
const LOCATION = 'global';
// Copied from src/lib/vertex-search.ts - make sure this matches!
const DATA_STORE_ID = '20set-bighistory-20260102_1767348297906';
const COLLECTION_ID = 'default_collection';

async function standaloneSearch() {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const credentials = credentialsJson ? JSON.parse(credentialsJson) : undefined;

    // Fix private key newline issue locally too
    if (credentials && credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const client = new SearchServiceClient({
        apiEndpoint: 'discoveryengine.googleapis.com',
        credentials
    });

    console.log(`Searching in DataStore: ${DATA_STORE_ID}`);
    const servingConfig = client.projectLocationCollectionDataStoreServingConfigPath(
        PROJECT_ID,
        LOCATION,
        COLLECTION_ID,
        DATA_STORE_ID,
        'default_search'
    );

    const request = {
        pageSize: 5,
        query: '임계국면 8가지', // Query from the user's screenshot context
        servingConfig: servingConfig,
    };

    try {
        const [response] = await client.search(request);

        console.log("Search response received.");
        if (!response.results || response.results.length === 0) {
            console.log("❌ NO RESULTS FOUND. The document is likely NOT indexed.");
            return;
        }

        console.log(`✅ Found ${response.results.length} results.`);
        response.results.forEach((result, i) => {
            const data = result.document.derivedStructData;
            console.log(`\n[${i + 1}] Title: ${data.title}`);
            console.log(`    Link: ${data.link}`); // Looking for '21_B_ALL.pdf' in the link
        });

    } catch (e) {
        console.error("Search failed:", e);
    }
}

standaloneSearch();
