import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
        const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        let debugInfo: any = {
            projectId,
            hasCredentialsJson: !!credentialsJson,
            jsonLength: credentialsJson?.length || 0,
        };

        if (!credentialsJson) {
            return NextResponse.json({ status: 'ERROR', message: 'Missing GOOGLE_APPLICATION_CREDENTIALS_JSON', debugInfo });
        }

        let credentials;
        try {
            credentials = JSON.parse(credentialsJson);
            debugInfo.parsedKeys = Object.keys(credentials);
            debugInfo.hasClientEmail = !!credentials.client_email;
            debugInfo.hasPrivateKey = !!credentials.private_key;
        } catch (e: any) {
            return NextResponse.json({ status: 'ERROR', message: 'JSON Parse Failed', error: e.message, debugInfo });
        }

        if (!credentials.client_email) {
            return NextResponse.json({ status: 'CRITICAL', message: 'Missing client_email in JSON', debugInfo });
        }

        // Try GCS Access
        const storageOptions: any = { projectId, credentials };
        if (credentials.private_key) {
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }
        storageOptions.credentials = credentials;

        const storage = new Storage(storageOptions);
        const bucketName = '20set-bighistory-raw';
        const bucket = storage.bucket(bucketName);

        // Try to list 5 images
        const [files] = await bucket.getFiles({ prefix: 'extracted_images/', maxResults: 5 });
        const fileList = files.map(f => f.name);

        // Try Signing URL for first file
        let signedUrl = 'N/A';
        if (files.length > 0) {
            try {
                const [url] = await files[0].getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 60 * 1000,
                });
                signedUrl = url; // Success!
            } catch (signErr: any) {
                signedUrl = `FAILED: ${signErr.message}`;
            }
        }

        return NextResponse.json({
            status: 'OK',
            bucketName,
            fileCount: files.length,
            sampleFiles: fileList,
            signedUrlTest: signedUrl,
            debugInfo
        });

    } catch (error: any) {
        return NextResponse.json({ status: 'FATAL', error: error.message, stack: error.stack });
    }
}
