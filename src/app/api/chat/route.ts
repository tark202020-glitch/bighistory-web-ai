import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { initializeRAG } from '@/lib/pdf-loader';
import { findMostSimilar } from '@/lib/vector-store';
import { generateEmbedding } from '@/lib/embeddings';
import fs from 'fs';
import path from 'path';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

// Create a custom Google provider instance with the explicit API Key
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'AIzaSyDUDPdKF93YK6Q3nM8WNqV8ubvVDI1A7H4',
});

// Ensure RAG is initialized (lazy load)
let isRagInitialized = false;


export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 0. API Configuration Check
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey || apiKey === 'AIzaSyDUDPdKF93YK6Q3nM8WNqV8ubvVDI1A7H4') {
      return new Response(JSON.stringify({
        error: "Configuration Error: Google API Key is missing or using the default dummy value. Please set GOOGLE_GENERATIVE_AI_API_KEY in Vercel Settings."
      }), { status: 500 });
    }

    // Lazy load RAG safely
    if (!isRagInitialized) {
      try {
        await initializeRAG();
        isRagInitialized = true;
      } catch (ragError) {
        console.error("RAG Initialization Failed (Non-fatal):", ragError);
        // Continue without RAG
      }
    }

    const lastUserMessage = messages.slice().reverse().find((m: { role: string; content: string }) => m.role === 'user')?.content || "";
    let context = "";

    // 1. Retrieval
    if (isRagInitialized && lastUserMessage) {
      try {
        const queryEmbedding = await generateEmbedding(lastUserMessage);
        const relevantChunks = findMostSimilar(queryEmbedding, 5); // Reduced to 5 for speed

        if (relevantChunks.length > 0) {
          context = relevantChunks.map(chunk =>
            `[Source: ${chunk.source}, Page: ${chunk.page}]\n${chunk.content}\n---`
          ).join('\n');
        }
      } catch (e) {
        console.error("Retrieval failed:", e);
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

    // 3. Generate Stream
    const result = await streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content
      })),
    });

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error("API Route Error:", error);
    return new Response(JSON.stringify({ error: `Server Error: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

