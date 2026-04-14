import './globals.css';
import { ReactNode, Suspense } from 'react';
import { Inter, Space_Mono } from 'next/font/google';
import { DashboardProvider } from '@/lib/dashboard-context';
import { AppShellProvider } from '@/components/app-shell-context';
import Sidebar from '@/components/sidebar';
import MobileAppBar from '@/components/mobile-app-bar';
import Starfield from '@/components/starfield';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata = {
  title: 'Atlas',
  description: 'AI-orchestrated market intelligence dashboard',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`min-h-screen bg-bg-primary text-text-primary antialiased ${inter.variable} ${spaceMono.variable}`}>
        <Starfield />
        <DashboardProvider>
          <AppShellProvider>
            <div className="flex min-h-screen">
              <Suspense fallback={<aside className="w-[260px] shrink-0 border-r border-border-subtle bg-bg-glass" />}>
                <Sidebar />
              </Suspense>
              <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto max-h-screen">
                <MobileAppBar />
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
              </main>
            </div>
          </AppShellProvider>
        </DashboardProvider>
      </body>
    </html>
  );
}
