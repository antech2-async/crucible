import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Crucible Arena | 0G AI Coordination',
  description: 'Live visualization of the Crucible AI Agent coordination layer.',
};

import DashboardLayout from '@/components/DashboardLayout';
import Providers from '@/components/Providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${inter.className} min-h-screen antialiased bg-[#020617] text-white flex`}
        suppressHydrationWarning
      >
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}
