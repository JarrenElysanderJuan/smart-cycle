import type { Metadata } from 'next';
import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import './globals.css';

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
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        <Auth0Provider>
          {children}
        </Auth0Provider>
      </body>
    </html>
  );
}
