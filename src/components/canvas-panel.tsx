import { useState, useEffect } from 'react';
import { X, Save, Share2, Edit3, FileText, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CitationDisplay } from '@/components/citation-display';

interface CanvasPanelProps {
    isOpen: boolean;
    title: string;
    content: string;
    citations?: any[];
    references?: any[];
    onClose: () => void;
}

export function CanvasPanel({ isOpen, title, content, citations, references, onClose }: CanvasPanelProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentContent, setCurrentContent] = useState(content);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setCurrentContent(content);
    }, [content]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/saved-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: currentContent })
            });

            if (!res.ok) throw new Error('Failed to save');
            alert('저장되었습니다.');
        } catch (error) {
            console.error(error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="flex-1 h-full bg-slate-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{title || "Untitled Document"}</h2>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-2 rounded-lg transition-colors ${isEditing ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
                        title="Edit Mode"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Save to Library"
                    >
                        {isSaving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
                    </button>
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <Share2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content (Markdown Editor/Viewer) */}
            <div className="flex-1 overflow-y-auto p-8 bg-white/50">
                <div className="max-w-3xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-slate-100 min-h-full flex flex-col">
                    {isEditing ? (
                        <textarea
                            className="w-full h-full min-h-[500px] resize-none focus:outline-none text-slate-700 font-mono text-sm leading-relaxed"
                            value={currentContent}
                            onChange={(e) => setCurrentContent(e.target.value)}
                        />
                    ) : (
                        <>
                            <div className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:font-bold prose-p:leading-relaxed prose-strong:text-blue-600 prose-strong:bg-blue-50 prose-strong:px-1 prose-strong:rounded">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {currentContent}
                                </ReactMarkdown>
                            </div>

                            {/* Citations at bottom of canvas */}
                            {(citations && citations.length > 0) && (
                                <div className="mt-12 pt-8 border-t border-slate-100">
                                    <CitationDisplay citations={citations} references={references} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
