import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SocketProvider } from '@/components/SocketProvider';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { SwRegister } from '@/components/SwRegister';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'opsz'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
  weight: ['400'],
});

export const metadata: Metadata = {
  title: 'Garçom — TotemMesa',
  description: 'App do garçom — chamados de mesa e pedidos prontos',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#d96d4a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <SocketProvider>
          <ConnectionBadge />
          <div className="app">{children}</div>
          <SwRegister />
        </SocketProvider>
      </body>
    </html>
  );
}
