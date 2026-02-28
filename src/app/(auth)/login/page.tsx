'use client';

import React, { useState } from 'react';
import {
    Form,
    Stack,
    TextInput,
    Button,
    InlineNotification,
    Theme
} from '@carbon/react';
import { signInWithEmail } from '@/actions/auth';
import { useTheme } from '@/providers/ThemeProvider';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { theme } = useTheme();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        const formData = new FormData(event.currentTarget);
        const result = await signInWithEmail(formData);

        if (result?.error) {
            setErrorMsg(result.error);
            setLoading(false);
        }
        // Si hay éxito, el server action hace el redirect('/')
    };

    return (
        <Theme theme={theme}>
            <div className="login-container">
                <div className="login-card">
                    <div className="login-brand">
                        <span className="brand-prefix">clinic</span>
                        <span className="brand-suffix">board</span>
                    </div>

                    <h1 className="login-title">Iniciar Sesión</h1>
                    <p className="login-subtitle">Ingresa tus credenciales para acceder</p>

                    <Form onSubmit={handleSubmit} className="login-form">
                        <Stack gap={6}>
                            {errorMsg && (
                                <InlineNotification
                                    kind="error"
                                    title="Error de autenticación"
                                    subtitle={errorMsg}
                                    lowContrast
                                    hideCloseButton
                                />
                            )}

                            <TextInput
                                id="email"
                                name="email"
                                type="email"
                                labelText="Correo Electrónico"
                                placeholder="tu@correo.com"
                                required
                            />

                            <TextInput
                                id="password"
                                name="password"
                                type="password"
                                labelText="Contraseña"
                                placeholder="••••••••"
                                required
                            />

                            <Button
                                type="submit"
                                kind="primary"
                                disabled={loading}
                                className="login-submit-btn"
                            >
                                {loading ? 'Iniciando sesión...' : 'Ingresar'}
                            </Button>
                        </Stack>
                    </Form>
                </div>

                <style jsx>{`
          .login-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: var(--cds-background);
            padding: 1rem;
          }
          .login-card {
            width: 100%;
            max-width: 448px;
            background-color: var(--cds-layer-01);
            border: 1px solid var(--cds-border-subtle);
            padding: 2.5rem 2rem;
            border-radius: 0 !important;
          }
          .login-brand {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
          }
          .brand-prefix {
            font-weight: 600;
            letter-spacing: -0.01em;
            color: var(--cds-text-primary);
          }
          .brand-suffix {
            font-weight: 300;
            color: var(--clinicboard-accent);
          }
          .login-title {
            font-size: 1.75rem;
            font-weight: 300;
            margin-bottom: 0.5rem;
            color: var(--cds-text-primary);
          }
          .login-subtitle {
            font-size: 0.875rem;
            color: var(--cds-text-secondary);
            margin-bottom: 2rem;
          }
          .login-form :global(.cds--btn) {
            width: 100%;
            max-width: 100%;
          }
        `}</style>
            </div>
        </Theme>
    );
}
