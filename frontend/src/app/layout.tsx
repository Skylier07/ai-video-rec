import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'StudySnip - Your Academic Ally',
  description: 'Upload a photo of a problem and get verified video snippets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${manrope.variable}`}>
       <head>
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
       </head>
      {/* We apply base surface styles here. Inner layouts can wrap navs as needed */}
      <body className="bg-surface font-body text-on-surface antialiased min-h-screen selection:bg-secondary-fixed selection:text-on-secondary-fixed">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
