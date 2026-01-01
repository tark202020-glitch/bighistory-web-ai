import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embed, embedMany } from 'ai';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'AIzaSyDUDPdKF93YK6Q3nM8WNqV8ubvVDI1A7H4',
});

// Use the optimal embedding model
const embeddingModel = google.textEmbeddingModel('text-embedding-004');

export async function generateEmbedding(text: string): Promise<number[]> {
    const { embedding } = await embed({
        model: embeddingModel,
        value: text,
    });
    return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const { embeddings } = await embedMany({
        model: embeddingModel,
        values: texts,
    });
    return embeddings;
}
