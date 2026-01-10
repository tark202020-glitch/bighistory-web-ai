import { createVertex } from '@ai-sdk/google-vertex';
import { generateText } from 'ai';
import { searchStore } from '@/lib/vertex-search';
import { GoogleAuth } from 'google-auth-library';

// Configure Vertex AI
// Configure Vertex AI
const project = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
const location = 'us-central1';


export async function GET() {
    try {
        const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
            ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
            : undefined;

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

        // 3. Project Identity & Answer API Test (FIXED)
        let altDiag: any = {};
        const projectNumber = '1067407319558';
        try {
            const accessToken = await getAccessToken(credentials);
            if (accessToken) {
                // Test A: Does list work with Project NUMBER? (Previous: 404)

                // Test B: Discovery Engine 'Answer' API (Endpoint reached in Step 10!)
                // Fixing: Unknown name "modelId" at 'answer_generation_spec.model_spec'
                const answerResp = await fetch(`https://discoveryengine.googleapis.com/v1/projects/${project}/locations/global/collections/default_collection/dataStores/20set-bighistory-20260102_1767348297906/servingConfigs/default_search:answer`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: { text: '빅히스토리에 대해 요약해줘' },
                        answerGenerationSpec: {
                            modelSpec: {
                                modelVersion: 'gemini-1.5-flash-001/answer_gen_v3.1' // Correct internal version name or leave empty
                            },
                            promptSpec: { preamble: '검색 결과를 바탕으로 친절하게 답변해줘' },
                            includeCitations: true
                        }
                    })
                });
                altDiag.discovery_answer_api = { status: answerResp.status, ok: answerResp.ok };
                if (!answerResp.ok) {
                    altDiag.discovery_answer_error = await answerResp.text();

                    // Fallback: Try with EMPTY modelSpec (let GCP choose)
                    const fallbackResp = await fetch(`https://discoveryengine.googleapis.com/v1/projects/${project}/locations/global/collections/default_collection/dataStores/20set-bighistory-20260102_1767348297906/servingConfigs/default_search:answer`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            query: { text: '안녕' },
                            answerGenerationSpec: {
                                includeCitations: true
                            }
                        })
                    });
                    altDiag.answer_fallback = { status: fallbackResp.status, ok: fallbackResp.ok };
                    if (fallbackResp.ok) {
                        const data = await fallbackResp.json();
                        altDiag.sample_answer = data.answer?.answerText;
                    }
                } else {
                    const data = await answerResp.json();
                    altDiag.sample_answer = data.answer?.answerText;
                }
            }
        } catch (e: any) { altDiag.error = e.message; }

        return Response.json({
            status: 'Diagnostic Step 11',
            identity: {
                client_email: credentials?.client_email,
                project_id: project
            },
            search: { success: !searchError },
            alternative_diagnostics: altDiag,
            recommendation: (altDiag.discovery_answer_api?.ok || altDiag.answer_fallback?.ok)
                ? "Answer API works! This is the solution. We will use Discovery Engine's generative feature directly."
                : "Both standard Vertex and Discovery Answer failed. Requesting specialized support or checking IAM: Discovery Engine Editor role."
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


