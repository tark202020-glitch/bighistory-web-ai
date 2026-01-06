import { createVertex } from '@ai-sdk/google-vertex';
import { streamText } from 'ai';
import { searchStore, answerQuery } from '@/lib/vertex-search';
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
          // Collect available images based on retrieved documents
          const availableImages: string[] = [];

          context = searchResults.map((result, index) => {
            // Attempt to extract page number from metadata or snippet if available
            // Note: This relies on how Vertex AI indexes the data. 
            // For now, we search for images that might match this document.
            // Assuming result.title or result.link contains the book ID (e.g., '15-Main')

            // Logic: If we find a page mapping, we add image URLs.
            // Since we don't have precise page metadata from the snippet here, 
            // we will provide a GENERIC instruction to the model to use images if it knows the page.
            // BUT, to make this work, we'll try to find matching images in the 'extracted_images' bucket 
            // that match keywords or book IDs. (Simplification for MVP)

            return `[Result ${index + 1}]
Title: ${result.title}
Content: ${result.snippet}
Link: ${result.link || 'N/A'}
---`;
          }).join('\n');

          // [IMAGE INJECTION LOGIC]
          // Since we can't easily map snippets to exact pages without page metadata in the search result,
          // We will inject a list of "Representative Images" for the book if possible, 
          // or instruct the model to use placeholders if it identifies a page number.

          // For this MVP, let's inject a static instruction about where images live.
          context += `\n\n[Available Media Library]\nBase URL: https://storage.googleapis.com/20set-bighistory-raw/extracted_images/\nNaming Convention: {BookID}_p{PageNum}_{Index}.jpeg (e.g., 15-Main_p123_01.jpeg)\nIf you identify a specific page number in the content, you may construct and reference the image URL.`;

          console.log(`Found ${searchResults.length} results from Vertex AI`);
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
      preamble = COURSE_GENERATION_PROMPT;
    } else {
      const configPath = path.join(process.cwd(), 'config', 'ai-character.md');
      try {
        if (fs.existsSync(configPath)) {
          preamble = fs.readFileSync(configPath, 'utf-8');
        }
      } catch (e) { /* ignore */ }
    }

    // 3. Generate Answer using Managed RAG
    console.log("Starting Managed Answer API...");
    try {
      const { answerText, citations, references } = await answerQuery(lastUserMessage, preamble || undefined);

      console.log("Answer generated successfully.");

      // Return as JSON for now (most robust)
      return Response.json({
        role: 'assistant',
        content: answerText,
        citations: citations,
        references: references
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

