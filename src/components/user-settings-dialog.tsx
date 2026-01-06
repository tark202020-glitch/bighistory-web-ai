'use client';

import { useState, useEffect } from 'react';
import { X, LogOut, Check, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface UserSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onNameChange: (newName: string) => void;
}

export function UserSettingsDialog({ isOpen, onClose, onNameChange }: UserSettingsDialogProps) {
    const router = useRouter();
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    // Profile State
    const [name, setName] = useState('');
    const [currentName, setCurrentName] = useState('');

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Loading/Error State
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadUser();
            setMessage(null);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    }, [isOpen]);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
            setName(userName);
            setCurrentName(userName);
        }
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: name }
            });

            if (error) throw error;

            setMessage({ type: 'success', text: '이름이 변경되었습니다.' });
            setCurrentName(name);
            onNameChange(name);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || '오류가 발생했습니다.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            // Note: Supabase updateUser for password doesn't strictly require current password if session is active,
            // but for stricter flows we might re-authenticate. Here we trust the active session.
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || '오류가 발생했습니다.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        if (confirm('정말로 로그아웃 하시겠습니까?')) {
            await supabase.auth.signOut();
            router.push('/');
            router.refresh();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-bold text-slate-800">사용자 설정</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => { setActiveTab('profile'); setMessage(null); }}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                    >
                        프로필 설정
                    </button>
                    <button
                        onClick={() => { setActiveTab('password'); setMessage(null); }}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'password' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                    >
                        비밀번호 변경
                    </button>
                </div>

                <div className="p-6">
                    {message && (
                        <div className={`mb-4 p-3 rounded-lg text-xs font-bold ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'profile' ? (
                        <form onSubmit={handleUpdateName} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">사용자 이름</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                                        placeholder="이름을 입력하세요"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || name === currentName || !name.trim()}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? '저장 중...' : '변경사항 저장'}
                            </button>

                            <div className="pt-4 mt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full py-2.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <LogOut size={16} />
                                    로그아웃
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">현재 비밀번호</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">새 비밀번호</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">새 비밀번호 확인</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? '변경 중...' : '비밀번호 변경'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
