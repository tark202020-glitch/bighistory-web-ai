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
  const messages = await req.json().then(body => body.messages);

  if (!isRagInitialized) {
    // This will load from disk or parse/embed if first time
    await initializeRAG();
    isRagInitialized = true;
  }

  // Get the last user message to use as a search query
  const lastUserMessage = messages.slice().reverse().find((m: { role: string; content: string }) => m.role === 'user')?.content || "";

  console.log(`Processing Query: "${lastUserMessage.substring(0, 50)}..."`);

  // 1. Convert Query to Embedding
  let context = "";
  try {
    if (lastUserMessage) {
      const queryEmbedding = await generateEmbedding(lastUserMessage);

      // 2. Retrieve Top 5-10 Relevant Chunks
      const relevantChunks = findMostSimilar(queryEmbedding, 7); // Top 7 pages

      console.log(`Found ${relevantChunks.length} relevant pages.`);

      // 3. Construct Context with Citations
      context = relevantChunks.map(chunk =>
        `[Source: ${chunk.source}, Page: ${chunk.page}]\n${chunk.content}\n---`
      ).join('\n');
    }
  } catch (e) {
    console.error("Retrieval failed:", e);
    context = "Error retrieving context. Please answer based on general knowledge.";
  }

  // Read system prompt from file
  const configPath = path.join(process.cwd(), 'config', 'ai-character.md');
  let baseSystemPrompt = "";
  try {
    baseSystemPrompt = fs.readFileSync(configPath, 'utf-8');
  } catch (error) {
    console.error("Failed to read ai-character.md:", error);
    // Fallback if file read fails (optional)
    baseSystemPrompt = "You are a helpful assistant.";
  }

  const systemPrompt = `
    ${baseSystemPrompt}

    Retrieved Context:
    ${context}
  `;

  const result = await streamText({
    // Using 'gemini-2.0-flash-001'
    model: google('gemini-2.0-flash-001'),
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content
    })),
  });

  // Reverting to text stream for stability (toDataStreamResponse caused build error)
  return result.toTextStreamResponse();
}
