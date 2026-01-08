import { createVertex } from '@ai-sdk/google-vertex';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { searchStore, answerQuery } from '@/lib/vertex-search';
import { getMatchingImages } from '@/lib/gcs-info';
import fs from 'fs';
import path from 'path';

// Imports
import { COURSE_GENERATION_PROMPT } from '@/lib/prompts';

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
    const { messages, mode } = await req.json();

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
          console.log(`Found ${searchResults.length} results from Vertex AI`);

          // Build context with Async Image Fetching
          const contextPromises = searchResults.map(async (result, index) => {
            let imageContext = "";

            // Extract Book ID (e.g. "15" from "15_Main.pdf" or "gs://.../15-Main.pdf")
            let bookId: string | null = null;
            const sourceName = result.sourceUri || result.title || "";
            const match = sourceName.split('/').pop()?.match(/^(\d+)/);
            if (match) bookId = match[1];

            // If we have Book ID and Page, fetch images
            if (bookId && result.page) {
              const images = await getMatchingImages(bookId, result.page);
              if (images.length > 0) {
                imageContext = `\n[Available Image for Page ${result.page}]: ${images[0]} (Use this image if relevant)`;
              }
            }

            return `[Result ${index + 1}]
Title: ${result.title}
Page: ${result.page || 'Unknown'}
Content: ${result.snippet}${imageContext}
Link: ${result.link || 'N/A'}
---`;
          });

          const contextArray = await Promise.all(contextPromises);
          context = contextArray.join('\n');

          // Add global instruction for images
          context += `\n\n[Display Instructions]\nIf you see an "[Available Image...]" URL in the context proving a relevant visual, YOU MUST insert it into your response using markdown: \n![Figure Description](URL)\nPlace it near the relevant text.`;
        } else {
          console.log("No results found in Vertex AI");
        }
      } catch (e) {
        console.error("Vertex AI Retrieval failed:", e);
      }
    }


    // 2. Determine Preamble (Prompt)
    let preamble = "";
    if (mode === 'lecture') {
      console.log("Using Course-prompt for Curriculum Generation");
      preamble = COURSE_GENERATION_PROMPT + (context ? `\n\n[Reference Material with Images]\n${context}` : "");
    } else {
      const configPath = path.join(process.cwd(), 'config', 'ai-character.md');
      try {
        if (fs.existsSync(configPath)) {
          preamble = fs.readFileSync(configPath, 'utf-8');
        }
      } catch (e) { /* ignore */ }

      // Also inject context into standard chat prompt if available (optional, but good for consistency)
      // Actually, for standard chat, 'answerQuery' might handle retrieval internally? 
      // Wait, 'answerQuery' uses its own retrieval if using Managed RAG.
      // But here we are manually retrieving to get images context.
      // If we pass 'context' string into 'answerQuery', it might ignore it unless it's in the preamble.

      // Let's modify the preamble to include our manually retrieved context WITH IMAGES.
      if (context) {
        preamble += `\n\n[Retrieved Context with Images]\n${context}`;
      }
    }

    // 3. Generate Answer using Managed RAG
    console.log("Starting Managed Answer API...");
    try {
      // NOTE: We are doing double retrieval here potentially (once by us, once by answerQuery). 
      // But answerQuery's automated retrieval doesn't give us image URLs.
      // So ensuring our manual context is in the preamble is vital.

      const result = await answerQuery(lastUserMessage, preamble || undefined);

      console.log("Answer generated successfully.");

      // Return as JSON for now (most robust)
      return NextResponse.json({
        answer: result.answerText,
        citations: result.citations,
        references: result.references,
        estimatedCost: result.estimatedCost
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
