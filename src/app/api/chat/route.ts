import { createVertex } from '@ai-sdk/google-vertex';
import { createDataStreamResponse, streamText } from 'ai';
import { searchStore, answerQuery } from '@/lib/vertex-search';
import fs from 'fs';
import path from 'path';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// Configure Vertex AI with credentials from environment
const project = process.env.GOOGLE_CLOUD_PROJECT_ID || 'rag-bighistory';
const location = 'us-central1'; // Vertex AI typically uses us-central1 for Gemini

const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  : undefined;

const vertex = createVertex({
  project,
  location,
  googleAuthOptions: {
    credentials,
  },
});

// Ensure RAG is initialized (lazy load)
let isRagInitialized = false;


export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Lazy load RAG safely
    // TEMPORARILY DISABLED


    const lastUserMessage = messages.slice().reverse().find((m: { role: string; content: string }) => m.role === 'user')?.content || "";
    let context = "";

    // 1. Retrieval
    // 1. Retrieval (Vertex AI Search)
    if (lastUserMessage) {
      try {
        console.log(`Searching Vertex AI for: ${lastUserMessage}`);
        const searchResults = await searchStore(lastUserMessage);

        if (searchResults.length > 0) {
          context = searchResults.map((result, index) =>
            `[Result ${index + 1}]
Title: ${result.title}
Content: ${result.snippet}
Link: ${result.link || 'N/A'}
---`
          ).join('\n');
          console.log(`Found ${searchResults.length} results from Vertex AI`);
        } else {
          console.log("No results found in Vertex AI");
        }
      } catch (e) {
        console.error("Vertex AI Retrieval failed:", e);
      }
    }

    // 2. System Prompt
    const configPath = path.join(process.cwd(), 'config', 'ai-character.md');
    let baseSystemPrompt = "You are a helpful assistant.";
    try {
      if (fs.existsSync(configPath)) {
        baseSystemPrompt = fs.readFileSync(configPath, 'utf-8');
      }
    } catch (e) { /* ignore */ }

    const systemPrompt = `${baseSystemPrompt}\n\nRetrieved Context:\n${context}`;

    // 3. Generate Answer using Managed RAG
    console.log("Starting Managed Answer API...");
    try {
      const { answerText, citations } = await answerQuery(lastUserMessage);

      console.log("Answer generated successfully.");

      // Return as JSON for now (most robust)
      return Response.json({
        role: 'assistant',
        content: answerText,
        citations: citations
      });
    } catch (error: any) {
      console.error("Error in Answer API:", error);
      throw error;
    }

  } catch (error: any) {
    console.error("API Route Error:", error);
    return new Response(JSON.stringify({ error: `Server Error: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

