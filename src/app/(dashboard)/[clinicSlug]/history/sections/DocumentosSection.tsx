'use client';

import React, { useState, useRef } from 'react';
import {
    FileText,
    FlaskConical,
    Image as ImageIcon,
    Upload,
    Download,
    Trash2,
    MoreHorizontal,
    FolderOpen,
    FileIcon,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

interface DocumentosSectionProps {
    encounterId: string | null;
    isReadOnly?: boolean;
}

function formatFileDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function DocumentSectionCard({
    section,
    onUpload,
    isReadOnly,
}: {
    section: DocumentSection;
    onUpload: (sectionId: string, file: File) => void;
    isReadOnly?: boolean;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const Icon = section.icon;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onUpload(section.id, file);
        e.target.value = '';
    };

    return (
        <div className="border border-n-5/30 rounded-lg bg-n-1 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-n-2/50 border-b border-n-5/30">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-b-8" />
                    <span className="text-xs font-semibold text-n-11">{section.title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant="secondary"
                        className="h-5 px-1.5 min-w-5 justify-center rounded-md text-[10px] font-bold bg-n-3 text-n-8"
                    >
                        {section.files.length}
                    </Badge>
                    {!isReadOnly && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md hover:bg-n-4 transition-colors duration-100"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-3.5 h-3.5 text-n-8" />
                        </Button>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            <div className="p-2">
                {section.files.length === 0 ? (
                    <div className="py-4 text-center text-[11px] text-n-8 italic">
                        Sin archivos
                    </div>
                ) : (
                    <div className="space-y-1">
                        {section.files.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-n-3/50 transition-colors duration-100 group"
                            >
                                <FileIcon className="w-4 h-4 text-n-8 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-medium text-n-11 truncate">{file.name}</p>
                                    <p className="text-[10px] text-n-8">
                                        {formatFileDate(file.uploadedAt)}
                                        {file.size ? ` · ${file.size}` : ''}
                                    </p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] font-mono px-1.5 py-0 h-4 border-n-5/30 text-n-8 shrink-0"
                                >
                                    {file.type}
                                </Badge>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 rounded-md hover:bg-n-4"
                                    >
                                        <Download className="w-3 h-3 text-n-8" />
                                    </Button>
                                    {!isReadOnly && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 rounded-md hover:bg-destructive/10 text-destructive"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
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

export default function DocumentosSection({ encounterId, isReadOnly }: DocumentosSectionProps) {
    const [sections, setSections] = useState<DocumentSection[]>(INITIAL_SECTIONS);
    const [isDragging, setIsDragging] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const dropZoneRef = useRef<HTMLDivElement>(null);

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
            prev.map((s) => (s.id === sectionId ? { ...s, files: [...s.files, newFile] } : s))
        );
    };

    const handleGlobalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleUpload('documents', file);
    };

    if (!encounterId) return null;

    const totalFiles = sections.reduce((acc, s) => acc + s.files.length, 0);

    return (
        <div className="w-full max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <FolderOpen className="w-4 h-4 text-b-8" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-n-8">
                        Documentos Adjuntos
                    </span>
                    {totalFiles > 0 && (
                        <Badge
                            variant="secondary"
                            className="h-5 px-1.5 min-w-5 justify-center rounded-md text-[10px] font-bold bg-b-2 text-b-8"
                        >
                            {totalFiles}
                        </Badge>
                    )}
                    <div className="flex-1 h-px bg-n-5/20" />
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-7 px-2 text-n-8 hover:text-n-11"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronUp className="w-4 h-4" />
                    )}
                </Button>
            </div>

            {!isCollapsed && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        {sections.map((section) => (
                            <DocumentSectionCard
                                key={section.id}
                                section={section}
                                onUpload={handleUpload}
                                isReadOnly={isReadOnly}
                            />
                        ))}
                    </div>

                    {!isReadOnly && (
                        <div
                            ref={dropZoneRef}
                            className={cn(
                                'border border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all duration-200',
                                isDragging
                                    ? 'border-b-8 bg-b-2/30 text-b-8'
                                    : 'border-n-5/40 text-n-8 hover:border-n-5 hover:bg-n-2/30'
                            )}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleGlobalDrop}
                        >
                            <Upload
                                className={cn('w-6 h-6 mb-2 opacity-40', isDragging && 'opacity-100')}
                            />
                            <p className="text-sm font-semibold text-n-11">
                                {isDragging ? 'Soltar aquí' : 'Arrastra archivos o haz clic para subir'}
                            </p>
                            <p className="text-[11px] text-n-8 mt-0.5">
                                PDF, JPG, PNG, DICOM hasta 50MB
                            </p>
                        </div>
                    )}
                </>
            )}

            {isDragging && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-n-1/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-b-8 border-dashed bg-n-1">
                        <Upload className="w-10 h-10 text-b-8" />
                        <span className="font-bold text-sm text-b-8">Cargar archivos</span>
                    </div>
                </div>
            )}
        </div>
    );
}