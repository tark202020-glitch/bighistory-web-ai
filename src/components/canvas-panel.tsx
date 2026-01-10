import { useState, useEffect, useRef } from 'react';
import { X, Save, Edit3, FileText, Trash2, Printer, ChevronsDown, ChevronsUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useReactToPrint } from 'react-to-print';
import { CitationDisplay } from '@/components/citation-display';

interface CanvasPanelProps {
    isOpen: boolean;
    title: string;
    content: string;
    citations?: any[];
    references?: any[];
    onClose: () => void;
    onDelete?: () => void;
    onSave?: () => void;
}

export function CanvasPanel({ isOpen, title, content, citations, references, onClose, onDelete, onSave }: CanvasPanelProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentContent, setCurrentContent] = useState(content);
    const [isSaving, setIsSaving] = useState(false);
    const [isAllOpen, setIsAllOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const toggleAllAnswers = () => {
        if (!printRef.current) return;

        const detailsElements = printRef.current.querySelectorAll('details');
        const newState = !isAllOpen;

        detailsElements.forEach((el) => {
            if (newState) {
                el.setAttribute('open', '');
            } else {
                el.removeAttribute('open');
            }
        });

        setIsAllOpen(newState);
    };

    useEffect(() => {
        setCurrentContent(content);
    }, [content]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: title || 'Lecture Note',
    });

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
            if (onSave) onSave();
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
                    <h2 className="text-sm font-bold text-slate-700">{title || "Untitled Document"}</h2>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleAllAnswers}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title={isAllOpen ? "전체 답변 닫기" : "전체 답변 열기"}
                    >
                        {isAllOpen ? <ChevronsUp className="w-4 h-4" /> : <ChevronsDown className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-2 rounded-lg transition-colors ${isEditing ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
                        title="Edit Mode"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handlePrint && handlePrint()}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Export PDF"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Save to Library"
                    >
                        {isSaving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
                    </button>
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Note"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white/50">
                <div ref={printRef} className="max-w-4xl mx-auto bg-white p-12 rounded-xl shadow-sm border border-slate-100 min-h-full flex flex-col print:shadow-none print:border-none print:p-0">
                    {isEditing ? (
                        <textarea
                            className="w-full h-full min-h-[500px] resize-none focus:outline-none text-slate-700 font-mono text-sm leading-relaxed"
                            value={currentContent}
                            onChange={(e) => setCurrentContent(e.target.value)}
                        />
                    ) : (
                        <>
                            {/* Document Title (Explicit H1) */}
                            <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 mb-8 leading-tight border-b pb-6 border-slate-100">
                                {title}
                            </h1>

                            <div className="prose prose-slate max-w-none 
                                prose-headings:font-heading prose-headings:font-bold prose-headings:tracking-tight 
                                prose-p:leading-loose prose-p:text-slate-800 prose-p:my-4
                                prose-li:my-2 prose-li:leading-7
                                prose-strong:text-slate-900 prose-strong:font-bold
                                prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                                prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                                font-serif print-style">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
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
