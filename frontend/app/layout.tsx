import './globals.css';
import { ReactNode } from 'react';
import { DashboardProvider } from '@/lib/dashboard-context';
import Sidebar from '@/components/sidebar';
import Starfield from '@/components/starfield';

export const metadata = {
  title: 'digiquant-atlas',
  description: 'AI-orchestrated market intelligence dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
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
