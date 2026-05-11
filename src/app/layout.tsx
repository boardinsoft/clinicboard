import type { Metadata } from 'next';
import { Outfit, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
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
  icons: {
    icon: '/brand/favicon.svg',
    apple: '/brand/apple-touch-icon.png',
    shortcut: '/brand/favicon.svg',
  },
  manifest: '/brand/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${mono.variable}`} suppressHydrationWarning>
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
