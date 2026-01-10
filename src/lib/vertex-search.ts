import { SearchServiceClient } from '@google-cloud/discoveryengine';
import { GoogleAuth } from 'google-auth-library';

// Configuration
// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
const LOCATION = 'global'; // or 'us', 'eu' etc. usually 'global' for basic setups
const DATA_STORE_ID = 'bighistory-set-raw-chunking-20260110_1768030786251'; // Updated 2026-01-10 (Chunking Enabled & New App)
const COLLECTION_ID = 'default_collection'; // Default collection

// Lazy initialization helper
function getClient() {
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
        ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
        : undefined;

    return new SearchServiceClient({
        apiEndpoint: 'discoveryengine.googleapis.com',
        credentials
    });
}


export interface SearchResult {
    title: string;
    snippet: string;
    link?: string;
    id?: string;
    page?: number;     // Added page number
    sourceUri?: string; // Added source URI for file parsing
}

export async function searchStore(query: string): Promise<SearchResult[]> {
    const client = getClient();
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
        searchResultMode: 'CHUNKS', // Explicitly request chunks
        // contentSearchSpec: {
        //    snippetSpec: { returnSnippet: true },
        // }
    };

    try {
        const [response] = await client.search(request);

        if (!response || response.length === 0) {
            return [];
        }

        return response.map((result, index) => {
            // console.log("DEBUG RAW RESULT:", JSON.stringify(result, null, 2)); // Removed verbose log

            // Handle CHUNK mode response
            if (result.chunk) {
                const chunk = result.chunk;
                console.log("DEBUG CHUNK:", JSON.stringify(chunk, null, 2)); // Temporary Debug
                return {
                    title: chunk.documentMetadata?.title || 'No Title',
                    snippet: chunk.content || 'No content',
                    link: chunk.documentMetadata?.uri || '', // Use URI as link
                    id: chunk.id || '',
                    sourceUri: chunk.documentMetadata?.uri || '',
                    page: chunk.pageSpan?.pageStart || undefined
                };
            }

            // Fallback to Document mode
            const data = result.document?.derivedStructData as any;
            const structData = result.document?.structData as any;

            // Helper to get value from Struct or Object
            const getField = (obj: any, field: string) => {
                if (!obj) return undefined;
                if (obj[field] && typeof obj[field] !== 'object') return obj[field]; // Plain access (primitive)
                if (obj[field]?.kind) { // Direct ProtoValue
                    return obj[field].stringValue || obj[field].numberValue;
                }
                if (obj.fields && obj.fields[field]) { // Proto Struct access
                    return obj.fields[field].stringValue || obj.fields[field].numberValue;
                }
                return undefined;
            };

            // Get URI and Title
            const title = getField(data, 'title') || getField(structData, 'title') || 'No Title';
            const uri = getField(data, 'link') || getField(data, 'uri') || getField(structData, 'uri') || getField(structData, 'link') || '';

            // Try to find page number
            // Note: data (derivedStructData) is also a formatting Struct in this environment
            let page = getField(data, 'page_number') ||
                getField(data, 'page') ||
                getField(structData, 'page_number') ||
                getField(structData, 'page');

            // Heuristic: Extract page from Title or URI if metadata is missing
            // Looks for patterns like "_p023_", "Page 23", etc.
            if (!page) {
                const titleMatch = title.match(/_p(\d+)/i) || title.match(/Page\s?(\d+)/i);
                const uriMatch = uri.match(/_p(\d+)/i) || uri.match(/Page\s?(\d+)/i);

                if (titleMatch) {
                    page = titleMatch[1];
                } else if (uriMatch) {
                    page = uriMatch[1];
                }
            }

            // Normalize page to number
            if (page) page = parseInt(page, 10);

            return {
                title: title,
                snippet: 'Content available in chunks or metadata', // Simplification as snippets are deeply nested in Proto
                link: uri,
                id: result.document?.id || '',
                sourceUri: uri,
                page: page
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
        const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
            ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
            : undefined;

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

        let lastError;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
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
                            modelSpec: {}
                        }
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    // 5xx errors are worth retrying
                    if (response.status >= 500 && response.status < 600) {
                        throw new Error(`Server Error (${response.status}): ${errText}`);
                    }
                    // 4xx errors usually shouldn't be retried (client error)
                    throw new Error(`Answer API failed (${response.status}): ${errText}`);
                }

                // Success
                const data = await response.json();

                // Cost Estimation Logic
                // Base Query Cost: ~$0.01 (Vertex AI Search Standard)
                // Output Token Cost: ~$0.000375 / 1k characters (approx Gemini Pro pricing)
                const answerLength = data.answer?.answerText?.length || 0;
                const estimatedCost = 0.01 + ((answerLength / 4) * 0.000000375);

                return {
                    answerText: data.answer?.answerText || "답변을 생성할 수 없습니다.",
                    citations: data.answer?.citations || [],
                    references: data.answer?.references || [],
                    steps: data.answer?.steps || [],
                    estimatedCost: parseFloat(estimatedCost.toFixed(6))
                };

            } catch (error: any) {
                lastError = error;
                console.warn(`Vertex AI Attempt ${attempt} failed:`, error.message);

                if (attempt < maxRetries) {
                    // Exponential backoff: 1s, 2s, 4s...
                    const delay = Math.pow(2, attempt - 1) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new Error("Vertex AI request failed after retries.");

    } catch (error) {
        console.error('Vertex AI Answer Error:', error);
        throw error;
    }
}
