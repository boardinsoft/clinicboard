import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
