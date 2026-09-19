import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });
const data = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-data' });

export const metadata: Metadata = {
  title: 'Voltway — EV Charging Platform',
  description: 'Find, book, and monitor EV charging stations for cars and bikes in real time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${data.variable}`}>
      <body className="font-body min-h-screen bg-bg text-txt antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
