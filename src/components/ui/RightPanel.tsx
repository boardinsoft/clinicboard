'use client';

import React, { useState, useRef } from 'react';
import {
    FileText,
    FlaskConical,
    Image as ImageIcon,
    Download,
    Trash2,
    Edit2,
    Upload,
    Folder,
    FileIcon,
    X,
    MessageSquare,
    MoreHorizontal,
    Send,
    Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const FILE_EXTENSION_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pdf: 'destructive',
    jpg: 'secondary',
    png: 'secondary',
    dicom: 'default',
    doc: 'outline',
    other: 'outline',
};

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
            <SidebarGroupLabel className="justify-between px-2 text-foreground font-semibold h-8">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{section.title}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="h-5 px-1.5 min-w-5 justify-center rounded-full text-[10px] font-bold">
                        {section.files.length}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted ml-1" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-3.5 h-3.5" />
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
                    <div className="px-4 py-2 text-xs text-muted-foreground/60 italic border-l ml-6">
                        Sin documentos registrados
                    </div>
                ) : (
                    <SidebarMenu>
                        {section.files.map((file) => (
                            <SidebarMenuItem key={file.id}>
                                <SidebarMenuButton className="h-auto py-2 w-full flex items-center gap-2.5">
                                    <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <span className="text-[11px] font-medium truncate text-foreground/90 leading-tight">{file.name}</span>
                                        <span className="text-[9px] text-muted-foreground uppercase tracking-tight">
                                            {formatFileDate(file.uploadedAt)}{file.size ? ` · ${file.size}` : ''}
                                        </span>
                                    </div>
                                    <Badge variant={FILE_EXTENSION_COLORS[file.type] || "outline"} className="text-[9px] uppercase font-mono px-1 py-0 h-4 border-0 shrink-0">
                                        {file.type}
                                    </Badge>
                                </SidebarMenuButton>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuAction showOnHover>
                                            <MoreHorizontal className="w-4 h-4" />
                                            <span className="sr-only">Más opciones</span>
                                        </SidebarMenuAction>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem className="gap-2">
                                            <Download className="w-4 h-4 opacity-70" /> Descargar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="gap-2">
                                            <Edit2 className="w-4 h-4 opacity-70" /> Renombrar
                                        </DropdownMenuItem>
                                        <Separator className="my-1" />
                                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive gap-2">
                                            <Trash2 className="w-4 h-4" /> Eliminar
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

export default function RightPanel() {
    const { toggleRightPanel } = useLayoutStore();
    const pathname = usePathname();
    const [sections, setSections] = useState<DocumentSection[]>(INITIAL_SECTIONS);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Chat state
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string; timestamp: Date }[]>([
        {
            id: '1',
            role: 'assistant',
            text: 'Hola, soy el Asistente Clínico de IA. Puedo ayudarte a resumir historias clínicas, extraer datos relevantes o analizar síntomas. ¿En qué te puedo ayudar hoy?',
            timestamp: new Date()
        }
    ]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const isPatientView = pathname?.startsWith('/patients/');

    // Auto-scroll logic for chat
    React.useEffect(() => {
        if (!isPatientView && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages, isPatientView]);

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        
        const newUserMsg = {
            id: Date.now().toString(),
            role: 'user' as const,
            text: chatInput,
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, newUserMsg]);
        setChatInput('');
        
        // Simulating AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: 'Entendido. Esta funcionalidad se conectará a MedGemma pronto.',
                timestamp: new Date()
            }]);
        }, 1000);
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
            className="h-full w-full bg-sidebar flex flex-col relative z-10"
            role="complementary"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleGlobalDrop}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border h-14 bg-sidebar">
                <div className="flex items-center gap-2 text-foreground font-semibold tracking-tight">
                    {isPatientView ? (
                        <div className="bg-primary/10 text-primary p-1.5 rounded-md">
                            <Folder className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="bg-primary/10 text-primary p-1.5 rounded-md">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                    )}
                    <span className="text-sm">{isPatientView ? 'Centro de Documentos' : 'Asistente IA'}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={toggleRightPanel}>
                    <X className="w-4 h-4 text-muted-foreground" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {isPatientView ? (
                    <>
                        <div className="flex-1 space-y-1">
                            {sections.map((section) => (
                                <DocumentSectionNode
                                    key={section.id}
                                    section={section}
                                    onUpload={handleUpload}
                                />
                            ))}
                        </div>

                        {/* Dropzone visual indicator within sidebar */}
                        <div
                            ref={dropZoneRef}
                            className={cn(
                                "m-4 mt-6 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300",
                                isDragging
                                    ? "border-primary bg-primary/5 text-primary scale-[0.98] shadow-inner"
                                    : "border-border text-muted-foreground hover:bg-muted/30 hover:border-muted-foreground/40"
                            )}
                        >
                            <Upload className={cn("w-8 h-8 mb-3 transition-opacity", isDragging ? "opacity-100" : "opacity-30")} />
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">
                                    {isDragging ? 'Soltar aquí' : 'Cargar documentos'}
                                </span>
                                <span className="text-[11px] opacity-60">Arrastra archivos aquí</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col h-full relative">
                        {/* Messages Area */}
                        <ScrollArea className="flex-1 px-4 py-4" ref={scrollContainerRef}>
                            <div className="flex flex-col gap-4 pb-20">
                                {messages.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={cn(
                                            "flex w-full gap-2", 
                                            msg.role === 'user' ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                                <Bot className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                        )}
                                        <div 
                                            className={cn(
                                                "px-3 py-2 rounded-2xl max-w-[85%] text-[13px] leading-relaxed",
                                                msg.role === 'user' 
                                                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                                                    : "bg-muted text-foreground rounded-tl-sm"
                                            )}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="absolute flex items-end gap-2 bottom-0 left-0 right-0 p-3 bg-sidebar border-t border-sidebar-border shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                            <Textarea 
                                placeholder="Pregunta sobre la historia clínica..."
                                className="min-h-[40px] h-[40px] max-h-[120px] resize-none px-3 py-2.5 text-[13px] rounded-xl bg-background border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary/50 shadow-sm"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <Button 
                                size="icon" 
                                className="h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-transform active:scale-95"
                                onClick={handleSendMessage}
                                disabled={!chatInput.trim()}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            {isDragging && (
                <div className="absolute inset-0 bg-sidebar/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg border-2 border-primary border-dashed m-2 pointer-events-none">
                    <div className="bg-background p-4 rounded-xl shadow-lg flex flex-col items-center gap-2 text-primary animate-in fade-in zoom-in duration-200">
                        <Upload className="w-8 h-8" />
                        <span className="font-semibold text-sm">Soltar documentos aquí</span>
                    </div>
                </div>
            )}
        </aside>
    );
}


