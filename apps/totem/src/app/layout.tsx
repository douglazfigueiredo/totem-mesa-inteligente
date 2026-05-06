import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SocketProvider } from '@/components/SocketProvider';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { TimerWidget } from '@/components/TimerWidget';
import { ReadyOverlay } from '@/components/ReadyOverlay';
import { UnavailableModal } from '@/components/UnavailableModal';

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
  title: 'TotemMesa',
  description: 'Totem de mesa inteligente',
  manifest: '/manifest.json',
  applicationName: 'TotemMesa',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#c14a26',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <SocketProvider>
          <ConnectionBadge />
          <div className="app">{children}</div>
          <TimerWidget />
          <ReadyOverlay />
          <UnavailableModal />
        </SocketProvider>
      </body>
    </html>
  );
}
