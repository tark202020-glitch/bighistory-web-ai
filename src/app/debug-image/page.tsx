
"use client";

import { useState } from 'react';

export default function DebugImagePage() {
    const [bookId, setBookId] = useState("1"); // Default to Big Bang
    const [page, setPage] = useState("12");
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleTest = () => {
        // Construct the Proxy URL directly
        // The app uses: /api/proxy-image?bookId={id}&page={page}&index=0
        const url = `/api/proxy-image?bookId=${bookId}&page=${page}&index=0`;
        setResultUrl(url);
        setError(null);
    };

    return (
        <div className="p-10 max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Debug Image Proxy (Client Side)</h1>

            <div className="space-y-4 p-4 border rounded bg-slate-50">
                <div className="flex gap-4">
                    <div>
                        <label className="block text-sm font-bold">Book ID</label>
                        <input
                            value={bookId}
                            onChange={e => setBookId(e.target.value)}
                            className="border p-2 rounded w-24"
                        />
                        <span className="text-xs text-gray-400 ml-2">(e.g. 1, 2, 15)</span>
                    </div>
                    <div>
                        <label className="block text-sm font-bold">Page</label>
                        <input
                            value={page}
                            onChange={e => setPage(e.target.value)}
                            className="border p-2 rounded w-24"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleTest}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Test Image
                        </button>
                    </div>
                </div>
            </div>

            {resultUrl && (
                <div className="space-y-4">
                    <div className="bg-slate-100 p-4 rounded text-xs break-all">
                        <strong>Proxy URL:</strong> {resultUrl}
                    </div>

                    <div className="border border-gray-300 p-4 rounded min-h-[300px] flex items-center justify-center bg-gray-50">
                        <img
                            src={resultUrl}
                            alt="Debug Target"
                            className="max-w-full max-h-[500px] shadow-lg"
                            onError={(e) => {
                                setError("Failed to load image (404/500/403)");
                            }}
                            onLoad={() => {
                                setError(null);
                            }}
                        />
                    </div>
                    {error && (
                        <div className="text-red-600 font-bold bg-red-50 p-4 rounded">
                            ❌ {error}
                        </div>
                    )}
                    {!error && (
                        <div className="text-green-600 font-bold bg-green-50 p-4 rounded">
                            ✅ Image loaded successfully!
                        </div>
                    )}
                </div>
            )}

            <div className="text-sm text-gray-500">
                <h3>Common Pages to Test:</h3>
                <ul className="list-disc pl-5">
                    <li>Book 1 Page 12 (Big Bang)</li>
                    <li>Book 2 Page 100 (Star Formation)</li>
                    <li>Book 15 Page 23 (Silk Road)</li>
                </ul>
            </div>
        </div>
    );
}
