import { SearchServiceClient } from '@google-cloud/discoveryengine';
import { GoogleAuth } from 'google-auth-library';

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

/**
 * Uses Discovery Engine's Managed Answer API (Native RAG)
 */
export async function answerQuery(query: string, customPreamble?: string) {
    try {
        const auth = new GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const authClient = await auth.getClient();
        const tokenResp = await authClient.getAccessToken();
        const accessToken = tokenResp.token;

        if (!accessToken) throw new Error("Could not generate Google Access Token");

        const endpoint = `https://discoveryengine.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/collections/${COLLECTION_ID}/dataStores/${DATA_STORE_ID}/servingConfigs/default_search:answer`;

        const defaultPreamble = "당신은 '빅히스토리' 전문가입니다. 제공된 검색 결과(Context)를 바탕으로 사용자의 질문에 친절하고 정확하게 답변해주세요. 만약 검색 결과에 답이 없다면, 다른 외부 지식을 사용하지 말고 솔직하게 모른다고 답변해주세요.";

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: { text: query },
                answerGenerationSpec: {
                    ignoreAdversarialQuery: true,
                    includeCitations: true,
                    promptSpec: {
                        preamble: customPreamble || defaultPreamble
                    },
                    modelSpec: {
                        // Using default best model for Answer API
                    }
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Answer API failed (${response.status}): ${err}`);
        }

        const data = await response.json();
        return {
            answerText: data.answer?.answerText || "답변을 생성할 수 없습니다.",
            citations: data.answer?.citations || [],
            references: data.answer?.references || [],
            steps: data.answer?.steps || []
        };
    } catch (error) {
        console.error('Vertex AI Answer Error:', error);
        throw error;
    }
}
