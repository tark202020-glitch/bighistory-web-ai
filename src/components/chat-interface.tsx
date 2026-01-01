'use client';

// import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageEditor } from '@/components/message-editor';

interface Document {
    id: string;
    title: string;
}

interface SavedItem {
    id?: string;
    content: string;
    created_at?: string;
}

export const ChatInterface = ({ sources }: { sources: Document[] }) => {
    // Custom implementation replacing useChat to guarantee Text Stream compatibility
    const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([]);
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

    // State for system status
    const [systemStatus, setSystemStatus] = useState<string>('');
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

            // Refresh list
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
                    messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!response.ok) throw new Error(response.statusText);
            if (!response.body) throw new Error('No response body');

            // Add placeholder for assistant message
            const assistantMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

            // Read the stream manually
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                accumulatedContent += text;

                // Check for system status messages (custom protocol)
                if (accumulatedContent.startsWith('[SYSTEM]')) {
                    const statusMsg = accumulatedContent.replace('[SYSTEM]', '').trim();
                    setSystemStatus(statusMsg);
                    // Don't show system messages in chat bubble yet
                    continue;
                }

                // Clear system status once real content starts
                if (systemStatus) setSystemStatus('');

                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg.role === 'assistant') {
                        // Filter out system tags from display
                        lastMsg.content = accumulatedContent.replace(/^\[SYSTEM\].*?\n/g, '');
                    }
                    return newMessages;
                });
            }

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
            }]);
        } finally {
            setIsLoading(false);
            setSystemStatus('');
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
            {/* Sidebar - Source List */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Big History AI
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">BigHistory DB: v0.1 (2024.12.30) - 20 Books</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Subject/Target Section */}
                    <div>
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Subject / Target</h2>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm font-medium text-gray-700">{subjectTarget}</p>
                            <p className="text-xs text-gray-400 mt-1">기본 설정</p>
                        </div>
                    </div>

                    {/* Saved Items Section */}
                    <div>
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">My Saved Items</h2>
                        <div className="space-y-2">
                            {savedItems.length === 0 ? (
                                <p className="text-xs text-gray-400 italic p-2">저장된 항목이 없습니다.</p>
                            ) : (
                                savedItems.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors cursor-pointer">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                        <p className="text-xs text-gray-600 line-clamp-2">{item.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col h-full relative">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                                <Bot size={40} className="text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">무엇을 도와드릴까요?</h2>
                            <p className="text-gray-500 max-w-md">
                                좌측에 등록된 {sources.length}개의 빅히스토리 자료를 바탕으로 답변해 드립니다.
                                수업 자료 생성, 개념 설명, 퀴즈 등을 요청해 보세요.
                            </p>
                        </div>
                    )}

                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={cn(
                                "flex gap-4 max-w-3xl mx-auto w-full",
                                m.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            {m.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot size={16} className="text-blue-600" />
                                </div>
                            )}

                            <div
                                className={cn(
                                    "rounded-2xl transition-all",
                                    m.role === 'user'
                                        ? "px-6 py-4 shadow-sm bg-blue-600 text-white rounded-tr-none"
                                        : "w-full text-gray-800 bg-transparent px-2" // Removed box styles, kept minimal padding
                                )}
                            >
                                <div className={cn("prose prose-sm max-w-none dark:prose-invert", m.role === 'assistant' && "prose-headings:font-bold")}>
                                    {editingMessageId === m.id ? (
                                        <div className="w-full">
                                            <MessageEditor
                                                initialContent={m.content}
                                                onSave={(newContent) => saveEdit(m.id, newContent)}
                                                onCancel={() => setEditingMessageId(null)}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            {m.content.split('\n').map((line: string, i: number) => {
                                                if (line.startsWith('### ')) {
                                                    return <h3 key={i} className="text-lg font-bold text-blue-600 mt-6 mb-3 flex items-center gap-2">
                                                        <span className="w-1 h-6 bg-blue-600 rounded-full inline-block"></span>
                                                        {line.replace(/^###\s+/, '')}
                                                    </h3>;
                                                }
                                                if (line.startsWith('## ')) {
                                                    return <h2 key={i} className="text-xl font-bold text-gray-800 mt-8 mb-4 border-b-2 border-gray-100 pb-2">
                                                        {line.replace(/^##\s+/, '')}
                                                    </h2>;
                                                }
                                                if (line.startsWith('# ')) {
                                                    return <h1 key={i} className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-10 mb-6 border-b border-gray-200 pb-4">
                                                        {line.replace(/^#\s+/, '')}
                                                    </h1>;
                                                }
                                                // Check for bold notation (**text**)
                                                const boldRegex = /\*\*(.*?)\*\*/g;
                                                const parts = line.split(boldRegex);

                                                if (parts.length > 1) {
                                                    return (
                                                        <p key={i} className="mb-2 last:mb-0 text-gray-700 leading-relaxed font-medium">
                                                            {parts.map((part, partIdx) =>
                                                                partIdx % 2 === 1 ? <strong key={partIdx} className="text-blue-700 bg-blue-50 px-1 rounded">{part}</strong> : part
                                                            )}
                                                        </p>
                                                    );
                                                }

                                                return <p key={i} className="mb-2 last:mb-0 text-gray-700 leading-relaxed">{line}</p>;
                                            })}

                                            {m.role === 'assistant' && !isLoading && (
                                                <div className="flex gap-2 mt-4 border-t border-gray-100 pt-2">
                                                    <button onClick={() => startEditing(m.id)} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1">
                                                        <span>수정</span>
                                                    </button>
                                                    <button onClick={() => handleSaveMessage(m.content)} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1">
                                                        <span>저장</span>
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {
                                m.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                                        <User size={16} className="text-gray-600" />
                                    </div>
                                )
                            }
                        </div>
                    ))}
                    <div ref={messagesEndRef} />

                    {/* Status Indicator */}
                    {systemStatus && (
                        <div className="flex justify-center mb-4">
                            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 animate-pulse shadow-sm border border-blue-100">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                {systemStatus}
                            </div>
                        </div>
                    )}

                    {isLoading && !systemStatus && (
                        <div className="flex gap-4 max-w-3xl mx-auto w-full">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                                <Bot size={16} className="text-blue-600" />
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm flex items-center gap-3">
                                <span className="text-sm text-gray-500 font-medium animate-pulse">답변 추론중...</span>
                                <div className="flex gap-1 h-6 items-center">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Form */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="max-w-3xl mx-auto relative">
                        <form onSubmit={handleDataSubmit} className="relative">
                            <div className="absolute -top-12 left-0 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMode('lecture')}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                                        mode === 'lecture'
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    강의자료 만들기
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('qa')}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                                        mode === 'qa'
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    질문하기
                                </button>
                            </div>

                            <input
                                className="w-full h-14 pl-6 pr-14 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-gray-400"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={mode === 'lecture' ? "생성하고 싶은 강의 주제를 입력하세요..." : "빅히스토리와 관련된 질문을 해보세요..."}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !inputValue.trim()}
                                className="absolute right-2 top-2 h-10 w-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-full flex items-center justify-center text-white transition-colors shadow-sm"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                        <p className="text-center text-xs text-gray-400 mt-3">
                            Google Gemini 1.5 Flash • Big History Project MVP
                        </p>
                    </div>
                </div>
            </main >
        </div >
    );
}
