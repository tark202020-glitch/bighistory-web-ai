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

        // 2. Test Generation with specific stable models in us-central1
        const models = ['gemini-1.0-pro', 'gemini-1.5-pro-001', 'gemini-1.5-flash-001'];
        const modelTests: any = {};
        const vertexClient = createVertex({
            project,
            location: 'us-central1', // Stick to default since all regions failed
            googleAuthOptions: { credentials },
        });

        for (const model of models) {
            try {
                const { text } = await generateText({
                    model: vertexClient(model),
                    prompt: 'Short test.',
                });
                modelTests[model] = { success: true, text };
            } catch (e: any) {
                modelTests[model] = { success: false, error: e.message };
            }
        }

        return Response.json({
            status: 'Diagnostic Complete',
            identity: {
                client_email: credentials?.client_email || 'unknown',
                project_id: project,
            },
            search: {
                success: !searchError,
                count: results.length,
                error: searchError
            },
            models: modelTests,
        });

    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
