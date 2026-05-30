import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
