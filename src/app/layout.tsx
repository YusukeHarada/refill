import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Refill - スマート在庫管理',
  description: '日用品の消費サイクルを可視化し、買い足しタイミングを予測するアプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Refill',
    startupImage: '/apple-touch-icon.png',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={notoSansJP.variable} suppressHydrationWarning>
      <body className="font-[var(--font-noto),system-ui,sans-serif] bg-[var(--background)] text-[var(--foreground)] min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
