import './globals.css';
import { ReactNode } from 'react';
import { Inter, Space_Mono } from 'next/font/google';
import { DashboardProvider } from '@/lib/dashboard-context';
import Sidebar from '@/components/sidebar';
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
  title: 'digiquant-atlas',
  description: 'AI-orchestrated market intelligence dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`min-h-screen bg-bg-primary text-text-primary antialiased ${inter.variable} ${spaceMono.variable}`}>
        <Starfield />
        <DashboardProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-y-auto max-h-screen">
              {children}
            </main>
          </div>
        </DashboardProvider>
      </body>
    </html>
  );
}
