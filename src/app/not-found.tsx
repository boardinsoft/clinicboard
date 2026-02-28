import React from 'react';
import Link from 'next/link';
import { Button } from '@carbon/react';
import { Home } from '@carbon/icons-react';

export default function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            textAlign: 'center',
            backgroundColor: 'var(--cds-background)',
            color: 'var(--cds-text-primary)'
        }}>
            {/* Brand Logo/Name */}
            <div style={{ marginBottom: '3rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                    clinic
                </span>
                <span style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--clinicboard-accent)' }}>
                    board
                </span>
            </div>

            {/* Error Code */}
            <h1 style={{
                fontSize: '8rem',
                fontWeight: 300,
                lineHeight: 1,
                margin: 0,
                color: 'var(--clinicboard-blue)'
            }}>
                404
            </h1>

            {/* Message */}
            <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 400,
                marginBottom: '2rem',
                color: 'var(--cds-text-secondary)'
            }}>
                Página no encontrada
            </h2>

            <p style={{
                maxWidth: '400px',
                marginBottom: '3rem',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                color: 'var(--cds-text-placeholder)'
            }}>
                Lo sentimos, la ruta que intentas acceder no existe o ha sido movida permanentemente.
            </p>

            {/* Action */}
            <Link href="/" passHref legacyBehavior>
                <Button
                    kind="ghost"
                    style={{ padding: '0 2rem' }}
                >
                    Volver al inicio
                </Button>
            </Link>
        </div>
    );
}
