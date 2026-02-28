import type { Metadata } from 'next';
import './globals.scss';
import { ThemeProvider } from '@/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'Clinicboard — Gestión Clínica Inteligente',
  description:
    'MVP médico FHIR-native para especialistas independientes y centros médicos. Historial clínico, agenda de citas y recetas digitales.',
  keywords: [
    'clinicboard',
    'gestión médica',
    'FHIR',
    'historial clínico',
    'citas médicas',
    'recetas digitales',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
