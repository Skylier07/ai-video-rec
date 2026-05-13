// Nested layout does not define Manrope nor globals.css 
// (Those are now in the root layout in app/layout.tsx)
import { TopNavBar, SideNavBar, BottomNavBar } from '@/components/Navigation';
import ScreenRecorder from '@/components/ScreenRecorder';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const session = await auth();
  // if (!session) {
  //   redirect('/signin');
  // }


  return (
    <>
      <TopNavBar />
      <div className="flex pt-16 h-screen overflow-hidden text-on-surface">
          <SideNavBar />
          <main className="flex-1 relative overflow-y-auto w-full">
            {children}
            {/* Spacer for mobile nav */}
            <div className="h-24 lg:hidden"></div>
          </main>
      </div>
      <BottomNavBar />
      <ScreenRecorder />
    </>
  );
}
