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
    MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLayoutStore } from '@/store/useLayoutStore';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

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
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary/70" />
                    <h4 className="text-sm font-semibold tracking-tight">{section.title}</h4>
                    <Badge variant="secondary" className="text-[10px] px-1.5 min-w-[20px] justify-center bg-muted/50">
                        {section.files.length}
                    </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-3.5 h-3.5" />
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            <div className="flex flex-col gap-1.5 pl-4">
                {section.files.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground/60 py-2 italic border-l-2 border-muted/20 pl-4 ml-1">
                        Sin documentos registrados
                    </div>
                ) : (
                    section.files.map((file) => (
                        <div key={file.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="p-1.5 rounded bg-muted/30 group-hover:bg-background transition-colors">
                                    <FileIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-[11px] font-medium truncate text-foreground/90">{file.name}</span>
                                    <span className="text-[9px] text-muted-foreground uppercase tracking-tight">
                                        {formatFileDate(file.uploadedAt)}{file.size ? ` · ${file.size}` : ''}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Badge variant={FILE_EXTENSION_COLORS[file.type] || "outline"} className="text-[9px] uppercase font-mono px-1.5 py-0 h-4 border-0">
                                    {file.type}
                                </Badge>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                        </Button>
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
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const INITIAL_SECTIONS: DocumentSection[] = [
    { id: 'documents', title: 'Documentos', icon: FileText, files: [] },
    { id: 'studies', title: 'Estudios', icon: FlaskConical, files: [] },
    { id: 'imaging', title: 'Imagenología', icon: ImageIcon, files: [] },
];

export default function RightPanel() {
    const { rightPanelOpen, toggleRightPanel } = useLayoutStore();
    const pathname = usePathname();
    const [sections, setSections] = useState<DocumentSection[]>(INITIAL_SECTIONS);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    if (!rightPanelOpen) return null;

    const isPatientView = pathname?.startsWith('/patients/');

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
            className="w-80 border-l border-border bg-card h-full flex flex-col shrink-0 relative transition-all duration-300 z-10 shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.05)]"
            role="complementary"
        >
            <div className="flex items-center justify-between p-4 border-b border-border h-14 bg-card/80 backdrop-blur-sm sticky top-0 z-20">
                <div className="flex items-center gap-2 text-primary font-semibold tracking-tight">
                    {isPatientView ? (
                        <div className="bg-primary/10 p-1.5 rounded-md">
                            <Folder className="w-4 h-4" />
                        </div>
                    ) : (
                        <div className="bg-primary/10 p-1.5 rounded-md">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                    )}
                    <span className="text-sm">{isPatientView ? 'Centro de Documentos' : 'Asistente IA'}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={toggleRightPanel}>
                    <X className="w-4 h-4 text-muted-foreground" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-2">
                {isPatientView ? (
                    <>
                        <div className="flex-1 space-y-2">
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
                                "mt-6 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300",
                                isDragging
                                    ? "border-primary bg-primary/5 text-primary scale-[0.98] shadow-inner"
                                    : "border-border text-muted-foreground hover:bg-muted/30 hover:border-muted-foreground/40"
                            )}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleGlobalDrop}
                        >
                            <Upload className={cn("w-10 h-10 mb-3 transition-opacity", isDragging ? "opacity-100" : "opacity-30")} />
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">
                                    {isDragging ? 'Subir ahora' : 'Cargar documentos'}
                                </span>
                                <span className="text-[11px] opacity-60">PDF, JPG, DICOM</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center border border-border/50">
                            <MessageSquare className="w-8 h-8 opacity-20" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-foreground">Asistente Médico de IA</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                El asistente estará disponible próximamente para ayudarte con el resumen de historias y análisis clínico.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" disabled className="text-[11px]">
                            Activar Acceso Temprano
                        </Button>
                    </div>
                )}
            </div>
        </aside>
    );
}

