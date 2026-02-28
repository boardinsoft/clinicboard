'use client';

import React from 'react';
import { InlineNotification, Button } from '@carbon/react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div style={{
            padding: '3rem',
            backgroundColor: 'var(--cds-background)',
            minHeight: 'calc(100vh - 48px)',
            color: 'var(--cds-text-primary)',
            transition: 'background-color 0.3s ease'
        }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <InlineNotification
                    kind="error"
                    lowContrast
                    title="Algo salió mal"
                    subtitle="El dashboard tuvo un problema al cargar esta sección. Por favor, intenta de nuevo."
                    hideCloseButton
                    style={{ marginBottom: '1rem', width: '100%' }}
                />
                <Button kind="secondary" size="sm" onClick={() => reset()} style={{ marginBottom: '2rem' }}>
                    Reintentar carga
                </Button>

                {process.env.NODE_ENV === 'development' && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1.5rem',
                        border: '1px solid var(--cds-border-subtle)',
                        background: 'var(--cds-layer-01)',
                        fontSize: '0.875rem'
                    }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Debug Info (Development Only):</p>
                        {error.digest && (
                            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.5rem' }}>
                                Digest: {error.digest}
                            </p>
                        )}
                        <pre style={{
                            fontSize: '0.75rem',
                            whiteSpace: 'pre-wrap',
                            color: 'var(--cds-text-secondary)',
                            fontFamily: 'monospace',
                            margin: 0
                        }}>
                            {error.message}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
