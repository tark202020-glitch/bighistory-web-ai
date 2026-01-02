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

        // 3. Raw REST Prediction Test (Bypass SDK)
        let restTest: any = {};
        try {
            const accessToken = await getAccessToken(credentials);
            if (accessToken) {
                // Use asia-northeast3 (Seoul) as it's often more reliable for Korean projects
                const targetReg = locations.includes('asia-northeast3') ? 'asia-northeast3' : 'us-central1';

                const restResp = await fetch(`https://${targetReg}-aiplatform.googleapis.com/v1/projects/${project}/locations/${targetReg}/publishers/google/models/gemini-1.5-flash:streamGenerateContent`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
                    })
                });

                if (restResp.ok) {
                    restTest = { success: true, region: targetReg, status: restResp.status };
                } else {
                    const errText = await restResp.text();
                    restTest = { success: false, region: targetReg, status: restResp.status, error: errText };
                }
            }
        } catch (e: any) {
            restTest = { success: false, error: e.message };
        }

        return Response.json({
            status: 'Diagnostic Step 7',
            identity: {
                client_email: credentials?.client_email,
                project_id: project
            },
            search: { success: !searchError },
            locations_check: {
                success: !locationError,
                available_regions: locations,
            },
            raw_rest_test: restTest,
            sdk_recommendation: restTest.success ? "REST works, SDK might be the issue" : "REST failed, GCP/IAM is definitely the issue"
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


