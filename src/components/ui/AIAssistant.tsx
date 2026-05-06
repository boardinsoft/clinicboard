'use client';

import React, { useState, useRef } from 'react';
import { analyzeWithDrClinica } from '@/actions/ai-analysis';
import {
    FileText,
    FlaskConical,
    Image as ImageIcon,
    Download,
    Trash2,
    Edit2,
    Upload,
    FileIcon,
    X,
    MoreHorizontal,
    Send,
    Folder,
    Bot,
    User as UserIcon,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLayoutStore } from '@/store/useLayoutStore';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuAction,
} from '@/components/ui/sidebar';

interface PatientFile {
    id: string;
    name: string;
    type: 'pdf' | 'jpg' | 'png' | 'dicom' | 'doc' | 'other';
    uploadedAt: string;
    size?: string;
}

interface DocumentSection {
    id: string;
    title: string;
    icon: React.ElementType;
    files: PatientFile[];
}

function formatFileDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function DocumentSectionNode({
    section,
    onUpload,
}: {
    section: DocumentSection;
    onUpload: (sectionId: string, file: File) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const Icon = section.icon;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onUpload(section.id, file);
        e.target.value = '';
    };

    return (
        <SidebarGroup className="py-2">
            <SidebarGroupLabel className="flex items-center justify-between h-8 px-2 mb-1">
                <div className="flex items-center gap-2 truncate text-[11px] font-bold text-muted-foreground/70">
                    <Icon className="w-3.5 h-3.5 text-primary/60" />
                    <span className="truncate">{section.title}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="h-4.5 px-1.5 min-w-4.5 justify-center rounded-md text-[11px] font-bold bg-muted/50 text-muted-foreground/60">
                        {section.files.length}
                    </Badge>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-md hover:bg-muted/40 ml-1 transition-colors duration-100" 
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-3 h-3 text-muted-foreground/60" />
                    </Button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </SidebarGroupLabel>

            <SidebarGroupContent>
                {section.files.length === 0 ? (
                    <div className="px-3 py-2 text-[11px] text-muted-foreground/40 italic border-l border-border/20 ml-5">
                        Sin registros
                    </div>
                ) : (
                    <SidebarMenu>
                        {section.files.map((file) => (
                            <SidebarMenuItem key={file.id}>
                                <SidebarMenuButton className="h-auto py-2 w-full flex items-center gap-2.5 hover:bg-muted/40 transition-colors duration-100">
                                    <FileIcon className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <span className="text-[11px] font-medium truncate text-foreground/90 leading-tight">{file.name}</span>
                                        <span className="text-[11px] text-muted-foreground/50 mt-0.5">
                                            {formatFileDate(file.uploadedAt)}{file.size ? ` · ${file.size}` : ''}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="text-[11px] font-mono px-1 py-0 h-4 border-border/40 text-muted-foreground/60 shrink-0">
                                        {file.type}
                                    </Badge>
                                </SidebarMenuButton>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuAction showOnHover className="transition-opacity duration-100">
                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                        </SidebarMenuAction>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44 rounded-lg shadow-lg border-border">
                                        <DropdownMenuItem className="gap-2 text-[12px] transition-colors duration-100">
                                            <Download className="w-3.5 h-3.5 text-muted-foreground/60" /> Descargar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="gap-2 text-[12px] transition-colors duration-100">
                                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground/60" /> Renombrar
                                        </DropdownMenuItem>
                                        <Separator className="my-1 bg-border/20" />
                                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive gap-2 text-[12px] transition-colors duration-100">
                                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                )}
            </SidebarGroupContent>
        </SidebarGroup>
    );
}

const INITIAL_SECTIONS: DocumentSection[] = [
    { id: 'documents', title: 'Documentos', icon: FileText, files: [] },
    { id: 'studies', title: 'Estudios', icon: FlaskConical, files: [] },
    { id: 'imaging', title: 'Imagenología', icon: ImageIcon, files: [] },
];

export default function AIAssistant() {
    const { toggleRightPanel } = useLayoutStore();
    const pathname = usePathname();
    const [sections, setSections] = useState<DocumentSection[]>(INITIAL_SECTIONS);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Chat state
    const [chatInput, setChatInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string; timestamp: Date }[]>([
        {
            id: '1',
            role: 'assistant',
            text: 'Hola, soy Dra. Clínica. Puedo ayudarte a analizar historias clínicas, resumir encuentros y extraer información médica. ¿En qué puedo asistirte?',
            timestamp: new Date()
        }
    ]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic for chat
    React.useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const userText = chatInput;
        const newUserMsg = {
            id: Date.now().toString(),
            role: 'user' as const,
            text: userText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMsg]);
        setChatInput('');
        setIsLoading(true);

        try {
            // Llamar a Hugging Face via Server Action
            const response = await analyzeWithDrClinica(userText);

            if (response.error) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    text: `❌ Error: ${response.error}`,
                    timestamp: new Date()
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    text: response.text,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: `⚠️ Error de conexión: ${error instanceof Error ? error.message : 'Desconocido'}`,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = (sectionId: string, file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase() as PatientFile['type'] ?? 'other';
        const newFile: PatientFile = {
            id: `${sectionId}-${Date.now()}`,
            name: file.name,
            type: ['pdf', 'jpg', 'png', 'dicom', 'doc'].includes(ext) ? ext : 'other',
            uploadedAt: new Date().toISOString(),
            size: file.size > 0 ? `${(file.size / 1024).toFixed(1)} KB` : undefined,
        };
        setSections((prev) =>
            prev.map((s) => s.id === sectionId ? { ...s, files: [...s.files, newFile] } : s)
        );
    };

    const handleGlobalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleUpload('documents', file);
    };

    return (
        <aside
            className="h-full w-full bg-background flex flex-col relative"
            role="complementary"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleGlobalDrop}
        >
            {/* ── ENCABEZADO PANEL ── */}
            <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-background shrink-0">
                <div className="flex items-center gap-2 text-foreground font-bold text-[11px]">
                    {pathname?.includes('/patients/') ? (
                        <Folder className="w-3.5 h-3.5 text-primary opacity-80" />
                    ) : (
                        <Bot className="w-3.5 h-3.5 text-primary opacity-80" />
                    )}
                    <span>{pathname?.includes('/patients/') ? 'Documentos' : 'Dra. Clínica'}</span>
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
                {pathname?.includes('/patients/') ? (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-1">
                            {sections.map((section) => (
                                <DocumentSectionNode
                                    key={section.id}
                                    section={section}
                                    onUpload={handleUpload}
                                />
                            ))}
                        </div>

                        <div
                            ref={dropZoneRef}
                            className={cn(
                                "mx-3 my-6 border border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center transition-all duration-200",
                                isDragging
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border text-muted-foreground/40 hover:border-border hover:bg-muted/30"
                            )}
                        >
                            <Upload className={cn("w-6 h-6 mb-2 opacity-20", isDragging && "opacity-100")} />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-semibold text-foreground/80">
                                    {isDragging ? 'Soltar aquí' : 'Subir archivo'}
                                </span>
                                <span className="text-[11px] text-muted-foreground/60">Arrastra o selecciona</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full relative bg-background">
                        <ScrollArea className="flex-1 px-4 py-4" ref={scrollContainerRef}>
                            <div className="flex flex-col gap-4 pb-20">
                                {messages.map((msg) => {
                                    const isAssistant = msg.role === 'assistant';
                                    const timeStr = msg.timestamp.toLocaleTimeString('es-VE', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });

                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex w-full gap-3",
                                                isAssistant ? "justify-start" : "justify-end"
                                            )}
                                        >
                                            {/* Avatar lado izquierdo (solo asistente) */}
                                            {isAssistant && (
                                                <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold rounded-full">
                                                        <Bot className="w-4 h-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}

                                            {/* Contenedor de mensaje + metadata */}
                                            <div className={cn(
                                                "flex flex-col gap-1 max-w-[80%]",
                                                isAssistant ? "items-start" : "items-end"
                                            )}>
                                                {/* Nombre + timestamp */}
                                                <div className="flex items-center gap-2 px-2">
                                                    <span className="text-[11px] font-semibold text-foreground/70">
                                                        {isAssistant ? 'Dra. Clínica' : 'Tú'}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground/60">
                                                        {timeStr}
                                                    </span>
                                                </div>

                                                {/* Burbuja de mensaje */}
                                                <div
                                                    className={cn(
                                                        "px-3 py-2 rounded-lg text-[13px] leading-relaxed border shadow-sm",
                                                        isAssistant
                                                            ? "bg-muted/50 text-foreground border-border/40 rounded-tl-sm"
                                                            : "bg-primary text-primary-foreground border-primary rounded-tr-sm"
                                                    )}
                                                >
                                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                                </div>
                                            </div>

                                            {/* Avatar lado derecho (solo usuario) */}
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

                                {/* Loading indicator */}
                                {isLoading && (
                                    <div className="flex w-full gap-3 justify-start">
                                        <Avatar className="w-7 h-7 shrink-0">
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                <Bot className="w-4 h-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-muted/50 border border-border/40">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/60" />
                                            <span className="text-[11px] text-muted-foreground/60">Analizando...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input section */}
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
                )}
            </div>

            {isDragging && (
                <div className="absolute inset-2 bg-sidebar/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl border-2 border-primary border-dashed pointer-events-none animate-in fade-in duration-200">
                    <div className="flex flex-col items-center gap-2 text-primary">
                        <Upload className="w-8 h-8" />
                        <span className="font-bold text-sm text-primary">Cargar aquí</span>
                    </div>
                </div>
            )}
        </aside>
    );
}
