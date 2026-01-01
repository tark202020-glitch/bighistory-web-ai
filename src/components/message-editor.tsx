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
        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-2 mb-4">
                {lines.map((line, index) => (
                    <div key={index} className="group flex items-start gap-2 relative">
                        {/* Line Number / Grip Handle (Optional visual) */}
                        <div className="mt-2 text-gray-300 group-hover:text-gray-400 cursor-grab active:cursor-grabbing">
                            <GripVertical size={14} />
                        </div>

                        {/* Text Area */}
                        <textarea
                            ref={el => { textareaRefs.current[index] = el }}
                            value={line}
                            onChange={(e) => {
                                handleLineChange(index, e.target.value);
                                // Auto-resize immediately on change
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            className="flex-1 min-h-[38px] p-2 bg-gray-50 border border-transparent hover:border-gray-200 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-md resize-none overflow-hidden text-sm transition-all outline-none"
                            rows={1}
                            placeholder="내용을 입력하세요..."
                            autoFocus={index === lines.length - 1 && line === ''}
                        />

                        {/* Actions (Visible on hover or focus) */}
                        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                            <button
                                onClick={() => handleAddLine(index)}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                title="아랫줄 추가"
                            >
                                <Plus size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteLine(index)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="줄 삭제"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                    onClick={onCancel}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <X size={14} />
                    취소
                </button>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all hover:shadow-md"
                >
                    <Check size={14} />
                    수정 완료
                </button>
            </div>
        </div>
    );
}
