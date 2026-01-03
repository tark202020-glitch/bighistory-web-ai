import { X, Save, Share2, Edit3, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CanvasPanelProps {
    isOpen: boolean;
    title: string;
    content: string;
    onClose: () => void;
}

export function CanvasPanel({ isOpen, title, content, onClose }: CanvasPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="flex-1 h-full bg-slate-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{title || "Untitled Document"}</h2>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <Save className="w-4 h-4" />
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
                <div className="max-w-3xl mx-auto prose prose-slate prose-sm bg-white p-10 rounded-xl shadow-sm border border-slate-100 min-h-full">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
