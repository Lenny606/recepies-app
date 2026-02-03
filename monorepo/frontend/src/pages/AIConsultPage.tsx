import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Send, User, Bot, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export const AIConsultPage: React.FC = () => {
    const navigate = useNavigate();
    const { authenticatedFetch } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Dobrý den. Jsem váš kulinářský asistent. Ptejte se na fakta, techniky nebo suroviny. S čím vám mohu poradit?',
            sender: 'ai',
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputValue('');
        setIsTyping(true);

        try {
            const apiMessages = newMessages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }));

            const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/agent/consult`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messages: apiMessages })
            });

            if (!response.ok) {
                throw new Error('Nepodařilo se spojit s AI');
            }

            const data = await response.json();

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response,
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Omlouvám se, ale nastala chyba při komunikaci se šéfkuchařem. Zkuste to prosím znovu za chvíli.',
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center gap-4 flex-shrink-0">
                <Button variant="secondary" onClick={() => navigate('/ai-assistant')} className="!p-2">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <span>AI Konzultace</span>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="max-w-3xl mx-auto space-y-4 pb-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`flex gap-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                                    }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'
                                        }`}
                                >
                                    {message.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                </div>
                                <div
                                    className={`rounded-2xl px-4 py-3 shadow-sm ${message.sender === 'user'
                                        ? 'bg-emerald-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                                        }`}
                                >
                                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{message.text}</p>
                                    <span
                                        className={`text-[10px] mt-1 block ${message.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'
                                            }`}
                                    >
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="flex gap-3 max-w-[85%]">
                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 p-4 pb-8 md:pb-4 flex-shrink-0">
                <div className="max-w-3xl mx-auto">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Zeptejte se na cokoliv ohledně vaření..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                        <Button
                            type="submit"
                            disabled={!inputValue.trim() || isTyping}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white !p-3 rounded-xl shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                        AI může dělat chyby. Vždy se řiďte svým kulinářským instinktem.
                    </p>
                </div>
            </div>
        </div>
    );
};
