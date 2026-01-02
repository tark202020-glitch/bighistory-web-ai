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

        // 3. Robust Generation Test (Try asia-northeast3 first, then us-central1)
        const priorityRegions = ['asia-northeast3', 'us-central1'];
        let genAttempts: any = {};
        let successRegion = null;

        for (const region of priorityRegions) {
            if (locations.includes(region) || locations.includes('global')) { // Try if listed or global is present
                try {
                    const regionalVertex = createVertex({
                        project,
                        location: region,
                        googleAuthOptions: { credentials },
                    });
                    const { text } = await generateText({
                        model: regionalVertex('gemini-1.5-flash-001'),
                        prompt: 'Hello from ' + region,
                    });
                    genAttempts[region] = { success: true, text };
                    successRegion = region;
                    break; // Stop on first success
                } catch (e: any) {
                    genAttempts[region] = { success: false, error: e.message };
                }
            } else {
                genAttempts[region] = { success: false, error: "Region not in available locations list" };
            }
        }

        return Response.json({
            status: 'Diagnostic Step 6',
            identity: {
                client_email: credentials?.client_email,
                project_id: project
            },
            search: { success: !searchError },
            locations_check: {
                success: !locationError,
                available_regions: locations,
            },
            generation_attempts: genAttempts,
            recommended_region: successRegion || "None found"
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


