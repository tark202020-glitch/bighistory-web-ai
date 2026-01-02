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

        // 1. Test Search
        try {
            const searchRes = await searchStore('빅히스토리');
            results.push(...searchRes);
        } catch (e: any) {
            searchError = e.message;
        }

        // 2. Test Generation
        let genText = "";
        let genError = null;
        try {
            const { text } = await generateText({
                model: vertex('gemini-1.5-flash'),
                prompt: '빅히스토리에 대해 한 문장으로 설명해줘.',
            });
            genText = text;
        } catch (e: any) {
            genError = e.message;
        }

        return Response.json({
            status: 'Test Complete',
            search: {
                success: !searchError,
                count: results.length,
                firstResult: results[0] || null,
                error: searchError
            },
            generation: {
                success: !genError,
                text: genText,
                error: genError
            },
            env: {
                hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
                hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
            }
        });

    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
