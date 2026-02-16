import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight, Zap, Shield, TrendingUp, Send } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { useTradeSystemState } from '@/hooks/useTradeSystemState';

const RecommendationCard = ({ recommendation, onAction }) => {
    const { title, description, score, tags, actionLabel, priority } = recommendation;

    // Tag styles
    const tagStyles = {
        velocity: 'bg-blue-100 text-blue-700 border-blue-200',
        trust: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        efficiency: 'bg-amber-100 text-amber-700 border-amber-200',
    };

    // Priority borders
    const borderClass = priority === 'critical' ? 'border-l-4 border-l-red-500' :
        priority === 'high' ? 'border-l-4 border-l-amber-500' :
            'border-l-4 border-l-blue-500';

    return (
        <Surface
            variant="panel"
            className={cn("p-4 border-white/5 mb-3 group hover:border-blue-500/30 transition-all cursor-pointer", borderClass)}
            onClick={onAction}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                    {tags.map(tag => (
                        <span key={tag} className={cn("text-os-xs font-bold uppercase px-1.5 py-0.5 rounded border", tagStyles[tag])}>
                            {tag}
                        </span>
                    ))}
                </div>
                <div className="text-os-xs font-bold text-gray-400">
                    Score: {score}
                </div>
            </div>

            <h4 className="font-bold text-white text-os-sm mb-1">{title}</h4>
            <p className="text-os-xs text-os-muted mb-3 leading-relaxed">{description}</p>

            <Button
                size="sm"
                variant="ghost"
                className="w-full justify-between group hover:bg-os-blue/10 text-blue-400 hover:text-blue-300 border border-blue-500/10 transition-colors"
                onClick={onAction}
            >
                {actionLabel}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Button>
        </Surface>
    );
};

export const AICopilotSidebar = ({ isOpen, onClose, recommendations = [], systemState }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();

    // Chat State
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    // 2026 UI: Animated Placeholder
    const [placeholder, setPlaceholder] = useState("Ask KoniAI...");
    useEffect(() => {
        const phrases = ["Draft a cocoa RFQ...", "Analyze market risks...", "Check shipping rates...", "Find trusted suppliers..."];
        let i = 0;
        const interval = setInterval(() => {
            setPlaceholder(phrases[i]);
            i = (i + 1) % phrases.length;
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // ⚡ PERFORMANCE: Warm up the Edge Function on mount
    useEffect(() => {
        if (isOpen) {
            // Fire-and-forget ping to wake up the V8 isolate
            fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/koniai-chat`, {
                method: 'OPTIONS',
                headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }
            }).catch(() => { }); // Ignore errors, just waking it up
        }
    }, [isOpen]);

    // Handle Send
    const handleSend = async () => {
        if (!inputValue.trim() || isTyping) return;

        const userMsg = { role: 'user', content: inputValue.trim(), id: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const { data, error } = await supabase.functions.invoke('koniai-chat', {
                body: {
                    message: userMsg.content,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    context: {
                        currentPage: location.pathname,
                        userId: user?.id,
                        systemState: systemState // Inject live OS state
                    }
                }
            });

            if (error) throw error;

            const aiMsg = {
                role: 'assistant',
                content: data.response,
                actions: data.actions || [],
                id: Date.now() + 1
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            console.error('AI Error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting to the network right now. Please try again.",
                isError: true,
                id: Date.now() + 1
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-full h-full bg-white/80 dark:bg-[#08090A]/90 backdrop-blur-3xl border-l border-white/20 dark:border-white/5 shadow-2xl z-[100] flex flex-col font-sans">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex-shrink-0 z-10 relative overflow-hidden bg-gradient-to-r from-white/40 to-white/10 dark:from-black/40 dark:to-transparent">

                <div className="flex items-center justify-between mb-2 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <div className="w-10 h-10 rounded-os-md bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] border border-white/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                                <Sparkles className="w-5 h-5 animate-pulse" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-[3px] border-white dark:border-black rounded-full shadow-os-md z-20" />
                        </div>
                        <div>
                            <span className="font-black text-os-lg text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 dark:from-white dark:via-indigo-200 dark:to-white tracking-tight block leading-none mb-1">
                                KoniAI
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-[ping_2s_ease-in-out_infinite]" />
                                <span className="text-os-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">v4.0 Live</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all duration-300 hover:rotate-90 active:scale-90"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar scroll-smooth" ref={scrollRef}>
                {/* Recommendations (Only show if no messages yet) */}
                {messages.length === 0 && (
                    <div className="mb-6 animate-in slide-in-from-bottom-4 duration-700 fade-in fill-mode-forwards">
                        <div className="p-1 rounded-os-md bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 mb-6">
                            <div className="bg-white/50 dark:bg-black/40 backdrop-blur-md rounded-os-sm p-4 border border-white/10 text-center">
                                <p className="text-os-sm font-medium text-gray-600 dark:text-gray-300">
                                    "Ready to optimize your supply chain, User?"
                                </p>
                            </div>
                        </div>

                        <h3 className="text-os-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Zap className="w-3 h-3 text-amber-500" /> Intelligence Feed
                        </h3>

                        {recommendations.length > 0 ? (
                            <div className="space-y-4">
                                {recommendations.slice(0, 3).map(rec => (
                                    <RecommendationCard
                                        key={rec.id}
                                        recommendation={rec}
                                        onAction={() => {
                                            navigate(rec.actionPath);
                                            onClose();
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400 text-os-xs font-medium border border-dashed border-gray-200 dark:border-white/10 rounded-os-md bg-gray-50/50 dark:bg-white/5">
                                All systems nominal.<br />
                                <span className="text-os-xs opacity-60">Monitoring trade networks...</span>
                            </div>
                        )}

                        <div className="mt-8">
                            <p className="text-os-xs font-bold text-center text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {["Draft a cocoa RFQ", "Check shipping rates", "Analyze my risk"].map(q => (
                                    <button
                                        key={q}
                                        onClick={() => { setInputValue(q); }}
                                        className="text-os-xs font-medium px-4 py-2 rounded-os-sm bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 border border-gray-100 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all text-gray-600 dark:text-gray-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Message Stream */}
                <div className="space-y-6 pb-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex flex-col max-w-[92%]",
                                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                        >
                            <div className={cn(
                                "p-4 sm:p-5 rounded-os-md text-os-sm leading-7 shadow-sm relative overflow-hidden group transition-all duration-300",
                                msg.role === 'user'
                                    ? "bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white rounded-br-sm shadow-[0_8px_20px_rgba(79,70,229,0.25)] border-t border-l border-white/20"
                                    : "bg-white dark:bg-[#1A1D21] border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-100 rounded-bl-sm shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl"
                                , "whitespace-pre-wrap font-medium tracking-wide")}>
                                {msg.role === 'assistant' && (
                                    <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                                )}
                                {msg.content}
                            </div>

                            {/* Actions */}
                            {msg.actions && msg.actions.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
                                    {msg.actions.map((action, idx) => (
                                        <Button
                                            key={idx}
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                if (action.type === 'navigate') {
                                                    navigate(action.data.path);
                                                    onClose();
                                                }
                                            }}
                                            className="text-os-xs h-8 bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all rounded-lg"
                                        >
                                            {action.label}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex items-center gap-1.5 ml-2 p-3 bg-white/50 dark:bg-white/5 rounded-os-md w-fit border border-gray-100 dark:border-white/5 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-[bounce_1s_infinite] delay-0" />
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-[bounce_1s_infinite] delay-100" />
                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-[bounce_1s_infinite] delay-200" />
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Input */}
            <div className="p-5 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#08090A] dark:via-[#08090A]/95 flex-shrink-0 relative z-20 backdrop-blur-sm">
                <div className="relative shadow-[0_0_40px_rgba(0,0,0,0.08)] rounded-os-lg bg-white dark:bg-[#15171A] border-2 border-transparent focus-within:border-indigo-500/20 transition-all duration-300">
                    {/* Input Glow */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-os-lg opacity-0 focus-within:opacity-20 transition-opacity duration-300 blur-md pointer-events-none" />

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={isTyping}
                        className="w-full relative bg-transparent border-none py-4 pl-6 pr-14 text-os-sm font-medium text-gray-900 dark:text-white focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600 disabled:opacity-50 transition-all"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isTyping}
                            className="p-2.5 bg-black dark:bg-white text-white dark:text-black rounded-os-md hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-os-md hover:shadow-os-lg"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </div>
                </div>
                <div className="mt-3 flex justify-center items-center gap-1.5 opacity-40">
                    <div className="w-1 h-1 rounded-full bg-gray-500" />
                    <span className="text-os-xs font-bold text-gray-500 uppercase tracking-[0.25em]">Neural Engine v4.0</span>
                    <div className="w-1 h-1 rounded-full bg-gray-500" />
                </div>
            </div>
        </div>
    );
};
