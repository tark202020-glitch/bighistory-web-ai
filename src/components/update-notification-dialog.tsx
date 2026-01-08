'use client';

import { useEffect, useState } from 'react';
import { X, Bell, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface UpdateData {
    version: string;
    date: string;
    content: string;
}

export function UpdateNotificationDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<UpdateData | null>(null);
    const [hideToday, setHideToday] = useState(false);

    useEffect(() => {
        const fetchUpdate = async () => {
            try {
                const res = await fetch('/api/latest-update');
                if (!res.ok) return;

                const updateData: UpdateData = await res.json();

                // Consistency Check: Check if we haven't shown this SPECIFIC date/version today
                // Key format: 'hide_update_modal_YYYY-MM-DD'
                const today = new Date().toISOString().split('T')[0];
                const storageKey = `hide_update_modal_${today}`;

                // If the user hid it today, don't show
                if (localStorage.getItem(storageKey) === 'true') {
                    return;
                }

                setData(updateData);
                setIsOpen(true);
            } catch (error) {
                console.error("Failed to fetch updates", error);
            }
        };

        fetchUpdate();
    }, []);

    const handleClose = () => {
        if (hideToday) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`hide_update_modal_${today}`, 'true');
        }
        setIsOpen(false);
    };

    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 ring-1 ring-black/5 animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <Bell size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800 tracking-tight">최근 업데이트 (Last 3 Days)</h2>
                            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{data.version}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <Calendar size={10} /> {data.date} ~
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body (Markdown Content) */}
                <div className="px-6 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="prose prose-sm prose-slate max-w-none">
                        {/* Render Markdown content simply */}
                        <div className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-600">
                            {/* We replace basic markdown headers for simpler display if needed, or just display raw text nicely formatted */}
                            {data.content.split('\n').map((line, i) => {
                                // Simple Rendering Logic tailored for Changelog format
                                if (line.startsWith('### ')) {
                                    return <h3 key={i} className="text-slate-900 font-bold mt-4 mb-2 flex items-center gap-2"><div className="w-1 h-4 bg-blue-500 rounded-full"></div>{line.replace('### ', '')}</h3>
                                }
                                if (line.trim().startsWith('- ')) {
                                    return (
                                        <div key={i} className="flex gap-2.5 mb-2 pl-1 group">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0 group-hover:bg-blue-500 transition-colors"></div>
                                            <span>
                                                {line.replace('- ', '').split('**').map((part, idx) =>
                                                    idx % 2 === 1 ? <strong key={idx} className="text-slate-800 font-semibold">{part}</strong> : part
                                                )}
                                            </span>
                                        </div>
                                    )
                                }
                                if (line.trim() === '') return <br key={i} />;
                                return <p key={i}>{line}</p>;
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900 transition-colors">
                        <input
                            type="checkbox"
                            checked={hideToday}
                            onChange={(e) => setHideToday(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                        />
                        오늘 하루 그만 보기
                    </label>
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-95"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}
