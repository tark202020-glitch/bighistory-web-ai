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

        // 3. Deep Diagnostic (Publishers & Beta API)
        let deepDiag: any = {};
        try {
            const accessToken = await getAccessToken(credentials);
            if (accessToken) {
                const reg = locations.includes('us-central1') ? 'us-central1' : 'asia-northeast3';

                // Test A: List Publishers to see if 'google' is visible
                try {
                    const pubResp = await fetch(`https://${reg}-aiplatform.googleapis.com/v1/projects/${project}/locations/${reg}/publishers`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    if (pubResp.ok) {
                        const pubData = await pubResp.json();
                        deepDiag.publishers = pubData.publishers?.map((p: any) => p.name.split('/').pop());
                    } else {
                        deepDiag.publishers_error = `Error ${pubResp.status}: ${await pubResp.text()}`;
                    }
                } catch (e: any) { deepDiag.publishers_error = e.message; }

                // Test B: Try v1beta1 Prediction (Last Resort)
                try {
                    const betaResp = await fetch(`https://${reg}-aiplatform.googleapis.com/v1beta1/projects/${project}/locations/${reg}/publishers/google/models/gemini-1.5-flash:streamGenerateContent`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] })
                    });
                    deepDiag.v1beta1_test = { status: betaResp.status, ok: betaResp.ok };
                    if (!betaResp.ok) deepDiag.v1beta1_error = await betaResp.text();
                } catch (e: any) { deepDiag.v1beta1_error = e.message; }

                // Test C: Try explicit v1 model name gemini-1.5-flash-001
                try {
                    const fullModelResp = await fetch(`https://${reg}-aiplatform.googleapis.com/v1/projects/${project}/locations/${reg}/publishers/google/models/gemini-1.5-flash-001:streamGenerateContent`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] })
                    });
                    deepDiag.full_model_test = { status: fullModelResp.status, ok: fullModelResp.ok };
                } catch (e: any) { deepDiag.full_model_test_error = e.message; }
            }
        } catch (e: any) {
            deepDiag.error = e.message;
        }

        return Response.json({
            status: 'Diagnostic Step 8',
            identity: {
                client_email: credentials?.client_email,
                project_id: project
            },
            search: { success: !searchError },
            deep_diagnostic: deepDiag,
            final_guess: (deepDiag.publishers && !deepDiag.publishers.includes('google'))
                ? "GCP Project is not linked to Google publishers. Vertex AI API might not be fully initialized."
                : "Registry is correct, but models are hidden. Check billing or API enablement at https://console.cloud.google.com/vertex-ai"
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


