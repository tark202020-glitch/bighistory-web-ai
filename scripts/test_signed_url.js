require('dotenv').config({ path: '.env.local' });
const { Storage } = require('@google-cloud/storage');

async function main() {
    try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
        const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        const storageOptions = { projectId };
        if (credentialsJson) {
            console.log("Raw JSON length:", credentialsJson.length);
            try {
                const credentials = JSON.parse(credentialsJson);
                console.log("Parsed keys:", Object.keys(credentials));
                console.log("client_email present:", !!credentials.client_email);

                if (credentials.private_key) {
                    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
                }
                storageOptions.credentials = credentials;
            } catch (e) {
                console.error("JSON Parse Error:", e.message);
            }
        }

        const storage = new Storage(storageOptions);
        const bucket = storage.bucket('20set-bighistory-raw');

        // Known existing file from previous debug output
        const fileName = 'extracted_images/15-Main_p001_01.jpeg';
        const file = bucket.file(fileName);

        const [exists] = await file.exists();
        if (!exists) {
            console.error(`File ${fileName} does not exist!`);
            return;
        }

        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60, // 1 hour
        });

        console.log("\n--- Generated Signed URL ---");
        console.log(url);
        console.log("----------------------------\n");

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
