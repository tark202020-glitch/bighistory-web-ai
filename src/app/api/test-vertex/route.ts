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

        // 2. List Available Models (Multi-region check)
        const checkRegions = ['us-central1', 'asia-northeast3'];
        const visibilityResult: any = {};

        for (const reg of checkRegions) {
            try {
                const accessToken = await getAccessToken(credentials);
                if (accessToken) {
                    const listResp = await fetch(`https://${reg}-aiplatform.googleapis.com/v1/projects/${project}/locations/${reg}/publishers/google/models`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (listResp.ok) {
                        const data = await listResp.json();
                        visibilityResult[reg] = {
                            success: true,
                            count: data.models?.length || 0,
                            examples: data.models?.slice(0, 3).map((m: any) => m.name.split('/').pop())
                        };
                    } else {
                        visibilityResult[reg] = { success: false, status: listResp.status, error: await listResp.text() };
                    }
                }
            } catch (e: any) {
                visibilityResult[reg] = { success: false, error: e.message };
            }
        }

        // 3. Test Search WITH Summary (Plan B: Use Search's own generation)
        let summaryTest: any = {};
        try {
            const searchResWithSummary = await searchStore('빅히스토리', true); // Need to update searchStore signature?? No, let's call raw client here for test logic or update utility later.
            // Actually, let's just do a raw manual search call here to avoid changing utility yet
            // We can't easily import the client from utility as it's not exported. 
            // Let's defer this specific "summary" test to the utility update if needed, 
            // for now just stick to the region check which is critical.
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


