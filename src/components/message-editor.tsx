import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Check, X, GripVertical } from 'lucide-react';

interface MessageEditorProps {
    initialContent: string;
    onSave: (content: string) => void;
    onCancel: () => void;
}

export function MessageEditor({ initialContent, onSave, onCancel }: MessageEditorProps) {
    // Split by newline, but ensure we at least have one empty line if content is empty
    const [lines, setLines] = useState<string[]>(() => {
        const split = initialContent.split('\n');
        return split.length > 0 ? split : [''];
    });

    const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

    // Auto-resize textareas
    useEffect(() => {
        textareaRefs.current.forEach(textarea => {
            if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        });
    }, [lines]);

    const handleLineChange = (index: number, value: string) => {
        const newLines = [...lines];
        newLines[index] = value;
        setLines(newLines);
    };

    const handleAddLine = (index: number) => {
        const newLines = [...lines];
        // Insert empty string after current index
        newLines.splice(index + 1, 0, '');
        setLines(newLines);

        // Focus logic could be added here if needed, but simplistic for now
    };

    const handleDeleteLine = (index: number) => {
        if (lines.length === 1) {
            // Don't delete the last remaining line, just clear it
            setLines(['']);
            return;
        }
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
    };

    const handleSave = () => {
        onSave(lines.join('\n'));
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl shadow-slate-200/50 animate-fade-in ring-1 ring-slate-100/50">
            <div className="space-y-3 mb-6">
                {lines.map((line, index) => (
                    <div key={index} className="group flex items-start gap-4 relative">
                        <div className="mt-2.5 text-slate-300 group-hover:text-slate-400 cursor-grab active:cursor-grabbing transition-colors">
                            <GripVertical size={14} />
                        </div>

                        <textarea
                            ref={el => { textareaRefs.current[index] = el }}
                            value={line}
                            onChange={(e) => {
                                handleLineChange(index, e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            className="flex-1 min-h-[44px] p-3 bg-slate-50/50 border border-slate-100 hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/20 rounded-xl resize-none overflow-hidden text-sm font-medium text-slate-700 transition-all outline-none"
                            rows={1}
                            placeholder="내용을 입력하세요..."
                            autoFocus={index === lines.length - 1 && line === ''}
                        />

                        <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-all focus-within:opacity-100">
                            <button
                                onClick={() => handleAddLine(index)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="아랫줄 추가"
                            >
                                <Plus size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteLine(index)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="줄 삭제"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-50">
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest"
                >
                    <X size={14} />
                    취소
                </button>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-slate-900 hover:bg-black rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-95 uppercase tracking-widest"
                >
                    <Check size={14} />
                    수정 완료
                </button>
            </div>
        </div>
    );
}
