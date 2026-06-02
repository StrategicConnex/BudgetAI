import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// V-01: Validar variables de entorno al iniciar la app (solo server-side)
if (typeof globalThis !== 'undefined' && typeof window === 'undefined') {
  // Usamos import dinámico para evitar problemas con Turbopack al compilar
  import('@/lib/env-validate').then(({ logEnvStatus }) => logEnvStatus()).catch(() => {});
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BudgetAI — Generador de Presupuestos Inteligente',
    template: '%s | BudgetAI',
  },
  description:
    'Plataforma AI para generar presupuestos profesionales en segundos. Analiza texto e imágenes con Gemini y exporta a PDF o Word.',
  keywords: ['presupuestos', 'AI', 'construcción', 'PDF', 'Gemini'],
  authors: [{ name: 'BudgetAI' }],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    title: 'BudgetAI — Generador de Presupuestos con IA',
    description: 'Genera presupuestos profesionales desde texto e imágenes con inteligencia artificial.',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: 'hsl(239, 84%, 67%)',
};

import { Toaster } from '@/components/ui/Toaster';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
