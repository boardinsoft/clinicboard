'use client';

import React from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="es">
            <head>
                <style dangerouslySetInnerHTML={{
                    __html: `
          :root {
            --bg-color: #ffffff;
            --card-bg: #f4f4f4;
            --text-primary: #161616;
            --text-secondary: #525252;
            --border-color: #e0e0e0;
            --btn-bg: #001D6C;
            --btn-text: #ffffff;
            --debug-bg: #e0e0e0;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg-color: #161616;
              --card-bg: #262626;
              --text-primary: #f4f4f4;
              --text-secondary: #c6c6c6;
              --border-color: #393939;
              --debug-bg: #161616;
            }
          }
          body {
            margin: 0;
            padding: 0;
            background-color: var(--bg-color);
            color: var(--text-primary);
            font-family: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            width: 100vw;
            transition: background-color 0.3s ease;
          }
          .error-card {
            padding: 2.5rem;
            maxWidth: 500px;
            width: 90%;
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            text-align: center;
            box-shadow: 0 8px 30px rgba(0,0,0,0.1);
          }
          .icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: #001D6C;
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
          }
          p {
            font-size: 0.875rem;
            line-height: 1.5;
            color: var(--text-secondary);
            margin-bottom: 2rem;
          }
          button {
            background-color: var(--btn-bg);
            color: var(--btn-text);
            border: none;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          button:hover {
            opacity: 0.85;
          }
          .debug-area {
            margin-top: 2rem;
            text-align: left;
            font-size: 0.75rem;
            padding: 1rem;
            background-color: var(--debug-bg);
            border: 1px solid var(--border-color);
            overflow: auto;
            max-height: 150px;
          }
        `}} />
            </head>
            <body>
                <div className="error-card">
                    <div className="icon">⚠️</div>
                    <h1>Error Crítico de Aplicación</h1>
                    <p>
                        Clinicboard ha experimentado un fallo general inesperado.
                        Por favor, intente recargar la aplicación para continuar.
                    </p>

                    <button onClick={() => reset()}>
                        Reiniciar Aplicación
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="debug-area">
                            <p style={{ color: '#da1e28', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Debug (SÓLO DESARROLLO):</p>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                {error.message}
                            </pre>
                            {error.digest && (
                                <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>Digest: {error.digest}</p>
                            )}
                        </div>
                    )}
                </div>
            </body>
        </html>
    );
}
