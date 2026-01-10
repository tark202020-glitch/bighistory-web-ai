import { getMatchingImages } from '@/lib/gcs-info';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const dynamic = 'force-dynamic';

export default async function DebugImagePage() {
    const bookId = '15';
    const page = 23;
    let images: string[] = [];
    let log = '';

    try {
        images = await getMatchingImages(bookId, page);
        log += `Found ${images.length} images.\n`;
    } catch (e: any) {
        log += `Error: ${e.message}\n`;
    }

    const markdown = images.length > 0
        ? `![Test Image](${images[0]})`
        : 'No image found.';

    return (
        <div className="p-10 max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Debug GCS Image Rendering</h1>

            <div className="bg-slate-100 p-4 rounded">
                <h2 className="font-bold">Backend Log</h2>
                <pre>{log}</pre>
                <div className="mt-2">
                    <strong>Generated URL:</strong>
                    <div className="break-all text-xs font-mono">{images[0] || 'None'}</div>
                </div>
            </div>

            <div className="bg-white border p-6 rounded shadow">
                <h2 className="font-bold mb-4">1. Direct Img Tag</h2>
                {images[0] && (
                    <img src={images[0]} alt="Direct Test" className="max-w-full border border-red-500" />
                )}
            </div>

            <div className="bg-white border p-6 rounded shadow">
                <h2 className="font-bold mb-4">2. ReactMarkdown Rendering</h2>
                <div className="prose border border-blue-500 p-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {markdown}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
