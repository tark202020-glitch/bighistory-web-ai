import { promises as fs } from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import PDFParser from 'pdf2json';

import { generateEmbedding } from './embeddings';
import { Chunk, saveVectorStore, loadVectorStore, addChunks, clearVectorStore } from './vector-store';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function initializeRAG(): Promise<boolean> {
    // 2. If vectors exist, load them first to append/resume
    const existingChunks: Chunk[] = await loadVectorStore();

    // Get list of already processed files
    const processedFiles = new Set(existingChunks.map(c => c.source));
    console.log(`Resuming RAG... Found ${existingChunks.length} chunks from ${processedFiles.size} files.`);

    console.log('Initializing RAG System: Parsing and Embedding PDFs...');

    try {
        const files = await fs.readdir(DATA_DIR);
        const pdfFiles = files.filter((file: string) => file.toLowerCase().endsWith('.pdf'));

        const newChunks: Chunk[] = [];

        for (const file of pdfFiles) {
            // SKIP if already processed
            if (processedFiles.has(file)) {
                console.log(`Skipping ${file} (Already processed)`);
                continue;
            }

            console.log(`Processing ${file}...`);
            const filePath = path.join(DATA_DIR, file);

            try {
                const pdfParser = new PDFParser();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const pdfData = await new Promise<any>((resolve, reject) => {
                    // Set timeout for PDF parsing to avoid hangs (30s)
                    const timeout = setTimeout(() => reject(new Error("PDF Parsing Timeout")), 30000);

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    pdfParser.on("pdfParser_dataError", (errData: any) => {
                        clearTimeout(timeout);
                        reject(errData.parserError);
                    });
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                        clearTimeout(timeout);
                        resolve(pdfData);
                    });
                    pdfParser.loadPDF(filePath);
                });

                // Extract text per page
                const pages = pdfData.Pages || (pdfData.formImage ? pdfData.formImage.Pages : []);
                const fileChunks: Chunk[] = [];

                if (pages) {
                    for (let i = 0; i < pages.length; i++) {
                        const page = pages[i];
                        let pageText = "";

                        // Parse page text
                        if (page.Texts) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            pageText = page.Texts.map((t: any) => {
                                if (t.R && t.R.length > 0) {
                                    try {
                                        return decodeURIComponent(t.R[0].T);
                                    } catch (e) {
                                        return t.R[0].T;
                                    }
                                }
                                return "";
                            }).join(" ");
                        }

                        // Clean text
                        pageText = pageText.replace(/\s+/g, ' ').trim();

                        if (pageText.length > 50) {
                            const chunkId = `${file}_p${i + 1}`;

                            try {
                                // Add small delay to prevent rate limits
                                await new Promise(r => setTimeout(r, 200));

                                const embedding = await generateEmbedding(pageText);

                                fileChunks.push({
                                    id: chunkId,
                                    source: file,
                                    page: i + 1,
                                    content: pageText,
                                    embedding: embedding
                                });

                            } catch (e) {
                                console.error(`Failed to embed ${chunkId}`, e);
                            }
                        }
                    }
                    console.log(`Parsed ${file}: ${fileChunks.length} pages processed.`);

                    // INCREMENTAL SAVE: Save after each file to prevent data loss
                    if (fileChunks.length > 0) {
                        await addChunks(fileChunks); // Add to in-memory store
                        // Append to explicit list for final log, though addChunks handles persistence? 
                        // Wait, addChunks updates 'chunks' var but verify if saveVectorStore saves ALL or just passed arg?
                        // saveVectorStore implementation: fs.writeFile(VECTOR_DB, JSON.stringify(chunks)); 
                        // So we should call saveVectorStore with updated full list or rely on addChunks logic?
                        // Let's check vector-store.ts implementation.
                        // Assuming addChunks updates the global state, we pass FULL state to save?
                        // Actually let's just use the exported saveVectorStore logic.
                        // Ideally we simply call saveVectorStore with the updated global chunks?
                        // For safety, let's look at vector-store.ts first.
                        // Strategy: accumulate into temporary array, then append to disk.
                        // Actually, simpler: read, append, write.
                        // Let's assume addChunks takes care of memory, we need to persist.
                        // Let's just pass `fileChunks` to addChunks, and then save the WHOLE store.
                        // Re-reading file is safer.

                        // Let's modify logic to just use addChunks + saveVectorStore(allCurrentChunks)
                        // But I need access to allCurrentChunks.
                        // Let's just trust saveVectorStore saves the in-memory 'chunks' variable if passed no args? 
                        // No, the signature is saveVectorStore(chunks: Chunk[]).
                        // I will update this block after checking vector-store.ts. 
                        // For now, I'll blindly push to newChunks and save everything at end? No, that's the problem.

                        // Correct logic:
                        newChunks.push(...fileChunks);
                        // Save EVERYTHING so far (existing + new)
                        await saveVectorStore([...existingChunks, ...newChunks]);
                        console.log(`Saved progress after ${file}`);
                    }
                }
            } catch (error) {
                console.error(`Error parsing ${file}:`, error);
                // Continue to next file despite error
            }
        }

        console.log('RAG System update complete.');
        return true;

    } catch (error) {
        console.error('Error initializing RAG:', error);
        return false;
    }
}

// Helper to get raw documents list for UI
// Import static sources for Vercel deployment where raw PDFs are excluded
import sources from './sources.json';

export async function getDocuments() {
    // Return pre-defined list since PDFs are not uploaded to Vercel (too large)
    return sources.map(s => ({
        id: s.id,
        title: s.title,
        content: "" // Content not needed for listing
    }));
}
