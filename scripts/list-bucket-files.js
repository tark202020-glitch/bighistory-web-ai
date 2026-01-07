// Standalone script to list files in GCS bucket
require('dotenv').config({ path: '.env.local' });
const { Storage } = require('@google-cloud/storage');

async function listBucketFiles() {
    const bucketName = '20set-bighistory-raw';

    console.log(`Listing files in bucket: ${bucketName}...`);

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    const storageOptions = { projectId };
    if (credentialsJson) {
        const credentials = JSON.parse(credentialsJson);
        if (credentials.private_key) {
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }
        storageOptions.credentials = credentials;
    }

    const storage = new Storage(storageOptions);

    try {
        const bucket = storage.bucket(bucketName);
        const [files] = await bucket.getFiles();

        const imageFiles = files.filter(f => f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));
        const pdfFiles = files.filter(f => f.name.endsWith('.pdf'));

        console.log(`\n=== Summary ===`);
        console.log(`Total files: ${files.length}`);
        console.log(`PDF files: ${pdfFiles.length}`);
        console.log(`Image files: ${imageFiles.length}`);

        if (imageFiles.length > 0) {
            console.log("\n[Sample Image Files]");
            imageFiles.slice(0, 15).forEach(f => console.log(`- ${f.name}`));
        } else {
            console.log("\n❌ No separate image files found in the bucket.");
        }

    } catch (error) {
        console.error('Error listing files:', error);
    }
}

listBucketFiles();
