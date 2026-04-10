import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Crucible Arena | 0G AI Coordination',
  description: 'Live visualization of the Crucible AI Agent coordination layer.',
};

import Sidebar from '@/components/Sidebar';

import Providers from '@/components/Providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen antialiased bg-[#020617] text-white flex`}>
        <Providers>
          <Sidebar />
          <main className="flex-1 ml-64 min-h-screen p-8 lg:p-12 overflow-x-hidden relative">
            {/* Ambient Glows */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] -z-10 pointer-events-none" />
            <div className="fixed bottom-0 left-[20%] w-[400px] h-[400px] bg-purple-600/5 blur-[100px] -z-10 pointer-events-none" />

            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
