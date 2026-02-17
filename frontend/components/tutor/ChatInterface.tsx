import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Loader2, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
    context?: string;
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export function ChatInterface({ context, isOpen, onClose }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm Player 0, your personalized AI Tutor. I can help you understand this topic, explain concepts, or find resources. What's on your mind?"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Reset chat when context changes (optional, but good for fresh start)
    useEffect(() => {
        if (context) {
            setMessages([
                {
                    id: 'context-welcome',
                    role: 'assistant',
                    content: `I see you're looking at **${context}**. How can I help you with this?`
                }
            ]);
        }
    }, [context]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        // Create a placeholder for the bot response
        const botMsgId = (Date.now() + 1).toString();
        const botMsg: Message = {
            id: botMsgId,
            role: 'assistant',
            content: ''
        };
        setMessages(prev => [...prev, botMsg]);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.content,
                    context: context || "General Programming"
                })
            });

            if (!res.ok) throw new Error('Failed to fetch response');
            if (!res.body) throw new Error('No response body');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                accumulatedContent += text;

                setMessages(prev => prev.map(msg =>
                    msg.id === botMsgId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                ));
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => prev.map(msg =>
                msg.id === botMsgId
                    ? { ...msg, content: "Sorry, I'm having trouble connecting right now. Please try again." }
                    : msg
            ));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={cn(
            "fixed bottom-4 right-4 bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col transition-all duration-300 z-50 overflow-hidden",
            isExpanded ? "w-[600px] h-[80vh]" : "w-[350px] h-[500px]",
            !isOpen && "hidden" // Hide instead of unmount
        )}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full overflow-hidden border-2 border-white/30 relative">
                        {/* Zoom in on the face */}
                        <img
                            src="/Player_0_image.png"
                            alt="Player 0"
                            className="w-full h-full object-cover scale-[1.3] shadow-inner"
                            style={{ objectPosition: 'center 15%' }}
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-base">Player 0</h3>
                        {context && <p className="text-[10px] text-blue-100 opacity-80 line-clamp-1 max-w-[200px]">{context}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                    >
                        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-100 scrollbar-thin scrollbar-thumb-neutral-200">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-3 max-w-[90%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        {/* Avatar for Assistant */}
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-neutral-200 bg-white relative">
                                <img
                                    src="/Player_0_image.png"
                                    alt="P0"
                                    className="w-full h-full object-cover scale-[1.3] shadow-sm"
                                    style={{ objectPosition: 'center 15%' }}
                                />
                            </div>
                        )}

                        <div className={cn(
                            "p-3 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden",
                            msg.role === 'user'
                                ? "bg-neutral-900 text-white rounded-tr-none"
                                : "bg-white border border-neutral-200 text-neutral-800 rounded-tl-none" // Brighter white for contrast
                        )}>
                            {msg.role === 'assistant' ? (
                                <div className="prose prose-sm max-w-none 
                                        prose-p:my-1.5 
                                        prose-pre:bg-[#1e1e1e] prose-pre:text-gray-100 prose-pre:p-3 prose-pre:rounded-lg prose-pre:border prose-pre:border-gray-700
                                        prose-code:text-pink-600 prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                                        prose-strong:text-neutral-900 prose-strong:font-bold markdown-content">
                                    <ReactMarkdown>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                msg.content
                            )}
                        </div>
                    </div>
                ))}
                {loading && !messages[messages.length - 1].content && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-neutral-200 bg-white relative">
                            <img
                                src="/Player_0_image.png"
                                alt="P0"
                                className="w-full h-full object-cover scale-[1.3] shadow-sm"
                                style={{ objectPosition: 'center 15%' }}
                            />
                        </div>
                        <div className="bg-white border border-neutral-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-neutral-200">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Message Player 0..."
                        disabled={loading}
                        className="w-full pr-12 pl-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-neutral-400">Player 0 can make mistakes. Verify important info.</p>
                </div>
            </div>
        </div>
    );
}
