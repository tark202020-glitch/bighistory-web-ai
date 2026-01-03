'use client';

import { useRef, useEffect, useState } from 'react';
import { Send, Bot, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageEditor } from '@/components/message-editor';
import { getBookTitle } from '@/lib/book-titles';
import { CanvasPanel } from '@/components/canvas-panel';
import { CanvasCard } from '@/components/canvas-card';
import { CitationDisplay } from '@/components/citation-display';

interface Document {
    id: string;
    title: string;
}

interface SavedItem {
    id?: string;
    content: string;
    created_at?: string;
}

interface Citation {
    sources?: { referenceId?: string; title?: string; uri?: string }[];
    [key: string]: unknown;
}

interface Message {
    id: string;
    role: string;
    content: string;
    citations?: Citation[];
    references?: any[];
    type?: 'text' | 'curriculum';
}

export const ChatInterface = ({ sources: _sources }: { sources: Document[] }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [canvasState, setCanvasState] = useState<{ isOpen: boolean; content: string; title: string; citations?: any[]; references?: any[] }>({ isOpen: false, content: '', title: '' });
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [subjectTarget] = useState('초등 고학년 / 흥미 유발');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchSavedItems();
    }, []);

    const fetchSavedItems = async () => {
        try {
            const res = await fetch('/api/saved-items');
            if (res.ok) {
                const { data } = await res.json() as { data: SavedItem[] };
                setSavedItems(data || []);
            }
        } catch (error) {
            console.error("Failed to fetch saved items", error);
        }
    };

    const [mode, setMode] = useState<'qa' | 'lecture'>('qa');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

    const handleSaveMessage = async (content: string) => {
        try {
            const res = await fetch('/api/saved-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (!res.ok) {
                const errorData = await res.json();
                alert(errorData.error || 'Failed to save');
                return;
            }

            fetchSavedItems();
            alert('저장되었습니다.');
        } catch (error) {
            console.error(error);
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    const startEditing = (id: string) => {
        setEditingMessageId(id);
    };

    const saveEdit = (id: string, newContent: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, content: newContent } : m));
        setEditingMessageId(null);
    };

    const handleDataSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        let finalInput = inputValue;
        if (mode === 'lecture') {
            finalInput = `[강의자료 생성 요청] ${inputValue}`;
        }

        const userMessage = { id: Date.now().toString(), role: 'user', content: finalInput };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
                    mode: mode
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server Error');
            }

            const data = await response.json();

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.content,
                citations: data.annotations?.find((a: any) => a.type === 'citations')?.data || data.citations,
                references: data.references || [],
                type: mode === 'lecture' ? 'curriculum' : 'text'
            }]);

        } catch (error: unknown) {
            console.error('Chat error:', error);
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `🚨 오류 발생: ${errorMessage}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] text-slate-900 overflow-hidden selection:bg-blue-100 font-sans">
            {/* Sidebar - Antigravity Style */}
            <aside className="w-72 bg-[#0f172a] text-white flex flex-col hidden md:flex shadow-2xl relative z-10 transition-all">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-2 translate-y-0 hover:-translate-y-0.5 transition-transform cursor-pointer">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Bot size={20} className="text-white" />
                        </div>
                        <h1 className="text-xl font-bold font-heading tracking-tight">BigHistory AI</h1>
                    </div>
                    <div className="h-px w-full bg-gradient-to-r from-slate-700 to-transparent mb-6 opacity-50" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-none mb-1">Architecture</p>
                    <p className="text-[11px] text-slate-500 font-medium">Vertex Managed RAG • Gemini 1.5</p>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 custom-scrollbar">
                    {/* Project Detail */}
                    <div>
                        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Current Session</h2>
                        <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 hover:bg-slate-800/50 transition-all cursor-default group">
                            <p className="text-[10px] font-bold text-slate-500 group-hover:text-blue-400 transition-colors uppercase mb-1">Target Audience</p>
                            <p className="text-sm text-slate-200 font-semibold">{subjectTarget}</p>
                        </div>
                    </div>

                    {/* Saved Library */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Library</h2>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">{savedItems.length}</span>
                        </div>
                        <div className="space-y-2.5">
                            {savedItems.length === 0 ? (
                                <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl">
                                    <p className="text-[11px] text-slate-600 font-medium">No saved insights yet</p>
                                </div>
                            ) : (
                                savedItems.map((item, idx) => (
                                    <div key={idx} className="group flex items-start gap-3 p-3.5 rounded-2xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all cursor-pointer">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-blue-500 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all" />
                                        <p className="text-[11px] text-slate-400 group-hover:text-slate-200 leading-relaxed line-clamp-2 transition-colors">{item.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 mt-auto">
                    <div className="p-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Online</p>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">Grounded on BigHistory Private Dataset</p>
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex h-full bg-white relative z-0 overflow-hidden">
                {/* Messages Container */}
                <div className={cn(
                    "flex flex-col h-full bg-white transition-all duration-300 ease-in-out pt-8 pb-32 overflow-y-auto custom-scrollbar",
                    canvasState.isOpen ? "w-[45%] border-r border-slate-200" : "flex-1"
                )}>
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-8 animate-fade-in">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 shadow-sm border border-slate-100 ring-8 ring-slate-50/50">
                                <Bot size={40} className="text-slate-900" />
                            </div>
                            <h2 className="text-3xl font-bold font-heading text-slate-900 mb-3 tracking-tight">빅히스토리 가이드</h2>
                            <p className="text-slate-500 max-w-sm text-sm leading-relaxed font-medium">
                                도서 20권의 핵심 지식을 바탕으로<br />완벽하게 검증된 답변을 제공합니다.
                            </p>
                            <div className="flex flex-wrap gap-2.5 mt-10 justify-center">
                                {["빅히스토리가 뭐야?", "우주의 시작", "지구 탄생과정"].map(hint => (
                                    <button
                                        key={hint}
                                        onClick={() => setInputValue(hint)}
                                        className="px-5 py-2.5 rounded-2xl border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all hover:scale-105 active:scale-95"
                                    >
                                        {hint}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={cn("mx-auto w-full px-6 space-y-12", canvasState.isOpen ? "max-w-full" : "max-w-3xl")}>
                            {messages.map((m, i) => {
                                let messageContent;
                                if (editingMessageId === m.id) {
                                    messageContent = (
                                        <MessageEditor
                                            initialContent={m.content}
                                            onSave={(newContent) => saveEdit(m.id, newContent)}
                                            onCancel={() => setEditingMessageId(null)}
                                        />
                                    );
                                } else if (m.type === 'curriculum') {
                                    const previousMessage = messages[i - 1];
                                    const cardTitle = previousMessage?.role === 'user'
                                        ? previousMessage.content.replace('[강의자료 생성 요청] ', '')
                                        : '맞춤형 커리큘럼';

                                    messageContent = (
                                        <CanvasCard
                                            title={cardTitle}
                                            onOpen={() => setCanvasState({
                                                isOpen: true,
                                                content: m.content,
                                                title: cardTitle,
                                                citations: m.citations,
                                                references: m.references
                                            })}
                                        />
                                    );
                                } else {
                                    messageContent = (
                                        <div className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:font-bold prose-p:leading-relaxed prose-strong:text-blue-600 prose-strong:bg-blue-50 prose-strong:px-1 prose-strong:rounded">
                                            {m.content.split('\n').map((line: string, i: number) => {
                                                if (line.trim() === '') return <div key={i} className="h-2" />;
                                                if (line.startsWith('### ')) {
                                                    return <h3 key={i} className="text-lg text-slate-900 mt-8 mb-3 flex items-center gap-3 first:mt-0">
                                                        <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                                        {line.replace(/^###\s+/, '')}
                                                    </h3>;
                                                }
                                                if (line.startsWith('## ')) {
                                                    return <h2 key={i} className="text-2xl text-slate-900 mt-10 mb-5 pb-2 border-b-2 border-slate-100">
                                                        {line.replace(/^##\s+/, '')}
                                                    </h2>;
                                                }

                                                const boldRegex = /\*\*(.*?)\*\*/g;
                                                const parts = line.split(boldRegex);

                                                return (
                                                    <p key={i} className="mb-4 text-slate-700">
                                                        {parts.map((part, pIdx) =>
                                                            pIdx % 2 === 1 ? <strong key={pIdx} className="text-blue-700 font-bold bg-blue-50 px-1 rounded mx-0.5">{part}</strong> : part
                                                        )}
                                                    </p>
                                                );
                                            })}

                                            {/* Citations Section */}
                                            {m.citations && m.citations.length > 0 && (
                                                <CitationDisplay citations={m.citations} references={m.references} />
                                            )}

                                            {!isLoading && (
                                                <div className="flex gap-4 mt-8 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                    <button onClick={() => startEditing(m.id)} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2 group/btn transition-colors">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover/btn:bg-blue-600 transition-all" /> 수정
                                                    </button>
                                                    <button onClick={() => handleSaveMessage(m.content)} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest flex items-center gap-2 group/btn transition-colors">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover/btn:bg-blue-600 transition-all" /> 라이브러리에 저장
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={m.id}
                                        className={cn(
                                            "flex flex-col animate-fade-in group",
                                            m.role === 'user' ? "items-end" : "items-start"
                                        )}
                                    >
                                        {m.role === 'user' ? (
                                            <div className="px-6 py-3.5 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200/50 text-sm font-semibold tracking-tight">
                                                {m.content}
                                            </div>
                                        ) : (
                                            <div className="w-full">
                                                <div className="flex items-center gap-2.5 mb-5">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                                                        <Bot size={14} className="text-blue-600" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Research Logic</span>
                                                </div>

                                                <div className="text-slate-800 leading-[1.7] text-[15px] space-y-5 font-medium">
                                                    {messageContent}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Floating Navigation & Input Area Container - Width Controlled */}
                <div className={cn(
                    "absolute bottom-0 z-20 transition-all duration-300 pointer-events-none",
                    canvasState.isOpen ? "w-[45%]" : "w-full"
                )}>
                    {/* Floating Navigation */}
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 pointer-events-auto animate-fade-in">
                        <button
                            onClick={() => setMode('qa')}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95",
                                mode === 'qa' ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            Detailed Q&A
                        </button>
                        <button
                            onClick={() => setMode('lecture')}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95",
                                mode === 'lecture' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            Curriculum Generation
                        </button>
                    </div>

                    {/* Input Area */}
                    <div className="px-6 pb-10 bg-transparent pointer-events-auto">
                        <div className={cn("mx-auto transition-all duration-300", canvasState.isOpen ? "max-w-full" : "max-w-3xl")}>
                            <form onSubmit={handleDataSubmit} className="relative group perspective-1000">
                                <input
                                    className="w-full h-16 pl-7 pr-16 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 focus:outline-none focus:ring-0 focus:border-slate-300 transition-all text-[15px] font-medium placeholder:text-slate-300"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={mode === 'lecture' ? "수업 자료로 만들고 싶은 주제를 입력하세요..." : "궁금한 빅히스토리 지식을 물어보세요..."}
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !inputValue.trim()}
                                    className="absolute right-3 top-3 h-10 w-10 bg-slate-900 hover:bg-black disabled:bg-slate-50 disabled:text-slate-200 rounded-xl flex items-center justify-center text-white transition-all shadow-xl active:scale-90"
                                >
                                    <Send size={20} fill="currentColor" />
                                </button>
                            </form>

                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="mt-4 flex items-center justify-center gap-3 animate-fade-in">
                                    <div className="flex gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                                    </div>
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] animate-pulse">Consulting Knowledge Base</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <CanvasPanel
                    isOpen={canvasState.isOpen}
                    title={canvasState.title}
                    content={canvasState.content}
                    citations={canvasState.citations}
                    references={canvasState.references}
                    onClose={() => setCanvasState(prev => ({ ...prev, isOpen: false }))}
                />
            </main>
        </div>
    );
};
