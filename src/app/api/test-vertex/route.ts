import { createVertex } from '@ai-sdk/google-vertex';
import { generateText } from 'ai';
import { searchStore } from '@/lib/vertex-search';

// Configure Vertex AI
const project = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
const location = 'us-central1';
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
    : undefined;

const vertex = createVertex({
    project,
    location,
    googleAuthOptions: { credentials },
});

export async function GET() {
    try {
        const results = [];
        let searchError = null;

        // 1. Test Search (to confirm Auth & Discovery Engine API)
        try {
            const searchRes = await searchStore('빅히스토리');
            results.push(...searchRes);
        } catch (e: any) {
            searchError = e.message;
        }

        // 2. List Available Models (to verify visibility)
        let visibleModels = [];
        let listError = null;
        try {
            // Using raw REST call to list models because SDK abstraction hides it
            const accessToken = await getAccessToken(credentials);
            if (accessToken) {
                const listResp = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/publishers/google/models`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (listResp.ok) {
                    const data = await listResp.json();
                    visibleModels = data.models?.map((m: any) => m.name.split('/').pop()) || [];
                } else {
                    const err = await listResp.text();
                    listError = `List API failed: ${listResp.status} ${err}`;
                }
            } else {
                listError = "Could not generate access token";
            }
        } catch (e: any) {
            listError = e.message;
        }

        // 3. Test Generation with confirmed model or default
        const testModel = visibleModels.find((m: string) => m.includes('flash')) || 'gemini-1.5-flash-001';
        let genResult = null;
        try {
            const vertexClient = createVertex({
                project,
                location: 'us-central1',
                googleAuthOptions: { credentials },
            });
            const { text } = await generateText({
                model: vertexClient(testModel),
                prompt: 'Test',
            });
            genResult = { success: true, text, model: testModel };
        } catch (e: any) {
            genResult = { success: false, error: e.message, model: testModel };
        }

        return Response.json({
            status: 'Diagnostic Step 3',
            identity: {
                client_email: credentials?.client_email,
            },
            search: { success: !searchError },
            model_visibility: {
                success: !listError,
                count: visibleModels.length,
                examples: visibleModels.slice(0, 5),
                error: listError
            },
            generation_attempt: genResult
        });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// Helper to get token (rudimentary implementation for test)
import { GoogleAuth } from 'google-auth-library';
async function getAccessToken(creds: any) {
    if (!creds) return null;
    const auth = new GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
}

    } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
}
}
