import { useState, useEffect } from 'react';
import { ChevronUp, ImageIcon } from 'lucide-react';
import { getBookTitle } from '@/lib/book-titles';

interface CitationDisplayProps {
    citations: any[];
    references?: any[];
}

export function CitationDisplay({ citations, references }: CitationDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [citationImages, setCitationImages] = useState<{ [key: number]: string[] }>({});

    if (!citations || citations.length === 0) return null;

    const displayCitations = citations.map((cite, idx) => {
        const refIndex = parseInt(cite.sources?.[0]?.referenceId || '0', 10);
        const reference = references?.[refIndex];

        let sourceTitle = reference?.chunkInfo?.documentMetadata?.title ||
            reference?.chunkInfo?.documentMetadata?.uri ||
            cite.sources?.[0]?.title;

        if (sourceTitle && (sourceTitle.includes('projects/') || sourceTitle.includes('gs://'))) {
            const parts = sourceTitle.split('/');
            sourceTitle = parts[parts.length - 1];
        }

        if (!sourceTitle && cite.sources?.[0]?.uri) sourceTitle = cite.sources[0].uri;
        sourceTitle = sourceTitle || `Source ${idx + 1}`;
        const cleanTitle = sourceTitle.split('/').pop()?.replace('.pdf', '') || sourceTitle;

        if (!cleanTitle.toLowerCase().includes('main') && !cleanTitle.toLowerCase().includes('all')) return null;

        // Extract Book ID (e.g., "15" from "15_Main" or "15")
        const bookIdMatch = cleanTitle.match(/^(\d+)/);
        const bookId = bookIdMatch ? bookIdMatch[1] : null;

        return {
            idx,
            bookTitle: getBookTitle(cleanTitle),
            snippet: reference?.chunkInfo?.content?.slice(0, 150) + '...',
            page: reference?.chunkInfo?.pageSpan?.start || reference?.chunkInfo?.documentMetadata?.page,
            bookId: bookId
        };
    }).filter((c): c is NonNullable<typeof c> => c !== null);

    if (displayCitations.length === 0) return null;

    const visibleCitations = isExpanded ? displayCitations : displayCitations.slice(0, 3);
    const remainingCount = displayCitations.length - 3;

    return (
        <div className="mt-8 pt-6 border-t border-slate-100 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verification Sources</p>
                {displayCitations.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                        +{displayCitations.length}
                    </span>
                )}
            </div>
            <div className="flex flex-col gap-3 mb-2">

                {visibleCitations.map((cite: any) => (
                    <div key={cite.idx} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-2 hover:border-blue-200 transition-all overflow-hidden group">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                            [{cite.bookTitle}]
                            {cite.page && <span className="text-slate-400 font-normal ml-1">p.{cite.page}</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 pl-3.5 border-l-2 border-slate-100 leading-relaxed break-keep">
                            {cite.snippet}
                        </p>
                    </div>
                ))}

                {displayCitations.length > 3 && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 mt-2 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors bg-white border border-slate-100 shadow-sm w-fit"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3" />
                                <span className="text-xs">Show less</span>
                            </>
                        ) : (
                            <>
                                <span className="text-lg leading-3 mb-1">...</span>
                                <span className="text-xs">View {remainingCount} more</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
