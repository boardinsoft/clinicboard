'use client';

import React, { useState, useRef } from 'react';
import {
    TreeView,
    TreeNode,
    OverflowMenu,
    MenuItem,
    Button,
    Tag,
} from '@carbon/react';
import {
    Document,
    Chemistry,
    Image,
    ChevronDown,
    ChevronRight,
    Add,
    Download,
    TrashCan,
    Edit,
    Upload,
    Folder,
    FolderOpen,
    DocumentPdf,
    DocumentBlank,
    Close,
    Chat,
} from '@carbon/icons-react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { usePathname } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const FILE_EXTENSION_COLORS: Record<string, string> = {
    pdf: 'red',
    jpg: 'teal',
    png: 'teal',
    dicom: 'purple',
    doc: 'blue',
    other: 'gray',
};

function FileIcon({ type }: { type: PatientFile['type'] }) {
    if (type === 'pdf') return <DocumentPdf size={16} />;
    return <DocumentBlank size={16} />;
}

function formatFileDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Section ───────────────────────────────────────────────────────────────────

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
        <TreeNode
            id={section.id}
            aria-label={section.title}
            label={
                <div className="pw-rp__section-label">
                    <Icon size={16} className="pw-rp__section-icon" />
                    <span>{section.title}</span>
                    <Tag size="sm" type="gray" className="pw-rp__count-tag">
                        {section.files.length}
                    </Tag>
                    <button
                        aria-label={`Subir archivo a ${section.title}`}
                        className="pw-rp__upload-btn"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                        <Upload size={16} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        aria-hidden="true"
                    />
                </div>
            }
        >
            {section.files.length === 0 ? (
                <TreeNode
                    id={`${section.id}-empty`}
                    isExpanded={false}
                    label={
                        <span className="pw-rp__empty-text">Sin documentos</span>
                    }
                />
            ) : (
                section.files.map((file) => (
                    <TreeNode
                        key={file.id}
                        id={file.id}
                        label={
                            <div className="pw-rp__file-row">
                                <FileIcon type={file.type} />
                                <div className="pw-rp__file-info">
                                    <span className="pw-rp__file-name" title={file.name}>{file.name}</span>
                                    <span className="pw-rp__file-meta">{formatFileDate(file.uploadedAt)}{file.size ? ` · ${file.size}` : ''}</span>
                                </div>
                                <Tag size="sm" type={FILE_EXTENSION_COLORS[file.type] as any} className="pw-rp__file-tag">
                                    {file.type.toUpperCase()}
                                </Tag>
                                <div className="pw-rp__file-actions" onClick={(e) => e.stopPropagation()}>
                                    <OverflowMenu
                                        size="sm"
                                        aria-label="Acciones del archivo"
                                        flipped
                                        menuOptionsClass="pw-rp__context-menu"
                                    >
                                        <MenuItem onClick={() => { }} label="Descargar" />
                                        <MenuItem onClick={() => { }} label="Renombrar" />
                                        <MenuItem onClick={() => { }} label="Eliminar" kind="danger" />
                                    </OverflowMenu>
                                </div>
                            </div>
                        }
                    />
                ))
            )}
        </TreeNode>
    );
}

// ── RightPanel ────────────────────────────────────────────────────────────────

const INITIAL_SECTIONS: DocumentSection[] = [
    {
        id: 'documents',
        title: 'Documentos',
        icon: Document,
        files: [],
    },
    {
        id: 'studies',
        title: 'Estudios',
        icon: Chemistry,
        files: [],
    },
    {
        id: 'imaging',
        title: 'Imagenología',
        icon: Image,
        files: [],
    },
];

export default function RightPanel({ patientId }: { patientId?: string }) {
    const { rightPanelOpen, toggleRightPanel } = useLayoutStore();
    const pathname = usePathname();
    const [sections, setSections] = useState<DocumentSection[]>(INITIAL_SECTIONS);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

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
            prev.map((s) =>
                s.id === sectionId ? { ...s, files: [...s.files, newFile] } : s
            )
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
            className={`pw-right-panel${rightPanelOpen ? '' : ' pw-right-panel--hidden'}`}
            role="complementary"
            aria-label="Panel de documentos del paciente"
            aria-hidden={!rightPanelOpen}
        >
            {/* Header */}
            <div className="pw-rp__header">
                <div className="pw-rp__header-title">
                    {isPatientView ? <Folder size={16} /> : <Chat size={16} />}
                    <span>{isPatientView ? 'Documentos' : 'Asistente IA'}</span>
                </div>
                <Button
                    kind="ghost"
                    size="sm"
                    iconDescription="Cerrar panel"
                    hasIconOnly
                    renderIcon={Close}
                    onClick={toggleRightPanel}
                    aria-label="Cerrar panel de documentos"
                    className="pw-rp__close-btn"
                />
            </div>

            {isPatientView ? (
                <>
                    {/* Tree */}
                    <nav className="pw-rp__tree" aria-label="Árbol de documentos del paciente">
                        <TreeView
                            label="Documentos del paciente"
                            hideLabel
                            className="pw-rp__treeview"
                        >
                            {sections.map((section) => (
                                <DocumentSectionNode
                                    key={section.id}
                                    section={section}
                                    onUpload={handleUpload}
                                />
                            ))}
                        </TreeView>
                    </nav>

                    {/* Drop Zone */}
                    <div
                        ref={dropZoneRef}
                        className={`pw-rp__dropzone${isDragging ? ' pw-rp__dropzone--active' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleGlobalDrop}
                        aria-label="Zona de arrastre para subir documentos"
                        role="region"
                    >
                        <Upload size={16} className="pw-rp__dropzone-icon" />
                        <span className="pw-rp__dropzone-text">
                            {isDragging ? 'Suelta para subir' : 'Arrastra archivos aquí'}
                        </span>
                    </div>
                </>
            ) : (
                <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: 'var(--cds-text-secondary)' }}>
                    <Chat size={32} style={{ marginBottom: '1rem', fill: 'var(--cds-text-secondary)', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.875rem' }}>El Asistente Médico de IA estará disponible próximamente en esta vista.</p>
                </div>
            )}
        </aside>
    );
}
