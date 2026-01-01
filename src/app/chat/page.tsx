import { ChatInterface } from '@/components/chat-interface';
import { getDocuments } from '@/lib/pdf-loader';

export default async function ChatPage() {
    const documents = await getDocuments();

    // Convert raw documents to the format expected by UI
    // Note: getDocuments now returns [] in the new RAG implementation, 
    // but we might want to populate the sidebar with the list of generic "Modules" or "Books"
    // For now, let's list the 20 PDFs hardcoded or fetched if possible, 
    // currently the Sidebar uses `sources` prop.
    // Since `pdf-loader`'s `getDocuments` is deprecated/empty, let's mock it or fix it later.
    // For MVP parity, we'll pass an empty list or static list for now to avoid crashes.

    // Actually, we can just list the filenames if we want, but `getDocuments` returns empty array.
    // Let's create a static list of 20 books for display if needed, or just pass empty.

    const sources = documents.map((doc: { id: string, title: string }) => ({
        id: doc.id,
        title: doc.title || doc.id
    }));

    return <ChatInterface sources={sources} />;
}
