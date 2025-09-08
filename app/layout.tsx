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
      {/* Give body minimal height + theme colors; do NOT add overflow-hidden */}
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
