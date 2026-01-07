// Standalone script to debug image search results
require('dotenv').config({ path: '.env.local' });
const { SearchServiceClient } = require('@google-cloud/discoveryengine');

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
const LOCATION = 'global';
const DATA_STORE_ID = '20set-bighistory-20260102_1767348297906';
const COLLECTION_ID = 'default_collection';

async function debugImageSearch() {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const credentials = credentialsJson ? JSON.parse(credentialsJson) : undefined;

    if (credentials && credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const client = new SearchServiceClient({
        apiEndpoint: 'discoveryengine.googleapis.com',
        credentials
    });

    // Query related to Book 1/2 - "Big Bang"
    const query = '빅뱅';
    console.log(`Searching for: "${query}" in DataStore: ${DATA_STORE_ID}`);

    const servingConfig = client.projectLocationCollectionDataStoreServingConfigPath(
        PROJECT_ID,
        LOCATION,
        COLLECTION_ID,
        DATA_STORE_ID,
        'default_search'
    );

    const request = {
        pageSize: 5,
        query: query,
        servingConfig: servingConfig,
    };

    try {
        const [response] = await client.search(request);

        console.log("Search response received.");
        if (!response.results || response.results.length === 0) {
            console.log("❌ NO RESULTS FOUND.");
            return;
        }

        console.log(`✅ Found ${response.results.length} results.`);

        let foundImages = false;

        response.results.forEach((result, i) => {
            const data = result.document.derivedStructData;
            console.log(`\n[${i + 1}] Title: ${data.title}`);
            console.log(`    Link: ${data.link}`);

            // Check for potential image fields
            // Vertex AI Search often returns images in snippets or specific metadata fields if configured
            // Standard fields might include 'pagemap' (if web), or specific schema fields
            console.log('    Keys:', Object.keys(data));

            if (data.snippets) {
                console.log(`    Snippet Count: ${data.snippets.length}`);
            }

            // Sometimes images are inside extractive_answers or similar
            if (data.extractive_answers) {
                console.log(`    Extractive Answers: ${data.extractive_answers.length}`);
            }

            // Dump full data for inspection
            // console.log(JSON.stringify(data, null, 2)); 
        });

    } catch (e) {
        console.error("Search failed:", e);
    }
}

debugImageSearch();
