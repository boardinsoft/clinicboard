'use client';

import React, { useState, useRef, memo } from 'react';
import { analyzeWithDrClinica } from '@/actions/ai-analysis';
import {
    X,
    Send,
    Bot,
    User as UserIcon,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLayoutStore } from '@/store/useLayoutStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

const AIAssistantPanel = memo(function AIAssistantPanel() {
    const { toggleRightPanel } = useLayoutStore();
    const [chatInput, setChatInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<{
        id: string;
        role: 'user' | 'assistant';
        text: string;
        timestamp: Date;
    }[]>([
        {
            id: '1',
            role: 'assistant',
            text: 'Hola, soy Dra. Clínica. Puedo ayudarte a analizar historias clínicas, resumir encuentros y extraer información médica. ¿En qué puedo asistirte?',
            timestamp: new Date(),
        },
    ]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = React.useCallback(async () => {
        if (!chatInput.trim()) return;

        const userText = chatInput;
        const newUserMsg = {
            id: Date.now().toString(),
            role: 'user' as const,
            text: userText,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newUserMsg]);
        setChatInput('');
        setIsLoading(true);

        try {
            const response = await analyzeWithDrClinica(userText);

            if (response.error) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        text: `❌ Error: ${response.error}`,
                        timestamp: new Date(),
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        text: response.text,
                        timestamp: new Date(),
                    },
                ]);
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    text: `⚠️ Error de conexión: ${error instanceof Error ? error.message : 'Desconocido'}`,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [chatInput]);

    return (
        <aside
            className="h-full w-full bg-background flex flex-col relative"
            role="complementary"
        >
            <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-background shrink-0">
                <div className="flex items-center gap-2 text-foreground font-bold text-[11px]">
                    <Bot className="w-3.5 h-3.5 text-primary opacity-80" />
                    <span>Dra. Clínica</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md hover:bg-muted/40 transition-colors duration-100"
                    onClick={toggleRightPanel}
                >
                    <X className="w-3.5 h-3.5 text-muted-foreground/60" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2">
                <div className="flex flex-col h-full relative bg-background">
                    <ScrollArea className="flex-1 px-4 py-4" ref={scrollContainerRef}>
                        <div className="flex flex-col gap-4 pb-20">
                            {messages.map((msg) => {
                                const isAssistant = msg.role === 'assistant';
                                const timeStr = msg.timestamp.toLocaleTimeString('es-VE', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                });

                                return (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            'flex w-full gap-3',
                                            isAssistant ? 'justify-start' : 'justify-end'
                                        )}
                                    >
                                        {isAssistant && (
                                            <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold rounded-full">
                                                    <Bot className="w-4 h-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}

                                        <div
                                            className={cn(
                                                'flex flex-col gap-1 max-w-[80%]',
                                                isAssistant ? 'items-start' : 'items-end'
                                            )}
                                        >
                                            <div className="flex items-center gap-2 px-2">
                                                <span className="text-[11px] font-semibold text-foreground/70">
                                                    {isAssistant ? 'Dra. Clínica' : 'Tú'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/60">
                                                    {timeStr}
                                                </span>
                                            </div>

                                            <div
                                                className={cn(
                                                    'px-3 py-2 rounded-lg text-[13px] leading-relaxed border shadow-sm',
                                                    isAssistant
                                                        ? 'bg-muted/50 text-foreground border-border/40 rounded-tl-sm'
                                                        : 'bg-primary text-primary-foreground border-primary rounded-tr-sm'
                                                )}
                                            >
                                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                            </div>
                                        </div>

                                        {!isAssistant && (
                                            <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                                                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold rounded-full">
                                                    <UserIcon className="w-4 h-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                );
                            })}

                            {isLoading && (
                                <div className="flex w-full gap-3 justify-start">
                                    <Avatar className="w-7 h-7 shrink-0">
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                            <Bot className="w-4 h-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-muted/50 border border-border/40">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/60" />
                                        <span className="text-[11px] text-muted-foreground/60">
                                            Analizando...
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="flex items-end gap-2 p-3 border-t border-border bg-muted/30 shrink-0">
                        <Textarea
                            placeholder="Pregunta sobre historias clínicas..."
                            className="min-h-[38px] h-[38px] max-h-[120px] resize-none px-3 py-2 text-[13px] rounded-lg bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/30 shadow-none transition-all duration-100"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            disabled={isLoading}
                        />
                        <Button
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-100 disabled:opacity-50"
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Send className="w-3.5 h-3.5" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </aside>
    );
});

export default AIAssistantPanel;