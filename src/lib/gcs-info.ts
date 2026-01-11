import { Storage } from '@google-cloud/storage';

export async function getBucketLastModified(bucketName: string = '20set-bighistory-raw'): Promise<string> {
    try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
        const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        const storageOptions: any = { projectId };
        if (credentialsJson) {
            try {
                // Sanitize: Vercel/System envs might accidentally have preserved newlines in the string
                // confusing JSON.parse. simple replace of \n with nothing might break keys.
                // But usually, credentials JSON has explicit \n in private_key.
                // Let's try standard parse first, if fail, try to clean.

                let credentials;
                try {
                    credentials = JSON.parse(credentialsJson);
                } catch (e) {
                    // Fallback: Replace newlines with spaces (for pretty-printed JSON)
                    console.log("Initial JSON parse failed, attempting cleanup with spaces...");
                    const cleaned = credentialsJson.replace(/\r?\n/g, ' ');
                    credentials = JSON.parse(cleaned);
                }

                // Handle private_key newlines
                if (credentials.private_key) {
                    const rawKey = credentials.private_key.replace(/\\n/g, '\n');

                    // Check if key is mangled (missing newlines in PEM header/footer)
                    if (!rawKey.includes('\n') && rawKey.includes('PRIVATE KEY')) {
                        // Attempt to reconstruct PEM
                        const body = rawKey.replace(/-----BEGIN PRIVATE KEY-----/g, '')
                            .replace(/-----END PRIVATE KEY-----/g, '')
                            .replace(/\s+/g, ''); // Remove all spaces

                        const chunked = body.match(/.{1,64}/g)?.join('\n') || body;
                        credentials.private_key = `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----\n`;
                    } else {
                        credentials.private_key = rawKey;
                    }
                }
                storageOptions.credentials = credentials;
            } catch (e) {
                console.error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON", e);
            }
        }

        const storage = new Storage(storageOptions);
        const bucket = storage.bucket(bucketName);

        // Get files metadata
        const [files] = await bucket.getFiles();

        if (!files || files.length === 0) {
            console.warn(`No files found in bucket ${bucketName}`);
            return 'RAG-Bighistory_Unknown';
        }

        // Find the latest updated time
        let latestTime = 0;

        files.forEach(file => {
            if (file.metadata.updated) {
                const time = new Date(file.metadata.updated).getTime();
                if (time > latestTime) {
                    latestTime = time;
                }
            }
        });

        if (latestTime === 0) {
            return 'RAG-Bighistory_Unknown';
        }

        const latestDate = new Date(latestTime);
        // Format: YYYYMMDD
        const yyyy = latestDate.getFullYear();
        const mm = String(latestDate.getMonth() + 1).padStart(2, '0');
        const dd = String(latestDate.getDate()).padStart(2, '0');

        return `RAG-Bighistory_${yyyy}${mm}${dd}`;

    } catch (error: any) {
        console.error('Error fetching GCS bucket info:', error);
        // Expose error message for debugging purposes
        return `GCP Error: ${error.message}`;
    }
}

export async function getMatchingImages(bookId: string, page: number): Promise<string[]> {
    try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
        const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        const bucketName = '20set-bighistory-raw';

        const storageOptions: any = { projectId };
        if (credentialsJson) {
            try {
                let credentials;
                try {
                    credentials = JSON.parse(credentialsJson);
                } catch (e) {
                    // Fallback: Replace newlines with spaces (for pretty-printed JSON)
                    console.log("Initial JSON parse failed in getMatchingImages, attempting cleanup with spaces...");
                    const cleaned = credentialsJson.replace(/\r?\n/g, ' ');
                    credentials = JSON.parse(cleaned);
                }

                // Handle private_key newlines
                if (credentials.private_key) {
                    const rawKey = credentials.private_key.replace(/\\n/g, '\n');

                    // Check if key is mangled
                    if (!rawKey.includes('\n') && rawKey.includes('PRIVATE KEY')) {
                        const body = rawKey.replace(/-----BEGIN PRIVATE KEY-----/g, '')
                            .replace(/-----END PRIVATE KEY-----/g, '')
                            .replace(/\s+/g, '');
                        const chunked = body.match(/.{1,64}/g)?.join('\n') || body;
                        credentials.private_key = `-----BEGIN PRIVATE KEY-----\n${chunked}\n-----END PRIVATE KEY-----\n`;
                    } else {
                        credentials.private_key = rawKey;
                    }
                }
                storageOptions.credentials = credentials;
            } catch (e) {
                console.error("Failed to parse Creds in getMatchingImages", e);
            }
        }

        const storage = new Storage(storageOptions);
        const bucket = storage.bucket(bucketName);

        // Normalize bookId: "02" -> "2" to match folder structure
        const normalizedBookId = parseInt(bookId, 10).toString();

        // Construct prefix: extracted_images/{normalizedBookId}/images/p{page}_
        // Upload structure is: extracted_images/1/images/p1_1.png (No zero padding on page)
        const prefix = `extracted_images/${normalizedBookId}/images/p${page}_`;

        console.log(`Searching images with prefix: ${prefix}`);

        const [files] = await bucket.getFiles({ prefix });

        // Filter for image files
        const imageFiles = files.filter(f => f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));

        if (imageFiles.length === 0) return [];

        // Generate Signed URLs
        const urls = await Promise.all(imageFiles.map(async (file) => {
            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 1000 * 60 * 60, // 1 hour
            });
            return url;
        }));

        return urls;

    } catch (error) {
        console.error('Error fetching matching images:', error);
        return [];
    }
}
