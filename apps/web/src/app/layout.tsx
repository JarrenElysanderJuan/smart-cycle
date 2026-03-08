import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: '400',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Smart Cycle — Food Waste Prevention Platform',
  description: 'Connect grocery stores with local food banks. Reduce waste, fight hunger.',
};

/**
 * Root layout — minimal shell.
 * No sidebar here; each dashboard route group provides its own sidebar.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body className="min-h-screen font-[family-name:var(--font-body)]" suppressHydrationWarning>
        <Auth0Provider>
          {children}
        </Auth0Provider>
      </body>
    </html>
  );
}
