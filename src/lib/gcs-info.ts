import { Storage } from '@google-cloud/storage';

export async function getBucketLastModified(bucketName: string = '20set-bighistory-raw'): Promise<string> {
    try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
        const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        const storageOptions: any = { projectId };
        if (credentialsJson) {
            const credentials = JSON.parse(credentialsJson);
            // Handle private_key newlines if they are escaped literal \n
            if (credentials.private_key) {
                credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
            }
            storageOptions.credentials = credentials;
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
            const credentials = JSON.parse(credentialsJson);
            if (credentials.private_key) {
                credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
            }
            storageOptions.credentials = credentials;
        }

        const storage = new Storage(storageOptions);
        const bucket = storage.bucket(bucketName);

        // Construct prefix: extracted_images/15-Main_p001
        // Need to pad page number to 3 digits
        const pageStr = page.toString().padStart(3, '0');
        const prefix = `extracted_images/${bookId}-Main_p${pageStr}`;

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
