import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'ResearchFlow - AI-Powered Research Paper Assistant',
  description: 'Write better research papers with structured outlines, AI feedback, and citation management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}