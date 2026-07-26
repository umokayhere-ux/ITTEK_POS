import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { type ReactNode } from 'react';
import { AppProviders } from '@/providers';
import { Splash } from '@/components/splash';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'iTtEk POS — Manage. Monitor. Grow.',
  description:
    'Multi-tenant Shop Management and Point of Sale SaaS for retail businesses of every size.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProviders>
          <Splash />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
