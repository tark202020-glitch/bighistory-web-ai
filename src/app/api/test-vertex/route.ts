import { createVertex } from '@ai-sdk/google-vertex';
import { generateText } from 'ai';
import { searchStore } from '@/lib/vertex-search';
import { GoogleAuth } from 'google-auth-library';

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

        // 2. List Accessible Locations (Global Check)
        let locations = [];
        let locationError = null;
        try {
            const accessToken = await getAccessToken(credentials);
            if (accessToken) {
                // Check global endpoint to see active regions
                const locResp = await fetch(`https://aiplatform.googleapis.com/v1/projects/${project}/locations`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (locResp.ok) {
                    const data = await locResp.json();
                    locations = data.locations?.map((l: any) => l.locationId) || [];
                } else {
                    const err = await locResp.text();
                    locationError = `Location List failed: ${locResp.status} ${err}`;
                }
            }
        } catch (e: any) {
            locationError = e.message;
        }

        // 3. Project Identity & Answer API Test
        let altDiag: any = {};
        const projectNumber = '1067407319558';
        try {
            const accessToken = await getAccessToken(credentials);
            if (accessToken) {
                // Test A: Does list work with Project NUMBER instead of ID?
                const numListResp = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${projectNumber}/locations/us-central1/publishers/google/models?pageSize=1`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                altDiag.project_number_test = { status: numListResp.status, ok: numListResp.ok };

                // Test B: Discovery Engine 'Answer' API (Since search works, this might too)
                const answerResp = await fetch(`https://discoveryengine.googleapis.com/v1/projects/${project}/locations/global/collections/default_collection/dataStores/20set-bighistory-20260102_1767348297906/servingConfigs/default_search:answer`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: { text: '빅히스토리에 대해 요약해줘' },
                        answerGenerationSpec: {
                            modelSpec: { modelId: 'gemini-1.5-flash' },
                            promptSpec: { preamble: '검색 결과를 바탕으로 친절하게 답변해줘' },
                            includeCitations: true
                        }
                    })
                });
                altDiag.discovery_answer_api = { status: answerResp.status, ok: answerResp.ok };
                if (!answerResp.ok) altDiag.discovery_answer_error = await answerResp.text();
            }
        } catch (e: any) { altDiag.error = e.message; }

        return Response.json({
            status: 'Diagnostic Step 10',
            identity: {
                client_email: credentials?.client_email,
                project_id: project,
                project_number: projectNumber
            },
            search: { success: !searchError },
            alternative_diagnostics: altDiag,
            recommendation: altDiag.discovery_answer_api?.ok
                ? "Answer API works! We should probably switch to Discovery Engine's native answer feature."
                : "Both standard Vertex and Discovery Answer failed. This project has a deep model-access block. Check Billing/Organization Policies."
        });


    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}


// Helper to get token (rudimentary implementation for test)
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


