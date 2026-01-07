// Standalone script to debug image injection logic (Search + GCS Check)
require('dotenv').config({ path: '.env.local' });
const { DocumentServiceClient } = require('@google-cloud/discoveryengine');
const { Storage } = require('@google-cloud/storage');

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
const LOCATION = 'global';
const DATA_STORE_ID = '20set-bighistory-20260102_1767348297906';
const COLLECTION_ID = 'default_collection';
const BUCKET_NAME = '20set-bighistory-raw';

async function debugInjection() {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const credentials = credentialsJson ? JSON.parse(credentialsJson) : undefined;
    if (credentials && credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const client = new DocumentServiceClient({
        apiEndpoint: 'discoveryengine.googleapis.com',
        credentials
    });

    const parent = client.projectLocationCollectionDataStorePath(
        PROJECT_ID,
        LOCATION,
        COLLECTION_ID,
        DATA_STORE_ID
    );

    console.log(`\n📂 Listing documents in DataStore: ${DATA_STORE_ID}`);

    try {
        const [documents] = await client.listDocuments({
            parent: parent,
            pageSize: 10
        });

        console.log(`✅ ListDocuments returned ${documents.length} documents.`);

        if (documents.length > 0) {
            documents.forEach((doc, i) => {
                const data = doc.derivedStructData;
                const structData = doc.structData;
                console.log(`[${i + 1}] ID: ${doc.id}`);
                console.log(`    Title: ${data?.title || structData?.title || 'No Title'}`);
                console.log(`    URI: ${data?.link || structData?.uri || 'No URI'}`);
            });
        } else {
            console.log("⚠️ No documents found. Store might be empty or processing.");
        }

    } catch (e) {
        console.error("ListDocuments failed:", e);
    }
}

debugInjection();
