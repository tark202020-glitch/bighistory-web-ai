import { Storage } from '@google-cloud/storage';

export async function getBucketLastModified(bucketName: string = '20set-bighistory-raw'): Promise<string> {
    try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
        const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        const storageOptions: any = { projectId };
        if (credentialsJson) {
            storageOptions.credentials = JSON.parse(credentialsJson);
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

    } catch (error) {
        console.error('Error fetching GCS bucket info:', error);
        // In case of error (e.g. auth failed in dev), return a default or today's date?
        // Let's return a safe fallback to avoid crashing the UI
        return 'GCP: rag-bighistory (Connect Error)';
    }
}
