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

        // 3. Try Generation on First Available Location
        let genResult = null;
        const validRegion = locations.includes('us-central1') ? 'us-central1' :
            locations.includes('asia-northeast3') ? 'asia-northeast3' :
                locations[0]; // Fallback to first available

        if (validRegion) {
            const testModel = 'gemini-1.5-flash-001';
            try {
                const regionalVertex = createVertex({
                    project,
                    location: validRegion,
                    googleAuthOptions: { credentials },
                });
                const { text } = await generateText({
                    model: regionalVertex(testModel),
                    prompt: 'Test',
                });
                genResult = { success: true, region: validRegion, text };
            } catch (e: any) {
                genResult = { success: false, region: validRegion, error: e.message };
            }
        }

        return Response.json({
            status: 'Diagnostic Step 5',
            identity: {
                client_email: credentials?.client_email,
                project_id: project
            },
            search: { success: !searchError },
            locations_check: {
                success: !locationError,
                available_regions: locations,
                error: locationError
            },
            generation_attempt: genResult || "Skipped (No valid region found)"
        });

        // 3. Test Search WITH Summary (Plan B: Use Search's own generation)
        let summaryTest: any = {};
        try {
            // Fix: searchStore only accepts 1 arg currently. 
            // Just verifying it doesn't throw is enough for now.
            await searchStore('빅히스토리');
        } catch (e) { }


        // Re-attempt generation only if a region showed success
        let genResult = null;
        const validRegion = Object.keys(visibilityResult).find(r => visibilityResult[r].success);

        if (validRegion) {
            const testModel = 'gemini-1.5-flash-001';
            try {
                const vertexClient = createVertex({
                    project,
                    location: validRegion,
                    googleAuthOptions: { credentials },
                });
                const { text } = await generateText({
                    model: vertexClient(testModel),
                    prompt: 'Test',
                });
                genResult = { success: true, region: validRegion, text };
            } catch (e: any) {
                genResult = { success: false, region: validRegion, error: e.message };
            }
        }

        return Response.json({
            status: 'Diagnostic Step 4',
            identity: {
                client_email: credentials?.client_email,
            },
            search: { success: !searchError },
            regions_visibility: visibilityResult,
            generation_attempt: genResult || "Skipped (No visible model region found)"
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


