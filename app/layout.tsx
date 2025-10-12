import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import Header from '@/components/layout/Header';
import ChatbotFloating from '@/components/ChatbotFloating';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Casi Cinco - Los mejores lugares con 4.7+ estrellas',
    template: '%s | Casi Cinco',
  },
  description:
    'Descubre restaurantes, hoteles, spas y experiencias con valoraciones excepcionales de 4.7 estrellas o más. Solo los mejores lugares de España.',
  keywords: [
    'restaurantes',
    'hoteles',
    'spas',
    'experiencias',
    'valoraciones',
    '4.7 estrellas',
    'Google Maps',
    'lugares recomendados',
    'España',
  ],
  authors: [{ name: 'Casi Cinco' }],
  creator: 'Casi Cinco',
  publisher: 'Casi Cinco',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/',
    title: 'Casi Cinco - Los mejores lugares con 4.7+ estrellas',
    description:
      'Descubre restaurantes, hoteles, spas y experiencias con valoraciones excepcionales.',
    siteName: 'Casi Cinco',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Casi Cinco - Los mejores lugares con 4.7+ estrellas',
    description:
      'Descubre restaurantes, hoteles, spas y experiencias con valoraciones excepcionales.',
    creator: '@casi5app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className={inter.className}>
        <Header />
        <main>
          {children}
        </main>
        <ChatbotFloating />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
