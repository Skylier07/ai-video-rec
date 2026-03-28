import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { TopNavBar, SideNavBar, BottomNavBar } from '@/components/Navigation';
import ScreenRecorder from '@/components/ScreenRecorder';

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
      <body className="bg-surface font-body text-on-surface antialiased min-h-screen selection:bg-secondary-fixed selection:text-on-secondary-fixed">
        <TopNavBar />
        <div className="flex pt-16 h-screen overflow-hidden">
          <SideNavBar />
          <main className="flex-1 relative overflow-y-auto w-full">
            {children}
            {/* Spacer for mobile nav */}
            <div className="h-24 lg:hidden"></div>
          </main>
        </div>
        <BottomNavBar />
        <ScreenRecorder />
      </body>
    </html>
  );
}
