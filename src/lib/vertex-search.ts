import { SearchServiceClient } from '@google-cloud/discoveryengine';

// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
const LOCATION = 'global'; // or 'us', 'eu' etc. usually 'global' for basic setups
const DATA_STORE_ID = '20set-bighistory-20260102_1767348297906';
const COLLECTION_ID = 'default_collection'; // Default collection

// If using a raw JSON string in env var (common in Vercel)
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    : undefined;

const client = new SearchServiceClient({
    apiEndpoint: 'discoveryengine.googleapis.com',
    credentials
});

export interface SearchResult {
    title: string;
    snippet: string;
    link?: string;
}

export async function searchStore(query: string): Promise<SearchResult[]> {
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

        if (!response || response.length === 0) {
            return [];
        }

        return response.map(result => {
            const data = result.document?.derivedStructData as any;
            return {
                title: data?.title || 'No Title',
                snippet: data?.snippets?.[0]?.snippet || data?.extractive_answers?.[0]?.content || 'No content',
                link: data?.link || '',
            };
        });
    } catch (error) {
        console.error('Vertex AI Search Error:', error);
        return [];
    }
}
