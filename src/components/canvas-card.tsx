import { FileText } from 'lucide-react';

interface CanvasCardProps {
    title: string;
    onOpen: () => void;
}

export function CanvasCard({ title, onOpen }: CanvasCardProps) {
    return (
        <div className="w-full max-w-sm mt-2 mb-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                <div className="p-4 flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 mb-1 leading-tight">
                            {title || "Teaching Materials Generated"}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                            Curriculum content is ready. Click open to view adjacent to the chat.
                        </p>
                    </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 flex justify-end border-t border-slate-100">
                    <button
                        onClick={onOpen}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-blue-200"
                    >
                        Open Canvas
                    </button>
                </div>
            </div>
        </div>
    );
}
