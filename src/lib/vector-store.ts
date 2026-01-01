import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const VECTOR_FILE = path.join(DATA_DIR, 'vectors.json');

export interface Chunk {
    id: string;
    source: string; // Filename
    page: number;   // Page number
    content: string;
    embedding?: number[];
}

// In-memory store
let vectorStore: Chunk[] = [];

// Calculate Cosine Similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Save store to disk
export async function saveVectorStore(chunks: Chunk[]) {
    // We save chunks with embeddings to disk so we don't re-compute them (costly)
    await fs.writeFile(VECTOR_FILE, JSON.stringify(chunks, null, 2));
    vectorStore = chunks;
    console.log(`Saved ${chunks.length} vectors to disk.`);
}

// Load store from disk
// Load store from disk
export async function loadVectorStore(): Promise<Chunk[]> {
    try {
        const data = await fs.readFile(VECTOR_FILE, 'utf-8');
        vectorStore = JSON.parse(data);
        console.log(`Loaded ${vectorStore.length} vectors from disk.`);
        return vectorStore;
    } catch (error) {
        console.log('No existing vector store found (starting fresh).');
        return [];
    }
}

// Search
export function findMostSimilar(queryVector: number[], topK: number = 5): Chunk[] {
    if (vectorStore.length === 0) return [];

    const scored = vectorStore.map(chunk => ({
        ...chunk,
        score: chunk.embedding ? cosineSimilarity(queryVector, chunk.embedding) : -1
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
}

export function getVectorStoreSize(): number {
    return vectorStore.length;
}

export function addChunks(chunks: Chunk[]) {
    vectorStore.push(...chunks);
}

export function clearVectorStore() {
    vectorStore = [];
}
