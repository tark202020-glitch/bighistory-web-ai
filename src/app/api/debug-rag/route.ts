import { NextResponse } from 'next/server';
import { searchStore } from '@/lib/vertex-search';
import { Storage } from '@google-cloud/storage';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '빅뱅'; // Default query

        // 1. Test Search
        console.log(`Debugging Search for: ${query}`);
        const searchResults = await searchStore(query);

        // 2. Test Bucket Listing
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
        const bucketName = '20set-bighistory-raw';
        const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        let storageOptions: any = { projectId };
        if (credentialsJson) {
            try {
                const credentials = JSON.parse(credentialsJson);
                if (credentials.private_key) {
                    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
                }
                storageOptions.credentials = credentials;
            } catch (e) {
                console.error("Cred parse error", e);
            }
        }

        const storage = new Storage(storageOptions);
        const bucket = storage.bucket(bucketName);

        // List files in extracted_images
        const [files] = await bucket.getFiles({ prefix: 'extracted_images/', maxResults: 50 });
        const fileList = files.map(f => f.name);

        return NextResponse.json({
            query,
            searchResults: searchResults.map(r => ({
                title: r.title,
                sourceUri: r.sourceUri, // Crucial
                page: r.page,           // Crucial
                id: r.id,
                snippet_preview: r.snippet.substring(0, 50)
            })),
            gcsFiles_preview: fileList
        });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
